const express = require('express');
const mysql = require('mysql2');
const { protect, restrictTo } = require('../middleware/authMiddleware'); // Importar solo protect
require('dotenv').config();

const router = express.Router();
const db = require('../db');

router.get('/', protect, restrictTo('administrador', 'propietario'), async (req, res) => {
    try {
        const query = `
            SELECT s.id, s.sale_date, s.total_amount, s.payment_method, u.username 
            FROM sales s 
            JOIN users u ON s.user_id = u.id 
            ORDER BY s.sale_date DESC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) { res.status(500).json({ message: "Error en el servidor." }); }
});

// GET /api/sales/:id -> Obtener los items de una venta específica
router.get('/:id', protect, restrictTo('administrador', 'propietario'), async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT si.quantity, si.price_at_time, p.name 
            FROM sale_items si 
            JOIN products p ON si.product_id = p.id 
            WHERE si.sale_id = ?
        `;
        const [items] = await db.query(query, [id]);
        res.json(items);
    } catch (error) { res.status(500).json({ message: "Error en el servidor." }); }
});

// POST /api/sales -> Procesar una nueva venta (MODIFICADO)
router.post('/', protect, async (req, res) => {
    const { userId, totalAmount, items, shiftId, paymentMethod } = req.body;
    
    if (userId !== req.user.id) return res.status(403).json({ message: "Acción no permitida." });
    if (!totalAmount || !items || !shiftId || !paymentMethod) {
        return res.status(400).json({ message: "Datos de venta incompletos." });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const saleQuery = 'INSERT INTO sales (user_id, total_amount, shift_id, payment_method) VALUES (?, ?, ?, ?)';
        const [saleResult] = await connection.query(saleQuery, [userId, totalAmount, shiftId, paymentMethod]);
        const saleId = saleResult.insertId;

        const saleItemsValues = items.map(item => [saleId, item.id, item.quantity, item.price]);
        await connection.query('INSERT INTO sale_items (sale_id, product_id, quantity, price_at_time) VALUES ?', [saleItemsValues]);
        
        for (const item of items) {
            await connection.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.id]);
        }
        await connection.commit();
        res.status(201).json({ message: "Venta registrada exitosamente" });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: "Error al procesar la venta." });
    } finally {
        connection.release();
    }
});

module.exports = router;