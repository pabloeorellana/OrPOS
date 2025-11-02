export const getTenantFromPath = () => {
    // Extrae la primera parte del path de la URL. Ej: "/mercadito/dashboard" -> "mercadito"
    const pathParts = window.location.pathname.split('/').filter(part => part !== '');
    if (pathParts.length > 0) {
        // Asumimos que la primera parte es siempre el identificador del tenant
        return pathParts[0];
    }
    return null;
};