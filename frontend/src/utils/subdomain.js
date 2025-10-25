// En desarrollo, el subdominio se pasa como un parámetro de consulta (query param).
const isDevelopment = process.env.NODE_ENV === 'development';

export const getSubdomain = () => {
  // En producción, se extraería del host.
  if (!isDevelopment) {
    const host = window.location.host;
    const parts = host.split('.');
    if (parts.length >= 3 && parts[0] !== 'www') {
      return parts[0];
    }
    return null;
  }
  
  // EN DESARROLLO (NUESTRA LÓGICA CLAVE):
  // Buscamos el parámetro 'tenant' en la URL actual.
  const params = new URLSearchParams(window.location.search);
  const tenantFromUrl = params.get('tenant');

  if (tenantFromUrl) {
    // Si la URL lo tiene, lo guardamos en sessionStorage para "recordarlo" durante la redirección.
    sessionStorage.setItem('dev_tenant', tenantFromUrl);
    return tenantFromUrl;
  }
  
  // Si la URL no lo tiene (porque ya nos redirigieron a /login), leemos el que guardamos.
  return sessionStorage.getItem('dev_tenant');
};

export const clearSubdomain = () => {
  sessionStorage.removeItem('dev_tenant');
};