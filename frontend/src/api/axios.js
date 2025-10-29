import axios from 'axios';

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

export default apiClient;
