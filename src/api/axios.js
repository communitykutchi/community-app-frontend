// src/api/axios.ts
// import axios from 'axios';
// const api = axios.create({
//   baseURL: process.env.REACT_APP_API_URL,
//   withCredentials: false, // we use token auth, not cookies
// });
// // helper to attach token after login
// export function setAuthToken(token?: string) {
//   if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//   else delete api.defaults.headers.common['Authorization'];
// }
// export default api;
import axios from "axios";
const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
});
API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
export default API;
