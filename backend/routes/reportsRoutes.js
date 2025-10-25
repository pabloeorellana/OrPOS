const express = require('express');
const { hasPermission } = require('../middleware/authMiddleware');
const db = require('../db');

const router = express.Router();

router.get('/dashboard-kpis', async (req, res) => {
    if (!req.user.permissions.includes('dashboard:view')) {
        return res.status(403).json({ message: 'No tienes permiso para ver estos datos.' });
    }
    const tenantId = req.user.tenantId;
    try {
        const [salesToday] = await db.query('SELECT SUM(total_amount) as total FROM sales WHERE DATE(sale_date) = CURDATE() AND tenant_id = ?', [tenantId]);
        const [returnsToday] = await db.query('SELECT SUM(total_amount) as total FROM returns WHERE DATE(return_date) = CURDATE() AND tenant_id = ?', [tenantId]);
        const netSales = (parseFloat(salesToday[0].total) || 0) - (parseFloat(returnsToday[0].total) || 0);
        const [transactionsToday] = await db.query('SELECT COUNT(id) as transactionCount FROM sales WHERE DATE(sale_date) = CURDATE() AND tenant_id = ?', [tenantId]);
        const [lowStockProducts] = await db.query('SELECT COUNT(id) as lowStockCount FROM products WHERE stock < 5 AND tenant_id = ?', [tenantId]);

        res.json({
            totalSalesToday: netSales,
            transactionsToday: transactionsToday[0].transactionCount || 0,
            lowStockProducts: lowStockProducts[0].lowStockCount || 0,
        });
    } catch (error) { 
        console.error("Error al obtener KPIs del dashboard:", error);
        res.status(500).json({ message: "Error en el servidor." }); 
    }
});

router.get('/sales-over-time', async (req, res) => {
    if (!req.user.permissions.includes('dashboard:view')) {
        return res.status(403).json({ message: 'No tienes permiso para ver estos datos.' });
    }
    const tenantId = req.user.tenantId;
    try {
        const query = `
            SELECT DATE(sale_date) as date, SUM(total_amount) as total
            FROM sales
            WHERE sale_date >= CURDATE() - INTERVAL 7 DAY AND tenant_id = ?
            GROUP BY DATE(sale_date)
            ORDER BY date ASC;
        `;
        const [rows] = await db.query(query, [tenantId]);
        res.json(rows);
    } catch (error) { res.status(500).json({ message: "Error en el servidor." }); }
});

router.get('/top-products', async (req, res) => {
    if (!req.user.permissions.includes('dashboard:view')) {
        return res.status(403).json({ message: 'No tienes permiso para ver estos datos.' });
    }
    const tenantId = req.user.tenantId;
    try {
        const query = `
            SELECT p.name, SUM(si.quantity) as total_sold
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            WHERE p.tenant_id = ?
            GROUP BY p.name
            ORDER BY total_sold DESC
            LIMIT 5;
        `;
        const [rows] = await db.query(query, [tenantId]);
        res.json(rows);
    } catch (error) { res.status(500).json({ message: "Error en el servidor." }); }
});

router.post('/sales-by-date', hasPermission('reports:view'), async (req, res) => {
    const { startDate, endDate, employeeId, productId } = req.body;
    const tenantId = req.user.tenantId;
    if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Se requieren fecha de inicio y fin.' });
    }
    try {
        const formattedEndDate = new Date(endDate);
        formattedEndDate.setHours(23, 59, 59, 999);
        const formattedStartDate = new Date(startDate);

        let whereClauses = ['s.sale_date BETWEEN ? AND ?', 's.tenant_id = ?'];
        const params = [formattedStartDate, formattedEndDate, tenantId];

        let salesQuery = `
            SELECT s.id, s.sale_date, s.total_amount, s.payment_method, s.return_status, u.username as employee_name,
                   (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as items_count
            FROM sales s
            JOIN users u ON s.user_id = u.id
        `;
        
        if (productId) {
            salesQuery += ' JOIN sale_items si ON s.id = si.sale_id';
            whereClauses.push('si.product_id = ?');
            params.push(productId);
        }
        if (employeeId) {
            whereClauses.push('s.user_id = ?');
            params.push(employeeId);
        }
        
        salesQuery += ` WHERE ${whereClauses.join(' AND ')} ORDER BY s.sale_date DESC`;
        const [sales] = await db.query(salesQuery, params);
        
        const salesTotal = sales.reduce((sum, s) => sum + parseFloat(s.total_amount), 0);
        const [returns] = await db.query('SELECT SUM(total_amount) as total FROM returns WHERE return_date BETWEEN ? AND ? AND tenant_id = ?', [formattedStartDate, formattedEndDate, tenantId]);
        const returnsTotal = parseFloat(returns[0].total) || 0;
        const totalGeneralNeto = salesTotal - returnsTotal;
        const totalsByPayment = {};
        sales.forEach(sale => {
            totalsByPayment[sale.payment_method] = (totalsByPayment[sale.payment_method] || 0) + parseFloat(sale.total_amount);
        });

        res.json({
            sales,
            summary: {
                totalGeneral: totalGeneralNeto,
                totalsByPayment
            }
        });
    } catch (error) {
        console.error("Error al generar reporte de ventas:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

module.exports = router;