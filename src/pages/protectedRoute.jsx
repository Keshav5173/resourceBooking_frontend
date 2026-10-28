import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getAccessToken, getRefreshToken, refreshAccessToken, clearTokens } from "../services/auth.services";

function ProtectedRoute() {
  const [status, setStatus] = useState(() =>
    getAccessToken() ? "ok" : getRefreshToken() ? "refreshing" : "denied"
  );

  useEffect(() => {
    if (status !== "refreshing") return;
    let cancelled = false;

    refreshAccessToken()
      .then(() => !cancelled && setStatus("ok"))
      .catch(() => {
        clearTokens();
        if (!cancelled) setStatus("denied");
      });

    return () => { cancelled = true; };
  }, [status]);

  if (status === "refreshing") return null;
  if (status === "denied") return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default ProtectedRoute;