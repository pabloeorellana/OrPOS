const express = require('express');
const { hasPermission } = require('../middleware/authMiddleware');
const db = require('../db');
const { logAction } = require('../utils/logger');
const router = express.Router();

router.get('/:key', async (req, res) => {
    const tenantId = req.user.tenantId;
    try {
        const [rows] = await db.query('SELECT setting_value FROM settings WHERE setting_key = ? AND tenant_id = ?', [req.params.key, tenantId]);
        if (rows.length > 0) {
            res.json({ value: rows[0].setting_value });
        } else {
            // Si no hay configuración para este tenant, devolver un valor por defecto o un 404
            // Devolver un valor por defecto puede ser más robusto para el frontend.
            if(req.params.key === 'table_service_fee') {
                return res.json({ value: '0' });
            }
            if(req.params.key === 'enable_table_service') {
                return res.json({ value: '0' });
            }
            res.status(404).json({ message: 'Configuración no encontrada.' });
        }
    } catch (error) { res.status(500).json({ message: 'Error en el servidor.' }); }
});

router.put('/:key', hasPermission('settings:manage'), async (req, res) => {
    const { value } = req.body;
    const { key } = req.params;
    const tenantId = req.user.tenantId;
    try {
        const query = 'INSERT INTO settings (tenant_id, setting_key, setting_value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = ?';
        await db.query(query, [tenantId, key, value, value]);
        
        await logAction(req.user.id, 'SETTINGS_UPDATE', req.user.tenantId, { setting: key, newValue: value });
        res.json({ message: 'Configuración actualizada.' });
    } catch (error) { 
        console.error("Error al actualizar settings:", error);
        res.status(500).json({ message: 'Error en el servidor.' }); 
    }
});

module.exports = router;