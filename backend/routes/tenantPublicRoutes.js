const express = require('express');
const db = require('../db');
const router = express.Router();

// Ruta pública para resolver un subdominio a información del tenant.
// Ejemplo: GET /api/tenants/resolve?subdomain=mercadito
router.get('/resolve', async (req, res) => {
    const { subdomain } = req.query;
    if (!subdomain) return res.status(400).json({ message: 'subdomain query param is required.' });
    try {
        const [rows] = await db.query('SELECT id, name, status, subdomain FROM tenants WHERE subdomain = ?', [subdomain]);
        if (rows.length === 0) return res.status(404).json({ message: 'Tenant not found.' });
        res.json(rows[0]);
    } catch (error) {
        console.error('Error resolving tenant:', error);
        res.status(500).json({ message: 'Error resolving tenant.' });
    }
});

module.exports = router;
