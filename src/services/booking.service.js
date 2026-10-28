import api from "./auth.services.js"; 

const getErrorMessage = (error) =>
  error.response?.data?.message || error.message || "Something went wrong";


export const getResources = async () => {
  try {
    const { data } = await api.get("/resource/getResources");
    return data.data; 
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};


export const createBooking = async ({ resourceId, date }) => {
  try {
    const { data } = await api.post("/booking/createBooking", {
      resourceId,
      date,
    });
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const createResource = async ({ name, detail }) => {
  try {
    const { data } = await api.post("/resource/createResource", {
      name,
      detail,
    });
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const getBookingHistory = async () => {
  try {
    const { data } = await api.get("/booking/getBookingHistory");
    return data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const getBookingStats = async () => {
  try {
    const { data } = await api.get("/booking/getBookingStats");
    return data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};