import axios from 'axios';
import { getTenantFromPath } from '../utils/tenantHelper';

/**
 * 🔧 Configuración dinámica de la baseURL según el dominio actual
 * - Si el host es un subdominio (ej: tienda1.orpos.site) → usa https://api.tienda1.orpos.site/api
 * - Si no, usa el dominio principal → https://api.orpos.site/api
 * - En desarrollo: fallback a localhost
 */
const host = window.location.hostname; // ej: tienda1.orpos.site
const isTenant = host.endsWith('.orpos.site') && host.split('.').length >= 3;

const API_BASE =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:3001/api'
    : isTenant
    ? `https://api.${host}/api`
    : 'https://api.orpos.site/api';

const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // ✅ permite cookies / sesiones
});

// Logging mínimo en desarrollo
apiClient.interceptors.request.use((config) => {
  if (import.meta.env.MODE === 'development') {
    // Añade info mínima para depuración
    console.debug('[api] Request:', config.method?.toUpperCase(), config.url, config.params || '', config.data || '');
  }
  return config;
}, (error) => {
  console.error('[api] Request error:', error);
  return Promise.reject(error);
});

apiClient.interceptors.response.use((response) => {
  if (import.meta.env.MODE === 'development') {
    console.debug('[api] Response:', response.config.url, response.status, response.data);
  }
  return response;
}, (error) => {
  const status = error?.response?.status;
  if (status === 404) {
    if (import.meta.env.MODE === 'development') {
      console.debug('[api] Response 404:', error?.config?.url, error?.response?.data);
    }
  } else {
    console.error('[api] Response error:', error?.config?.url, status, error?.response?.data || error.message);
  }
  if (status === 401 || status === 403) {
    try {
      localStorage.removeItem('session');
      const tenant = getTenantFromPath();
      if (tenant) {
        // Mantener consistencia con el patrón de rutas /<tenant>/login
        window.location.href = `/${encodeURIComponent(tenant)}/login`;
      } else {
        window.location.href = '/login';
      }
    } catch (e) {
      console.error('[api] Error handling auth redirect:', e);
    }
  }
  return Promise.reject(error);
});

export default apiClient;
