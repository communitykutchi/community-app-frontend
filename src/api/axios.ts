import axios from "axios";
import { getAuthToken, clearAuthToken } from "../auth/session";

const baseURL = import.meta.env.VITE_API_URL || "https://localhost:5000";

const API = axios.create({
  baseURL,
});

API.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const data = error.response?.data;
      const message = data?.message || "Your account was logged in on another device. You have been logged out.";
      clearAuthToken();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        alert(message);
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default API;
