const express = require('express');
const db = require('../db');
const router = express.Router();

// Middleware: Superadmin O Administrador de Tenant con permiso para gestionar usuarios
const canManageUsers = (req, res, next) => {
    const isSuperAdmin = req.user && req.user.isSuperAdmin;
    const isTenantAdminWithPerms = req.user && !req.user.isSuperAdmin && req.user.permissions.includes('users:manage');
    
    if (isSuperAdmin || isTenantAdminWithPerms) {
        next();
    } else {
        res.status(403).json({ message: 'No tienes permiso para gestionar usuarios y roles.' });
    }
};

// Middleware: Solo Superadmin
const superadminOnly = (req, res, next) => {
    if (req.user && req.user.isSuperAdmin) {
        next();
    } else {
        res.status(403).json({ message: 'Acceso denegado. Se requieren privilegios de Superadministrador.' });
    }
};


// --- INICIO DE DEFINICIÓN DE RUTAS ---

// Rutas CRUD para Permisos Globales (SOLO SUPERADMIN)
router.post('/', superadminOnly, async (req, res) => {
    const { action, description } = req.body;
    if (!action || !description) {
        return res.status(400).json({ message: 'La acción y la descripción son requeridas.' });
    }
    try {
        const [result] = await db.query(
            'INSERT INTO permissions (action, description) VALUES (?, ?)',
            [action, description]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'La acción del permiso ya existe.' });
        }
        res.status(500).json({ message: 'Error al crear el permiso.' });
    }
});

router.put('/:id', superadminOnly, async (req, res) => {
    const { id } = req.params;
    const { action, description } = req.body;
    if (!action || !description) {
        return res.status(400).json({ message: 'La acción y la descripción son requeridas.' });
    }
    try {
        const [result] = await db.query(
            'UPDATE permissions SET action = ?, description = ? WHERE id = ?',
            [action, description, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Permiso no encontrado.' });
        }
        res.json({ message: 'Permiso actualizado.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'La acción del permiso ya existe.' });
        }
        res.status(500).json({ message: 'Error al actualizar el permiso.' });
    }
});

router.delete('/:id', superadminOnly, async (req, res) => {
    const { id } = req.params;
    try {
        const [roles] = await db.query('SELECT role_id FROM role_permissions WHERE permission_id = ?', [id]);
        if (roles.length > 0) {
            return res.status(400).json({ message: 'No se puede eliminar, el permiso está asignado a uno o más roles.' });
        }
        const [result] = await db.query('DELETE FROM permissions WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Permiso no encontrado.' });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el permiso.' });
    }
});


// Rutas para Gestión de Roles (Superadmin y Tenant Admin)

router.get('/roles', canManageUsers, async (req, res) => {
    try {
        if (req.user.isSuperAdmin) {
            const [roles] = await db.query('SELECT * FROM roles ORDER BY tenant_id, name ASC');
            return res.json(roles);
        } else {
            const tenantId = req.user.tenantId;
            const [roles] = await db.query('SELECT * FROM roles WHERE tenant_id = ? ORDER BY name ASC', [tenantId]);
            return res.json(roles);
        }
    } catch (error) {
        console.error("Error al obtener roles:", error);
        return res.status(500).json({ message: "Error interno del servidor." });
    }
});

router.get('/all', canManageUsers, async (req, res) => {
    try {
        const [permissions] = await db.query('SELECT * FROM permissions ORDER BY action ASC');
        res.json(permissions);
    } catch (error) {
        console.error("Error al obtener todos los permisos:", error);
        return res.status(500).json({ message: "Error interno del servidor." });
    }
});

router.get('/role/:id', canManageUsers, async (req, res) => {
    const { id } = req.params;
    try {
        if (!req.user.isSuperAdmin) {
            const [roleCheck] = await db.query('SELECT tenant_id FROM roles WHERE id = ?', [id]);
            if (roleCheck.length === 0 || roleCheck[0].tenant_id !== req.user.tenantId) {
                return res.status(403).json({ message: 'No puedes acceder a este rol.' });
            }
        }
        const [permissions] = await db.query('SELECT p.id, p.action FROM permissions p JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = ?', [id]);
        res.json(permissions);
    } catch (error) {
        console.error("Error al obtener permisos del rol:", error);
        return res.status(500).json({ message: "Error interno del servidor." });
    }
});

router.put('/role/:id', canManageUsers, async (req, res) => {
    const { id } = req.params;
    const { permissionIds } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        if (!req.user.isSuperAdmin) {
            const [roleCheck] = await connection.query('SELECT tenant_id FROM roles WHERE id = ?', [id]);
            if (roleCheck.length === 0 || roleCheck[0].tenant_id !== req.user.tenantId) {
                await connection.rollback();
                return res.status(403).json({ message: 'No puedes modificar este rol.' });
            }
        }
        await connection.query('DELETE FROM role_permissions WHERE role_id = ?', [id]);
        if (permissionIds && permissionIds.length > 0) {
            const values = permissionIds.map(permissionId => [id, permissionId]);
            await connection.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ?', [values]);
        }
        await connection.commit();
        res.json({ message: 'Permisos actualizados correctamente.' });
    } catch (error) {
        await connection.rollback();
        console.error("Error al actualizar permisos:", error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    } finally {
        connection.release();
    }
});

module.exports = router;