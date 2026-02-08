import axios from "axios";
import humps from "humps";

// In production (Vercel), use the Railway backend URL. In dev, proxy through Vite.
const API_BASE = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : "/api";

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        "Content-Type": "application/json",
    },
});

// Convert snake_case responses to camelCase
api.interceptors.response.use((response) => {
    if (response.data) {
        response.data = humps.camelizeKeys(response.data);
    }
    return response;
});

// Convert camelCase requests to snake_case
api.interceptors.request.use((config) => {
    if (config.data) {
        config.data = humps.decamelizeKeys(config.data);
    }
    if (config.params) {
        config.params = humps.decamelizeKeys(config.params);
    }
    return config;
});

export default api;
