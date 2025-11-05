const express = require('express');
const { hasPermission } = require('../middleware/authMiddleware');
const db = require('../db');
const { logAction } = require('../utils/logger');
require('dotenv').config();

const router = express.Router();

router.get('/', hasPermission('shifts:history:view'), async (req, res) => {
    const tenantId = req.user.tenantId;
    try {
        const query = `
            SELECT s.*, u.username 
            FROM shifts s 
            JOIN users u ON s.user_id = u.id 
            WHERE s.status = 'closed' AND s.tenant_id = ?
            ORDER BY s.end_time DESC
        `;
        const [shifts] = await db.query(query, [tenantId]);
        res.json(shifts);
    } catch (error) {
        console.error("Error al obtener historial de turnos:", error);
        res.status(500).json({ message: "Server error." });
    }
});

router.get('/current/:userId', async (req, res) => {
    const tenantId = req.user.tenantId;
    if (parseInt(req.params.userId) !== req.user.id) {
        return res.status(403).json({ message: "No puedes consultar el turno de otro usuario." });
    }
    try {
        const [rows] = await db.query('SELECT * FROM shifts WHERE user_id = ? AND status = "open" AND tenant_id = ?', [req.params.userId, tenantId]);
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ message: "No active shift found for this user." });
        }
    } catch (error) {
        res.status(500).json({ message: "Server error." });
    }
});

router.post('/start', async (req, res) => {
    const tenantId = req.user.tenantId;
    const { userId, openingBalance, openingVirtualBalance } = req.body;

    if (userId !== req.user.id) {
        return res.status(403).json({ message: "No puedes iniciar un turno para otro usuario." });
    }
    try {
        const [result] = await db.query(
            'INSERT INTO shifts (user_id, opening_balance, opening_virtual_balance, tenant_id) VALUES (?, ?, ?, ?)',
            [userId, openingBalance, openingVirtualBalance, tenantId]
        );
        await logAction(req.user.id, 'SHIFT_START', req.user.tenantId, { 
            shiftId: result.insertId, 
            openingBalance, 
            openingVirtualBalance 
        });
        res.status(201).json({ message: "Shift started successfully", shiftId: result.insertId });
    } catch (error) {
        console.error("Error al iniciar turno:", error);
        res.status(500).json({ message: "Server error." });
    }
});

router.post('/end/:id', async (req, res) => {
    const { id } = req.params;
    // Recibir ambos montos de cierre
    const { closingBalance, closingVirtualBalance } = req.body;
    const tenantId = req.user.tenantId;

    try {
        // Obtener ambos balances iniciales
        const [shift] = await db.query('SELECT user_id, opening_balance, opening_virtual_balance FROM shifts WHERE id = ? AND tenant_id = ?', [id, tenantId]);
        if (shift.length === 0) return res.status(404).json({ message: "Turno no encontrado." });
        if (shift[0].user_id !== req.user.id) return res.status(403).json({ message: "No puedes cerrar el turno de otro usuario." });

        const [sales] = await db.query('SELECT payment_method, SUM(total_amount) as total, COUNT(id) as count FROM sales WHERE shift_id = ? AND tenant_id = ? GROUP BY payment_method', [id, tenantId]);
        const [returns] = await db.query('SELECT SUM(r.total_amount) as totalCashReturns FROM returns r JOIN sales s ON r.sale_id = s.id WHERE s.shift_id = ? AND r.tenant_id = ? AND r.payment_method = "Efectivo"', [id, tenantId]);
        
        // --- Cálculos de Efectivo ---
        const openingBalance = parseFloat(shift[0].opening_balance);
        const totalCashSales = parseFloat(sales.find(s => s.payment_method === 'Efectivo')?.total || 0);
        const totalCashReturns = parseFloat(returns[0]?.totalCashReturns || 0);
        const expectedInCash = openingBalance + totalCashSales - totalCashReturns;
        const difference = parseFloat(closingBalance) - expectedInCash;

        // --- Cálculos de Billetera Virtual ---
        const openingVirtualBalance = parseFloat(shift[0].opening_virtual_balance);
        const totalCardSales = parseFloat(sales.find(s => s.payment_method === 'Tarjeta')?.total || 0);
        const totalTransferSales = parseFloat(sales.find(s => s.payment_method === 'Transferencia')?.total || 0);
        const totalQRSales = parseFloat(sales.find(s => s.payment_method === 'QR')?.total || 0);
        const totalVirtualSales = totalCardSales + totalTransferSales + totalQRSales;
        // (Asumimos que no hay devoluciones virtuales por ahora)
        const expectedVirtualBalance = openingVirtualBalance + totalVirtualSales;
        const virtualDifference = parseFloat(closingVirtualBalance) - expectedVirtualBalance;

        // --- Otros Cálculos ---
        let transactionCount = 0;
        sales.forEach(s => { transactionCount += s.count; });
        const totalOtherSales = parseFloat(sales.find(s => s.payment_method === 'Otro')?.total || 0);

        const query = `
            UPDATE shifts SET 
                end_time = NOW(), status = "closed",
                opening_balance = ?,
                closing_balance = ?, 
                expected_balance = ?, 
                difference = ?, 
                opening_virtual_balance = ?,
                closing_virtual_balance = ?,
                expected_virtual_balance = ?,
                virtual_difference = ?,
                total_cash_sales = ?, 
                total_card_sales = ?, 
                total_transfer_sales = ?, 
                total_qr_sales = ?,
                total_other_sales = ?,
                transaction_count = ?, 
                total_cash_returns = ?
            WHERE id = ? AND tenant_id = ?
        `;
        await db.query(query, [
            openingBalance, closingBalance, expectedInCash, difference, 
            openingVirtualBalance, closingVirtualBalance, expectedVirtualBalance, virtualDifference,
            totalCashSales, totalCardSales, totalTransferSales, totalQRSales, totalOtherSales, 
            transactionCount, totalCashReturns, 
            id, tenantId
        ]);
        
        await logAction(req.user.id, 'SHIFT_END', req.user.tenantId, { shiftId: id, closingBalance, closingVirtualBalance, difference, virtualDifference });
        
        // Devolver un objeto más detallado
        res.json({
            message: "Turno cerrado exitosamente.",
            cashDetails: { openingBalance, totalCashSales, totalCashReturns, expectedInCash, closingBalance, difference },
            virtualDetails: { openingVirtualBalance, totalVirtualSales, expectedVirtualBalance, closingVirtualBalance, virtualDifference }
        });

    } catch (error) {
        console.error("Error al cerrar turno:", error);
        res.status(500).json({ message: "Server error al cerrar el turno." });
    }
});

module.exports = router;