const express = require('express');
const { hasPermission } = require('../middleware/authMiddleware');
const db = require('../db');
const { logAction } = require('../utils/logger');
const router = express.Router();

router.get('/', hasPermission('products:manage'), async (req, res) => {
    const tenantId = req.user.tenantId;
    try {
        const [rows] = await db.query('SELECT * FROM categories WHERE tenant_id = ? ORDER BY name ASC', [tenantId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: "Error en el servidor." });
    }
});

router.post('/', hasPermission('categories:manage'), async (req, res) => {
    const { name, image_url } = req.body;
    const tenantId = req.user.tenantId;
    if (!name) return res.status(400).json({ message: "El nombre es requerido." });
    try {
        const [result] = await db.query('INSERT INTO categories (name, image_url, tenant_id) VALUES (?, ?, ?)', [name, image_url || null, tenantId]);
        await logAction(req.user.id, 'CATEGORY_CREATE', req.user.tenantId, { categoryId: result.insertId, name: name });
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        res.status(500).json({ message: "Error al crear la categoría." });
    }
});

router.put('/:id', hasPermission('categories:manage'), async (req, res) => {
    const { id } = req.params;
    const { name, image_url } = req.body;
    const tenantId = req.user.tenantId;
    if (!name) return res.status(400).json({ message: "El nombre es requerido." });
    try {
        const [result] = await db.query('UPDATE categories SET name = ?, image_url = ? WHERE id = ? AND tenant_id = ?', [name, image_url || null, id, tenantId]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Categoría no encontrada." });
        await logAction(req.user.id, 'CATEGORY_UPDATE', req.user.tenantId, { categoryId: id, changes: req.body });
        res.json({ id: id, ...req.body });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar." });
    }
});

router.delete('/:id', hasPermission('categories:manage'), async (req, res) => {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    try {
        const [result] = await db.query('DELETE FROM categories WHERE id = ? AND tenant_id = ?', [id, tenantId]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Categoría no encontrada." });
        await logAction(req.user.id, 'CATEGORY_DELETE', req.user.tenantId, { categoryId: id });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar." });
    }
});
module.exports = router;