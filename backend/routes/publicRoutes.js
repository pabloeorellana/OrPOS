const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /api/public/tenant-check/:subdomain
router.get('/tenant-check/:subdomain', async (req, res) => {
    const { subdomain } = req.params;
    try {
        const [tenants] = await db.query(
            'SELECT name FROM tenants WHERE subdomain = ? AND status = "active"',
            [subdomain]
        );
        if (tenants.length > 0) {
            res.json({ tenantName: tenants[0].name });
        } else {
            res.status(404).json({ message: 'Tenant no encontrado.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

module.exports = router;