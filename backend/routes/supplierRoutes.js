const express = require('express');
const { hasPermission } = require('../middleware/authMiddleware');
const db = require('../db');
const { logAction } = require('../utils/logger');

const router = express.Router();

router.use(hasPermission('suppliers:manage'));

router.get('/', async (req, res) => {
    const tenantId = req.user.tenantId;
    try {
        const [rows] = await db.query('SELECT * FROM suppliers WHERE tenant_id = ? ORDER BY name ASC', [tenantId]);
        res.json(rows);
    } catch (error) { res.status(500).json({ message: "Error en el servidor." }); }
});

router.post('/', async (req, res) => {
    const { name, contact_person, phone, email, address } = req.body;
    const tenantId = req.user.tenantId;
    if (!name) return res.status(400).json({ message: "El nombre es requerido." });
    try {
        const [result] = await db.query('INSERT INTO suppliers (name, contact_person, phone, email, address, tenant_id) VALUES (?, ?, ?, ?, ?, ?)', [name, contact_person, phone, email, address, tenantId]);
        await logAction(req.user.id, 'SUPPLIER_CREATE', req.user.tenantId, { supplierId: result.insertId, name: name });
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) { res.status(500).json({ message: "Error al crear el proveedor." }); }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, contact_person, phone, email, address } = req.body;
    const tenantId = req.user.tenantId;
    if (!name) return res.status(400).json({ message: "El nombre es requerido." });
    try {
        const [result] = await db.query('UPDATE suppliers SET name = ?, contact_person = ?, phone = ?, email = ?, address = ? WHERE id = ? AND tenant_id = ?', [name, contact_person, phone, email, address, id, tenantId]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Proveedor no encontrado." });
        await logAction(req.user.id, 'SUPPLIER_UPDATE', req.user.tenantId, { supplierId: id, changes: req.body });
        res.json({ id: id, ...req.body });
    } catch (error) { res.status(500).json({ message: "Error al actualizar el proveedor." }); }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    try {
        const [result] = await db.query('DELETE FROM suppliers WHERE id = ? AND tenant_id = ?', [id, tenantId]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Proveedor no encontrado." });
        await logAction(req.user.id, 'SUPPLIER_DELETE', req.user.tenantId, { supplierId: id });
        res.status(204).send();
    } catch (error) { res.status(500).json({ message: "Error al eliminar el proveedor." }); }
});

module.exports = router;