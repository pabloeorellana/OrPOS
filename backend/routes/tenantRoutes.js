const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const { logAction } = require('../utils/logger');
const router = express.Router();

const saltRounds = 10;

// Middleware para asegurar que solo el Superadmin acceda
const superadminOnly = (req, res, next) => {
    if (req.user && req.user.isSuperAdmin) {
        next();
    } else {
        res.status(403).json({ message: 'Acceso denegado. Se requieren privilegios de Superadministrador.' });
    }
};

// Middleware para administradores de tenant (NO superadmins)
const tenantAdminOnly = (req, res, next) => {
    if (req.user && !req.user.isSuperAdmin && req.user.permissions.includes('settings:manage')) {
        next();
    } else {
        res.status(403).json({ message: 'Acceso denegado.' });
    }
};

// --- INICIO DE DEFINICIÓN DE RUTAS ---

// (Public resolve endpoint moved to tenantPublicRoutes.js to keep public endpoints
// outside the protected '/api' router.)


// 1. RUTAS PARA TENANT ADMIN (las más específicas van primero)
router.get('/my-business', tenantAdminOnly, async (req, res) => {
    const tenantId = req.user.tenantId;
    try {
        const [tenantInfo] = await db.query(`
            SELECT t.name, p.name as plan_name, p.max_users, p.max_products
            FROM tenants t
            LEFT JOIN plans p ON t.plan_id = p.id
            WHERE t.id = ?
        `, [tenantId]);
        if (tenantInfo.length === 0) return res.status(404).json({ message: "No se encontró la información de su negocio."});
        const [userCount] = await db.query('SELECT COUNT(id) as count FROM users WHERE tenant_id = ?', [tenantId]);
        const [productCount] = await db.query('SELECT COUNT(id) as count FROM products WHERE tenant_id = ?', [tenantId]);
        res.json({
            ...tenantInfo[0],
            current_users: userCount[0].count,
            current_products: productCount[0].count,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

router.put('/my-business', tenantAdminOnly, async (req, res) => {
    const { name } = req.body;
    const tenantId = req.user.tenantId;
    if (!name) return res.status(400).json({ message: 'El nombre es requerido.'});
    try {
        await db.query('UPDATE tenants SET name = ? WHERE id = ?', [name, tenantId]);
        await logAction(req.user.id, 'TENANT_SELF_UPDATE', tenantId, { changes: { name } });
        res.json({ message: 'Nombre del negocio actualizado.'});
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar.' });
    }
});

// 2. RUTAS PARA SUPERADMIN
router.get('/', superadminOnly, async (req, res) => {
    try {
        const query = `
            SELECT t.*, p.name as plan_name 
            FROM tenants t
            LEFT JOIN plans p ON t.plan_id = p.id
            ORDER BY t.name ASC
        `;
        const [tenants] = await db.query(query);
        res.json(tenants);
    } catch (error) { res.status(500).json({ message: 'Error en el servidor.' }); }
});

router.get('/plans', superadminOnly, async (req, res) => {
    try {
        const [plans] = await db.query('SELECT * FROM plans ORDER BY price ASC');
        res.json(plans);
    } catch (error) { res.status(500).json({ message: 'Error en el servidor.' }); }
});

router.post('/', superadminOnly, async (req, res) => {
    const { tenantName, adminUsername, adminPassword, subdomain } = req.body;
    if (!tenantName || !adminUsername || !adminPassword || !subdomain) {
        return res.status(400).json({ message: 'Todos los campos son requeridos, incluyendo el subdominio.' });
    }
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        const [tenantResult] = await connection.query('INSERT INTO tenants (name, subdomain) VALUES (?, ?)', [tenantName, subdomain]);
        const newTenantId = tenantResult.insertId;
        const [adminRoleResult] = await connection.query('INSERT INTO roles (name, tenant_id) VALUES (?, ?)', ['administrador', newTenantId]);
        const adminRoleId = adminRoleResult.insertId;
        const [ownerRoleResult] = await connection.query('INSERT INTO roles (name, tenant_id) VALUES (?, ?)', ['propietario', newTenantId]);
        const ownerRoleId = ownerRoleResult.insertId;
        const [employeeRoleResult] = await connection.query('INSERT INTO roles (name, tenant_id) VALUES (?, ?)', ['empleado', newTenantId]);
        const employeeRoleId = employeeRoleResult.insertId;
        
        const [allPermissions] = await connection.query('SELECT id, action FROM permissions');
        if (allPermissions.length > 0) {
            const adminPermissions = allPermissions.map(p => [adminRoleId, p.id]);
            await connection.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ?', [adminPermissions]);
            
            const ownerPermissions = allPermissions.filter(p => !['users:manage', 'audit:view'].includes(p.action)).map(p => [ownerRoleId, p.id]);
            if (ownerPermissions.length > 0) { await connection.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ?', [ownerPermissions]); }
            
            const employeePermissions = allPermissions.filter(p => ['pos:use', 'sales:history:view_own', 'returns:create', 'products:manage'].includes(p.action)).map(p => [employeeRoleId, p.id]);
            if (employeePermissions.length > 0) { await connection.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ?', [employeePermissions]); }
        }
        
        const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);
        await connection.query('INSERT INTO users (username, password, role_id, tenant_id) VALUES (?, ?, ?, ?)', [adminUsername, hashedPassword, adminRoleId, newTenantId]);
        
        await connection.query("INSERT INTO settings (tenant_id, setting_key, setting_value) VALUES (?, 'table_service_fee', '0')", [newTenantId]);
        
        await connection.commit();
        await logAction(req.user.id, 'TENANT_CREATE', null, { newTenantId, tenantName });
        res.status(201).json({ message: `Negocio '${tenantName}' creado exitosamente.` });
    } catch (error) {
        await connection.rollback();
        if (error.code === 'ER_DUP_ENTRY') {
            let message = 'El valor ya existe.';
            if (error.message.includes('tenants.name')) message = 'El nombre del negocio ya existe.';
            else if (error.message.includes('tenants.subdomain')) message = 'El subdominio ya está en uso.';
            else if (error.message.includes('users.username')) message = 'El nombre de usuario del administrador ya existe globalmente.';
            return res.status(409).json({ message });
        }
        res.status(500).json({ message: 'Error en el servidor al crear el negocio.' });
    } finally {
        connection.release();
    }
});

// Rutas con parámetros (:id) van al final para evitar conflictos
router.get('/:id/users', superadminOnly, async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT u.id, u.username, r.name as role 
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.tenant_id = ?
        `;
        const [users] = await db.query(query, [id]);
        res.json(users);
    } catch (error) { res.status(500).json({ message: 'Error al obtener usuarios del negocio.' }); }
});

router.put('/:id', superadminOnly, async (req, res) => {
    const { id } = req.params;
    const { name, status, plan_id, subscription_ends_at } = req.body;
    try {
        const [result] = await db.query(
            'UPDATE tenants SET name = ?, status = ?, plan_id = ?, subscription_ends_at = ? WHERE id = ?',
            [name, status, plan_id, subscription_ends_at, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Negocio no encontrado.' });
        await logAction(req.user.id, 'TENANT_UPDATE', null, { tenantId: id, changes: req.body });
        res.json({ message: 'Negocio actualizado correctamente.' });
    } catch (error) {
        console.error("Error al actualizar tenant:", error);
        res.status(500).json({ message: 'Error en el servidor al actualizar.' });
    }
});

module.exports = router;