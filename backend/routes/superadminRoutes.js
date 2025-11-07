const express = require('express');
const db = require('../db');
const jwt = require('jsonwebtoken'); // Importar jsonwebtoken
const bcrypt = require('bcrypt'); // Importar bcrypt
const router = express.Router();

// Middleware para asegurar que solo el Superadmin acceda a estas rutas
const superadminOnly = (req, res, next) => {
    if (req.user && req.user.isSuperAdmin) {
        next();
    } else {
        res.status(403).json({ message: 'Acceso denegado.' });
    }
};

router.use(superadminOnly);

// GET /api/superadmin/dashboard-kpis
router.get('/dashboard-kpis', async (req, res) => {
    try {
        const [
            tenantsResult,
            usersResult,
            productsResult,
            salesResult,
            mrrResult
        ] = await Promise.all([
            db.query("SELECT IFNULL(COUNT(id), 0) as total FROM tenants WHERE status = 'active'"),
            db.query("SELECT IFNULL(COUNT(id), 0) as total FROM users WHERE tenant_id IS NOT NULL"),
            db.query("SELECT IFNULL(COUNT(id), 0) as total FROM products"),
            db.query("SELECT IFNULL(SUM(total_amount), 0) as total FROM sales WHERE DATE(sale_date) = CURDATE()"),
            db.query(`
                SELECT IFNULL(SUM(p.price), 0) as mrr 
                FROM tenants t
                JOIN plans p ON t.plan_id = p.id
                WHERE t.status = 'active'
            `)
        ]);

        const activeTenants = tenantsResult[0][0].total;
        const totalUsers = usersResult[0][0].total;
        const totalProducts = productsResult[0][0].total;
        const totalSalesToday = salesResult[0][0].total;
        const monthlyRecurringRevenue = mrrResult[0][0].mrr;
        
        res.json({
            activeTenants: parseInt(activeTenants),
            totalUsers: parseInt(totalUsers),
            totalProducts: parseInt(totalProducts),
            totalSalesToday: parseFloat(totalSalesToday),
            monthlyRecurringRevenue: parseFloat(monthlyRecurringRevenue)
        });

    } catch (error) {
        console.error("Error al obtener KPIs de superadmin:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// POST /api/superadmin/impersonate/:userId -> Nueva ruta de suplantación
router.post('/impersonate/:userId', async (req, res) => {
    const targetUserId = req.params.userId;
    const impersonatorId = req.user.id; // ID del Superadmin que está suplantando

    try {
        // 1. Obtener los datos del usuario a suplantar
        const query = `
            SELECT u.*, r.name as role_name 
            FROM users u 
            LEFT JOIN roles r ON u.role_id = r.id 
            WHERE u.id = ? AND u.tenant_id IS NOT NULL`;
        const [results] = await db.query(query, [targetUserId]);

        if (results.length === 0) {
            return res.status(404).json({ message: "Usuario a suplantar no encontrado." });
        }
        const targetUser = results[0];

        // 2. Obtener los permisos del rol del usuario a suplantar
        const [permissions] = await db.query(
            'SELECT p.action FROM permissions p JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = ?',
            [targetUser.role_id]
        );
        const userPermissions = permissions.map(p => p.action);

        // 3. Crear un nuevo payload de JWT para el usuario suplantado
        const payload = {
            id: targetUser.id,
            username: targetUser.username,
            tenantId: targetUser.tenant_id,
            role: targetUser.role_name,
            permissions: userPermissions,
            impersonatorId: impersonatorId
        };
        
        // 4. Firmar el nuevo token
        const impersonationToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({
            message: `Iniciando sesión como ${targetUser.username}`,
            token: impersonationToken
        });

    } catch (error) {
        console.error("Error al suplantar usuario:", error);
        res.status(500).json({ message: "Error en el servidor." });
    }
});

router.put('/users/:id/password', async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ message: "La contraseña es obligatoria." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        res.status(200).json({ message: "Contraseña actualizada correctamente." });
    } catch (error) {
        console.error("Error al actualizar la contraseña:", error);
        res.status(500).json({ message: "Error al actualizar la contraseña." });
    }
});


module.exports = router;