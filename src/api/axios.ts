import axios from "axios";
import { getAuthToken, triggerSessionExpired } from "../auth/session";

const resolveBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && (envUrl.startsWith("http://") || envUrl.startsWith("https://"))) {
    return envUrl.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return "http://localhost:5000/api";
  }
  return "https://backend.kutchicommunity.com/api";
};

const API = axios.create({
  baseURL: resolveBaseUrl(),
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
        const isAuthRoute =
          typeof window !== "undefined" &&
          (window.location.pathname === "/login" ||
            window.location.pathname === "/register" ||
            window.location.pathname === "/banned");

        if (!isAuthRoute) {
          const data = error.response?.data;
          const message =
            data?.message ||
            "Your account was logged in on another device. You have been logged out automatically.";
          triggerSessionExpired(message);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default API;
