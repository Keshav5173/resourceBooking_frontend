import axios from "axios";
import Cookies from "js-cookie";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Where the app should land when both tokens are dead.
const LOGGED_OUT_REDIRECT = "/login";

const ACCESS_TOKEN_COOKIE = "accessToken";
const REFRESH_TOKEN_COOKIE = "refreshToken";

const cookieOptions = {
  secure: window.location.protocol === "https:",
  sameSite: "strict",
};

// ---- token helpers ---------------------------------------------------------

export function getAccessToken() {
  return Cookies.get(ACCESS_TOKEN_COOKIE);
}

export function getRefreshToken() {
  return Cookies.get(REFRESH_TOKEN_COOKIE);
}

export function setTokens({ accessToken, refreshToken }) {
  if (accessToken) {
    Cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
      ...cookieOptions,
      expires: 1 / 96,
    });
  }

  if (refreshToken) {
    Cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...cookieOptions,
      expires: 7,
    });
  }
}

export function clearTokens() {
  Cookies.remove(ACCESS_TOKEN_COOKIE);
  Cookies.remove(REFRESH_TOKEN_COOKIE);
}

// ---- axios instances -------------------------------------------------------

// Main instance: used for all authenticated calls.
const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Plain instance with NO interceptors: used for login/register/refresh
// so they can never trigger the refresh logic themselves.
const refreshClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ---- single shared refresh -------------------------------------------------

// All callers (interceptors, ProtectedRoute) share one in-flight request.
// This matters because the backend rotates refresh tokens: sending the same
// refresh token twice would make the second call fail.
let refreshPromise = null;

export function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  const refreshToken = getRefreshToken();
  if (!refreshToken) return Promise.reject(new Error("No refresh token"));

  refreshPromise = refreshClient
    .post("/user/refresh-token", { refreshToken })
    .then(({ data }) => {
      // console.log("Refreshed access token:", data.data);
      const { accessToken, refreshToken } = data.data;
      setTokens({
        accessToken,
        refreshToken,
      });
      return accessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

function redirectToLogin() {
  clearTokens();
  // Full reload clears any in-memory app/user state along with the tokens.
  if (window.location.pathname !== LOGGED_OUT_REDIRECT) {
    window.location.href = LOGGED_OUT_REDIRECT;
  }
}

// ---- request interceptor ---------------------------------------------------

// Proactive: if the access cookie has expired but a refresh token exists,
// refresh BEFORE sending the request.
api.interceptors.request.use(async (config) => {
  let token = getAccessToken();

  if (!token && getRefreshToken()) {
    try {
      token = await refreshAccessToken();
    } catch (err) {
      redirectToLogin();
      return Promise.reject(err);
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- response interceptor --------------------------------------------------

// Reactive: the server rejected the token with a 401, so refresh and retry once.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Not a 401, no request config, or already retried once: give up.
    if (status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    try {
      const newAccessToken = await refreshAccessToken();
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh token is expired/invalid too: nothing left to try.
      redirectToLogin();
      return Promise.reject(refreshError);
    }
  }
);

export default api;

// ---- auth API calls --------------------------------------------------------

export async function login({ email, password }) {
  const { data } = await refreshClient.post("/user/login", { email, password });

  setTokens({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });
  return data;
}


// export const getCurrentUser = async () => {
//   try {
//     const { data } = await api.get(CURRENT_USER_ENDPOINT);
//     return data.data ?? data;
//   } catch (error) {
//     throw new Error(
//       error.response?.data?.message || error.message || "Could not load profile"
//     );
//   }
// };

export async function register({ fullName, state, city, username, email, password }) {
  // The backend's registerUser does not return tokens, so don't call setTokens here.
  // After a successful register, send the user to the login page.
  const { data } = await refreshClient.post("/user/register", {
    fullName,
    state,
    city,
    username,
    email,
    password,
  });

  return data.data; // the created user
}

export async function logout() {
  try {
    await api.post("/user/logout");
  } catch (error) {
    const status = error.response?.status;
    if (status !== 401 && status !== 409) {
      console.error("Logout request failed:", error);
    }
  } finally {
    clearTokens();
    window.location.href = "/login";
  }
}