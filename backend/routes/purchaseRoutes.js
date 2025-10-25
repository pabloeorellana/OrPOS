const express = require('express');
const { hasPermission } = require('../middleware/authMiddleware');
const db = require('../db');
const { logAction } = require('../utils/logger');

const router = express.Router();

router.use(hasPermission('purchases:manage'));

router.get('/', async (req, res) => {
    const tenantId = req.user.tenantId;
    try {
        const query = `
            SELECT p.id, p.purchase_date, p.total_amount, s.name as supplier_name 
            FROM purchases p 
            LEFT JOIN suppliers s ON p.supplier_id = s.id 
            WHERE p.tenant_id = ?
            ORDER BY p.purchase_date DESC
        `;
        const [rows] = await db.query(query, [tenantId]);
        res.json(rows);
    } catch (error) { res.status(500).json({ message: "Error en el servidor." }); }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    try {
        const [purchaseCheck] = await db.query('SELECT id FROM purchases WHERE id = ? AND tenant_id = ?', [id, tenantId]);
        if (purchaseCheck.length === 0) {
            return res.status(404).json({ message: "Compra no encontrada." });
        }

        const query = `SELECT pi.quantity, pi.cost_at_time, pr.name FROM purchase_items pi JOIN products pr ON pi.product_id = pr.id WHERE pi.purchase_id = ?`;
        const [items] = await db.query(query, [id]);
        res.json(items);
    } catch (error) { res.status(500).json({ message: "Error en el servidor." }); }
});

router.post('/', async (req, res) => {
    const { supplierId, totalAmount, items } = req.body;
    const tenantId = req.user.tenantId;
    if (!totalAmount || !items || items.length === 0) {
        return res.status(400).json({ message: "Datos de compra incompletos." });
    }
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [purchaseResult] = await connection.query('INSERT INTO purchases (supplier_id, total_amount, tenant_id) VALUES (?, ?, ?)', [supplierId || null, totalAmount, tenantId]);
        const purchaseId = purchaseResult.insertId;
        const purchaseItemsValues = items.map(item => [purchaseId, item.id, item.quantity, item.cost]);
        await connection.query('INSERT INTO purchase_items (purchase_id, product_id, quantity, cost_at_time) VALUES ?', [purchaseItemsValues]);
        for (const item of items) {
            await connection.query('UPDATE products SET stock = stock + ?, cost = ? WHERE id = ? AND tenant_id = ?', [item.quantity, item.cost, item.id, tenantId]);
        }
        await connection.commit();
        await logAction(req.user.id, 'PURCHASE_CREATE', req.user.tenantId, { purchaseId: purchaseId, total: totalAmount, itemsCount: items.length });
        res.status(201).json({ message: "Compra registrada exitosamente", purchaseId: purchaseId });
    } catch (error) {
        await connection.rollback();
        console.error("Error al registrar la compra:", error);
        res.status(500).json({ message: "Error en el servidor al procesar la compra." });
    } finally {
        connection.release();
    }
});

module.exports = router;