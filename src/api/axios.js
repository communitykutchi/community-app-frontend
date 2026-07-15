import axios from "axios";
import { getAuthToken } from "../auth/session.js";
const baseURL = import.meta.env.DEV
    ? import.meta.env.VITE_API_URL || "/api"
    : import.meta.env.VITE_API_URL || "https://community-app-backend-wrb0.onrender.com";
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
export default API;
