const express = require('express');
const { hasPermission } = require('../middleware/authMiddleware');
const db = require('../db');
const { logAction } = require('../utils/logger');

const router = express.Router();

router.use(hasPermission('returns:create'));

router.get('/', async (req, res) => {
    const tenantId = req.user.tenantId;
    try {
        const query = `
            SELECT r.id, r.sale_id, r.return_date, r.total_amount, u.username 
            FROM returns r 
            JOIN users u ON r.user_id = u.id 
            WHERE r.tenant_id = ? 
            ORDER BY r.return_date DESC
        `;
        const [rows] = await db.query(query, [tenantId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

router.post('/', async (req, res) => {
    const { saleId, totalAmount, reason, items, paymentMethod } = req.body;
    const userId = req.user.id;
    const tenantId = req.user.tenantId;

    if (!saleId || !totalAmount || !items || items.length === 0 || !paymentMethod) {
        return res.status(400).json({ message: 'Datos de devolución incompletos.' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [saleCheck] = await connection.query('SELECT id FROM sales WHERE id = ? AND tenant_id = ?', [saleId, tenantId]);
        if (saleCheck.length === 0) {
            await connection.rollback();
            return res.status(403).json({ message: 'Acción no permitida sobre esta venta.' });
        }

        const returnQuery = 'INSERT INTO returns (sale_id, user_id, total_amount, reason, payment_method, tenant_id) VALUES (?, ?, ?, ?, ?, ?)';
        const [returnResult] = await connection.query(returnQuery, [saleId, userId, totalAmount, reason || null, paymentMethod, tenantId]);
        const returnId = returnResult.insertId;

        const returnItemsValues = [];
        for (const item of items) {
            returnItemsValues.push([returnId, item.product_id, item.quantity, item.price_at_time]);
            await connection.query('UPDATE products SET stock = stock + ? WHERE id = ? AND tenant_id = ?', [item.quantity, item.product_id, tenantId]);
        }
        
        const returnItemsQuery = 'INSERT INTO return_items (return_id, product_id, quantity, price_at_return) VALUES ?';
        await connection.query(returnItemsQuery, [returnItemsValues]);

        const [originalItems] = await connection.query('SELECT product_id, quantity FROM sale_items WHERE sale_id = ?', [saleId]);
        const [returnedItems] = await connection.query(`
            SELECT ri.product_id, SUM(ri.quantity) as total_returned 
            FROM return_items ri 
            JOIN returns r ON ri.return_id = r.id 
            WHERE r.sale_id = ? 
            GROUP BY ri.product_id`, [saleId]);
        
        let isFullReturn = originalItems.length > 0 && originalItems.every(original => {
            const returned = returnedItems.find(r => r.product_id === original.product_id);
            return returned && returned.total_returned >= original.quantity;
        });
        
        const newStatus = isFullReturn ? 'full' : 'partial';
        await connection.query('UPDATE sales SET return_status = ? WHERE id = ? AND tenant_id = ?', [newStatus, saleId, tenantId]);
        
        await connection.commit();
        await logAction(userId, 'RETURN_CREATE', tenantId, { returnId, saleId, total: totalAmount, paymentMethod });
        res.status(201).json({ message: 'Devolución registrada exitosamente.', returnId });
    } catch (error) {
        await connection.rollback();
        console.error("Error al registrar la devolución:", error);
        res.status(500).json({ message: 'Error en el servidor al procesar la devolución.' });
    } finally {
        connection.release();
    }
});

module.exports = router;