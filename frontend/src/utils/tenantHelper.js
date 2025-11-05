export const getTenantFromPath = () => {
    // Lista extendida de rutas reservadas que NO pueden ser tenants
    const reservedPaths = [
        'login', 'admin', '404-tenant', 'tenant-login', 'superadmin', 'plans', 'permissions-admin',
        'dashboard', 'pos', 'sales-history', 'shifts-history', 'purchases', 'products', 'categories',
        'suppliers', 'users', 'settings', 'audit', 'reports', 'permissions', 'business-settings'
    ];

    const pathParts = window.location.pathname.split('/').filter(part => part !== '');

    if (pathParts.length > 0) {
        const potentialTenant = pathParts[0];
        // Si el primer segmento de la ruta NO está en nuestra lista reservada,
        // asumimos que es un identificador de tenant.
        if (!reservedPaths.includes(potentialTenant)) {
            return potentialTenant;
        }
    }
    // Si no se cumple lo anterior, no estamos en una ruta de tenant.
    return null;
};