import axios from "axios";
import { getAuthToken, clearAuthToken } from "../auth/session";

const baseURL = import.meta.env.VITE_API_URL || "https://backend.kutchicommunity.com/api";

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
      const url = String(error.config?.url || "");
      const isLogoutOrPresence =
        url.includes("/auth/logout") ||
        url.includes("/users/presence") ||
        url.includes("/presence") ||
        Boolean(error.config?.skipAuthAlert);

      if (!isLogoutOrPresence) {
        clearAuthToken();
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          const data = error.response?.data;
          const message = data?.message || "Your account was logged in on another device. You have been logged out.";
          alert(message);
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default API;
