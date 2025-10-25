import axios from 'axios';

// Use Vite environment variable when available. In production set VITE_API_BASE_URL
// to the API base (e.g. https://api.mydomain.com/api). Fallback to localhost
// for development.
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
    baseURL: API_BASE,
});

// Ya NO necesitamos el interceptor. AuthContext.jsx ahora es la única
// fuente de verdad para el token de autorización.

export default apiClient;