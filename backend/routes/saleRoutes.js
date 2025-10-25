const express = require('express');
const { hasPermission } = require('../middleware/authMiddleware');
const db = require('../db');
const { logAction } = require('../utils/logger');

const router = express.Router();

router.get('/', async (req, res) => {
    const tenantId = req.user.tenantId;
    const canViewAll = req.user.permissions.includes('sales:history:view_all');
    const canViewOwn = req.user.permissions.includes('sales:history:view_own');

    if (!canViewAll && !canViewOwn) {
        return res.status(403).json({ message: 'No tienes permiso para ver el historial de ventas.' });
    }

    try {
        let query = `
            SELECT 
                s.id, s.sale_date, s.total_amount, s.payment_method, s.return_status, 
                u.username,
                (SELECT SUM(r.total_amount) FROM returns r WHERE r.sale_id = s.id) as total_returned_amount
            FROM sales s 
            JOIN users u ON s.user_id = u.id 
            WHERE s.tenant_id = ?
        `;
        const params = [tenantId];

        if (!canViewAll) {
            query += ' AND s.user_id = ?';
            params.push(req.user.id);
        }

        query += ' ORDER BY s.sale_date DESC';
        
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener historial de ventas:", error);
        res.status(500).json({ message: "Error en el servidor." });
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const canViewAll = req.user.permissions.includes('sales:history:view_all');
    const canViewOwn = req.user.permissions.includes('sales:history:view_own');
    if (!canViewAll && !canViewOwn) {
        return res.status(403).json({ message: 'No tienes permiso para ver detalles de ventas.' });
    }

    try {
        const [saleCheck] = await db.query('SELECT user_id FROM sales WHERE id = ? AND tenant_id = ?', [id, tenantId]);
        if (saleCheck.length === 0) {
            return res.status(404).json({ message: "Venta no encontrada." });
        }
        if (!canViewAll && saleCheck[0].user_id !== req.user.id) {
            return res.status(403).json({ message: "No puedes ver los detalles de una venta que no es tuya." });
        }

        const saleItemsQuery = `SELECT si.quantity, si.price_at_time, p.name, p.id as product_id FROM sale_items si JOIN products p ON si.product_id = p.id WHERE si.sale_id = ?`;
        const [saleItems] = await db.query(saleItemsQuery, [id]);

        const returnItemsQuery = `SELECT ri.quantity, ri.price_at_return, p.name FROM return_items ri JOIN returns r ON ri.return_id = r.id JOIN products p ON ri.product_id = p.id WHERE r.sale_id = ?`;
        const [returnItems] = await db.query(returnItemsQuery, [id]);
        
        res.json({ saleItems, returnItems });
    } catch (error) {
        console.error("Error al obtener detalles de la venta:", error);
        res.status(500).json({ message: "Error en el servidor." });
    }
});

router.post('/', hasPermission('pos:use'), async (req, res) => {
    const { userId, totalAmount, items, shiftId, paymentMethod } = req.body;
    const tenantId = req.user.tenantId;
    if (userId !== req.user.id) return res.status(403).json({ message: "Acción no permitida." });
    if (!items || items.length === 0) return res.status(400).json({ message: "El carrito está vacío." });

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        for (const item of items) {
            const [productRows] = await connection.query('SELECT stock FROM products WHERE id = ? AND tenant_id = ? FOR UPDATE', [item.id, tenantId]);
            if (productRows.length === 0) {
                throw new Error(`Producto con ID ${item.id} no encontrado.`);
            }
            if (productRows[0].stock < item.quantity) {
                await connection.rollback();
                return res.status(400).json({ message: `Stock insuficiente para el producto ID ${item.id}.` });
            }
        }
        const [saleResult] = await connection.query('INSERT INTO sales (user_id, total_amount, shift_id, payment_method, tenant_id) VALUES (?, ?, ?, ?, ?)', [userId, totalAmount, shiftId, paymentMethod, tenantId]);
        const saleId = saleResult.insertId;
        const saleItemsValues = items.map(item => [saleId, item.id, item.quantity, item.price]);
        await connection.query('INSERT INTO sale_items (sale_id, product_id, quantity, price_at_time) VALUES ?', [saleItemsValues]);
        for (const item of items) {
            await connection.query('UPDATE products SET stock = stock - ? WHERE id = ? AND tenant_id = ?', [item.quantity, item.id, tenantId]);
        }
        await connection.commit();
        await logAction(req.user.id, 'SALE_CREATE', req.user.tenantId, { saleId, total: totalAmount, payment: paymentMethod });
        res.status(201).json({ message: "Venta registrada exitosamente" });
    } catch (error) {
        await connection.rollback();
        console.error("Error en transacción de venta:", error);
        res.status(500).json({ message: error.message || "Error al procesar la venta." });
    } finally {
        connection.release();
    }
});

module.exports = router;