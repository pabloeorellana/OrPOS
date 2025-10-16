import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:3001/api', // La base de nuestra URL de la API
});

// Interceptor: esta función se ejecutará ANTES de cada petición
apiClient.interceptors.request.use(
    (config) => {
        // Obtenemos el token de localStorage
        const token = localStorage.getItem('token');
        if (token) {
            // Si hay token, lo añadimos a la cabecera de autorización
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;