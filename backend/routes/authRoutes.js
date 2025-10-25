const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { logAction } = require('../utils/logger');
require('dotenv').config();

const router = express.Router();

router.post('/login', async (req, res) => {
    const { username, password, subdomain } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Usuario y contraseña son requeridos.' });
    }

    try {
        let userQuery;
        let userParams;
        
        if (subdomain) {
            userQuery = `
                SELECT u.*, r.name as role_name, t.status as tenant_status, t.subscription_ends_at
                FROM users u 
                LEFT JOIN tenants t ON u.tenant_id = t.id
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE u.username = ? AND t.subdomain = ?
            `;
            userParams = [username, subdomain];
        } else {
            userQuery = 'SELECT * FROM users WHERE username = ? AND tenant_id IS NULL';
            userParams = [username];
        }

        const [users] = await db.query(userQuery, userParams);

        if (users.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }
        
        const user = users[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        if (user.tenant_id) { // Solo para usuarios de tenant
            if (user.subscription_ends_at && new Date(user.subscription_ends_at) < new Date() && user.tenant_status === 'active') {
                await db.query("UPDATE tenants SET status = 'past_due' WHERE id = ?", [user.tenant_id]);
                user.tenant_status = 'past_due';
            }
            if (user.tenant_status !== 'active') {
                return res.status(403).json({ message: 'El acceso para este negocio ha sido suspendido o ha vencido.' });
            }
        }
        
        const [permissionsRows] = await db.query(
            'SELECT p.action FROM permissions p JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = ?', 
            [user.role_id]
        );
        const permissions = permissionsRows.map(p => p.action);
        
        let payload;
        if (user.tenant_id === null) {
            payload = { id: user.id, username: user.username, isSuperAdmin: true, role: 'superadmin', permissions };
        } else {
            payload = { id: user.id, username: user.username, tenantId: user.tenant_id, role: user.role_name, permissions };
        }
        
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
        
        await logAction(user.id, 'USER_LOGIN', user.tenant_id, {});
        
        res.json({
            message: 'Login exitoso',
            token: token,
            user: { id: user.id, username: user.username, role: payload.role }
        });

    } catch (error) {
        console.error("Error grave en el login:", error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

module.exports = router;