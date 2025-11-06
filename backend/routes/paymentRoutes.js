const express = require('express');
const { hasPermission } = require('../middleware/authMiddleware');
const db = require('../db');
const { logAction } = require('../utils/logger');

const router = express.Router();

router.get('/', hasPermission('payments:view'), async (req, res) => {
    const tenantId = req.user.tenantId;
    try {
        const query = `
            SELECT p.*, u.username 
            FROM payments p
            JOIN users u ON p.user_id = u.id
            WHERE p.tenant_id = ?
            ORDER BY p.payment_date DESC
        `;
        const [payments] = await db.query(query, [tenantId]);
        res.json(payments);
    } catch (error) {
        console.error("Error fetching payments:", error);
        res.status(500).json({ message: "Server error." });
    }
});

router.post('/', hasPermission('payments:create'), async (req, res) => {
    const { type, recipient, amount, description, source_of_funds, shift_id } = req.body;
    const tenantId = req.user.tenantId;
    const userId = req.user.id;

    if (!type || !recipient || !amount || !source_of_funds || !shift_id) {
        return res.status(400).json({ message: "Missing required fields." });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const paymentQuery = 'INSERT INTO payments (tenant_id, user_id, type, recipient, amount, description, source_of_funds, shift_id, payment_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const [result] = await connection.query(paymentQuery, [tenantId, userId, type, recipient, amount, description, source_of_funds, shift_id, new Date()]);

        if (source_of_funds === 'cash') {
            await connection.query('UPDATE shifts SET total_cash_payments = total_cash_payments + ? WHERE id = ? AND tenant_id = ?', [amount, shift_id, tenantId]);
        } else if (source_of_funds === 'virtual_wallet') {
            await connection.query('UPDATE shifts SET total_virtual_payments = total_virtual_payments + ? WHERE id = ? AND tenant_id = ?', [amount, shift_id, tenantId]);
        }

        await connection.commit();

        await logAction(userId, 'PAYMENT_CREATE', tenantId, { paymentId: result.insertId, ...req.body });

        res.status(201).json({ message: "Payment registered successfully.", paymentId: result.insertId });

    } catch (error) {
        await connection.rollback();
        console.error("Error creating payment:", error);
        res.status(500).json({ message: "Server error while creating payment." });
    } finally {
        connection.release();
    }
});

module.exports = router;
