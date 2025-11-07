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

router.put('/:id', hasPermission('users:manage'), async (req, res) => {
    const { id } = req.params;
    const { role_id, password } = req.body;
    const tenantId = req.user.tenantId;

    if (req.user.id === parseInt(id)) {
        return res.status(400).json({ message: "No puedes editar tu propia cuenta desde aquí." });
    }

    try {
        let query = 'UPDATE users SET';
        const params = [];

        if (role_id) {
            query += ' role_id = ?';
            params.push(role_id);
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            if (params.length > 0) query += ',';
            query += ' password = ?';
            params.push(hashedPassword);
        }

        if (params.length === 0) {
            return res.status(400).json({ message: "No hay datos para actualizar." });
        }

        query += ' WHERE id = ? AND tenant_id = ?';
        params.push(id, tenantId);

        const [result] = await db.query(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        await logAction(req.user.id, 'USER_UPDATE', req.user.tenantId, { updatedUserId: id, changes: req.body });

        res.status(200).json({ message: "Usuario actualizado correctamente." });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar el usuario." });
    }
});

// New route for a user to change their own password
router.put('/change-password', async (req, res) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "La contraseña actual y la nueva contraseña son requeridas." });
    }

    try {
        // Verify current password
        const [users] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "La contraseña actual es incorrecta." });
        }

        // Hash new password and update
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
        
        await logAction(userId, 'PASSWORD_CHANGE', req.user.tenantId, { changedUserId: userId });
        res.status(200).json({ message: "Contraseña actualizada correctamente." });

    } catch (error) {
        console.error("Error al cambiar la contraseña del usuario:", error);
        res.status(500).json({ message: "Error al cambiar la contraseña." });
    }
});

module.exports = router;