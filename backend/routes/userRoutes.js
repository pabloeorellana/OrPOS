// --- backend/routes/userRoutes.js COMPLETO ---
const express = require('express');
const bcrypt = require('bcrypt');
const { hasPermission } = require('../middleware/authMiddleware');
const db = require('../db');
const { logAction } = require('../utils/logger');
const router = express.Router();
const saltRounds = 10;
router.get('/', hasPermission('users:view'), async (req, res) => {
    const tenantId = req.user.tenantId;
    try {
        const query = `
            SELECT u.id, u.username, r.name as role 
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.tenant_id = ?
        `;
        const [rows] = await db.query(query, [tenantId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: "Error en el servidor." });
    }
});
router.post('/', hasPermission('users:manage'), async (req, res) => {
    const { username, password, role_id } = req.body;
    const tenantId = req.user.tenantId;
    if (!username || !password || !role_id) {
        return res.status(400).json({ message: "Usuario, contraseña y ID de rol son requeridos." });
    }
    try {
        const [planInfo] = await db.query(`
            SELECT p.max_users 
            FROM plans p
            JOIN tenants t ON p.id = t.plan_id
            WHERE t.id = ?
        `, [tenantId]);
        if (planInfo.length > 0) {
            const maxUsers = planInfo[0].max_users;
            const [userCountResult] = await db.query('SELECT COUNT(id) as count FROM users WHERE tenant_id = ?', [tenantId]);
            const currentUserCount = userCountResult[0].count;
            if (currentUserCount >= maxUsers) {
                return res.status(403).json({ message: `Límite de ${maxUsers} usuarios alcanzado para su plan.` });
            }
        }
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const [result] = await db.query('INSERT INTO users (username, password, role_id, tenant_id) VALUES (?, ?, ?, ?)', [username, hashedPassword, role_id, tenantId]);
        const [roleRows] = await db.query('SELECT name FROM roles WHERE id = ?', [role_id]);
        const roleName = roleRows[0]?.name || 'desconocido';
        await logAction(req.user.id, 'USER_CREATE', req.user.tenantId, { createdUserId: result.insertId, username: username, role: roleName });
        res.status(201).json({ id: result.insertId, username, role: roleName });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'El nombre de usuario ya existe.' });
        }
        res.status(500).json({ message: "Error al crear el usuario." });
    }
});
router.delete('/:id', hasPermission('users:manage'), async (req, res) => {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    if (req.user.id === parseInt(id)) {
        return res.status(400).json({ message: "No puedes eliminar tu propia cuenta." });
    }
    try {
        const [result] = await db.query('DELETE FROM users WHERE id = ? AND tenant_id = ?', [id, tenantId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }
        await logAction(req.user.id, 'USER_DELETE', req.user.tenantId, { deletedUserId: id });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar el usuario." });
    }
});
module.exports = router;