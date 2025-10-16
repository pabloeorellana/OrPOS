const express = require('express');
const mysql = require('mysql2');
const { protect, restrictTo } = require('../middleware/authMiddleware'); // Importar middlewares
require('dotenv').config();

const router = express.Router();
const db = require('../db');

// Proteger todas las rutas de este enrutador
router.use(protect, restrictTo('administrador', 'propietario'));

// GET /api/purchases -> Listar todas las compras
router.get('/', async (req, res) => {
    try {
        const query = `SELECT p.id, p.purchase_date, p.total_amount, s.name as supplier_name FROM purchases p LEFT JOIN suppliers s ON p.supplier_id = s.id ORDER BY p.purchase_date DESC`;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) { res.status(500).json({ message: "Error en el servidor." }); }
});

// GET /api/purchases/:id -> Obtener los items de una compra específica
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `SELECT pi.quantity, pi.cost_at_time, pr.name FROM purchase_items pi JOIN products pr ON pi.product_id = pr.id WHERE pi.purchase_id = ?`;
        const [items] = await db.query(query, [id]);
        res.json(items);
    } catch (error) { res.status(500).json({ message: "Error en el servidor." }); }
});

// POST /api/purchases -> Registrar una nueva compra
router.post('/', async (req, res) => {
    const { supplierId, totalAmount, items } = req.body;
    if (!totalAmount || !items || items.length === 0) {
        return res.status(400).json({ message: "Datos de compra incompletos." });
    }
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [purchaseResult] = await connection.query('INSERT INTO purchases (supplier_id, total_amount) VALUES (?, ?)', [supplierId || null, totalAmount]);
        const purchaseId = purchaseResult.insertId;
        const purchaseItemsValues = items.map(item => [purchaseId, item.id, item.quantity, item.cost]);
        await connection.query('INSERT INTO purchase_items (purchase_id, product_id, quantity, cost_at_time) VALUES ?', [purchaseItemsValues]);
        for (const item of items) {
            await connection.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.id]);
        }
        await connection.commit();
        res.status(201).json({ message: "Compra registrada exitosamente", purchaseId: purchaseId });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: "Error en el servidor al procesar la compra." });
    } finally {
        connection.release();
    }
});

module.exports = router;