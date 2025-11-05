const express = require('express');
const { hasPermission } = require('../middleware/authMiddleware');
const db = require('../db');
const router = express.Router();

router.get('/', hasPermission('audit:view'), async (req, res) => {
    try {
        let query;
        const params = [];

        // Si el usuario es superadmin, la consulta es más compleja y trae más datos.
        if (req.user.isSuperAdmin) {
            query = `
                SELECT 
                    a.id, 
                    a.timestamp, 
                    a.action, 
                    CAST(a.details AS CHAR) AS details,
                    u.username,
                    r.name as user_role,    -- Columna para el rol del usuario
                    t.name as tenant_name   -- Columna para el nombre del negocio
                FROM audit_log a 
                LEFT JOIN users u ON a.user_id = u.id 
                LEFT JOIN tenants t ON a.tenant_id = t.id -- Unir con tenants
                LEFT JOIN roles r ON u.role_id = r.id   -- Unir con roles
                ORDER BY a.timestamp DESC
            `;
        } else {
            // La consulta para un admin de tenant se mantiene más simple
            query = `
                SELECT 
                    a.id, 
                    a.timestamp, 
                    a.action, 
                    a.details, 
                    u.username,
                    r.name as user_role     -- También puede ver el rol
                FROM audit_log a 
                LEFT JOIN users u ON a.user_id = u.id
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE a.tenant_id = ?
                ORDER BY a.timestamp DESC
            `;
            params.push(req.user.tenantId);
        }
        
        const [logs] = await db.query(query, params);
        res.json(logs);

    } catch (error) {
        console.error("Error al obtener el log de auditoría:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

module.exports = router;