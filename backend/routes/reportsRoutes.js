const express = require('express');
const mysql = require('mysql2');
require('dotenv').config();

const router = express.Router();
const db = require('../db');

// GET /api/reports/dashboard-kpis -> Obtiene los Indicadores Clave para el Dashboard
router.get('/dashboard-kpis', async (req, res) => {
    try {
        // Ventas totales del día de hoy
        const [salesToday] = await db.query(
            'SELECT SUM(total_amount) as totalSales FROM sales WHERE DATE(sale_date) = CURDATE()'
        );
        // Cantidad de transacciones de hoy
        const [transactionsToday] = await db.query(
            'SELECT COUNT(id) as transactionCount FROM sales WHERE DATE(sale_date) = CURDATE()'
        );
        // Cantidad de productos con bajo stock (ej. menos de 5 unidades)
        const [lowStockProducts] = await db.query(
            'SELECT COUNT(id) as lowStockCount FROM products WHERE stock < 5'
        );

        res.json({
            totalSalesToday: salesToday[0].totalSales || 0,
            transactionsToday: transactionsToday[0].transactionCount || 0,
            lowStockProducts: lowStockProducts[0].lowStockCount || 0,
        });

    } catch (error) { res.status(500).json({ message: "Error en el servidor." }); }
});

// GET /api/reports/sales-over-time -> Obtiene las ventas de los últimos 7 días para el gráfico
router.get('/sales-over-time', async (req, res) => {
    try {
        const query = `
            SELECT DATE(sale_date) as date, SUM(total_amount) as total
            FROM sales
            WHERE sale_date >= CURDATE() - INTERVAL 7 DAY
            GROUP BY DATE(sale_date)
            ORDER BY date ASC;
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) { res.status(500).json({ message: "Error en el servidor." }); }
});

// GET /api/reports/top-products -> Obtiene los 5 productos más vendidos
router.get('/top-products', async (req, res) => {
    try {
        const query = `
            SELECT p.name, SUM(si.quantity) as total_sold
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            GROUP BY p.name
            ORDER BY total_sold DESC
            LIMIT 5;
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) { res.status(500).json({ message: "Error en el servidor." }); }
});


module.exports = router;