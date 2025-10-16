const express = require('express');
const mysql = require('mysql2');
const { protect } = require('../middleware/authMiddleware'); // Importar solo protect
require('dotenv').config();

const router = express.Router();
const db = require('../db');

// Proteger todas las rutas de este enrutador
router.use(protect);

// GET /api/shifts/current/:userId -> Verificar turno abierto
router.get('/current/:userId', async (req, res) => {
    if (parseInt(req.params.userId) !== req.user.id) {
        return res.status(403).json({ message: "No puedes consultar el turno de otro usuario." });
    }
    try {
        const [rows] = await db.query('SELECT * FROM shifts WHERE user_id = ? AND status = "open"', [req.params.userId]);
        if (rows.length > 0) res.json(rows[0]);
        else res.status(404).json({ message: "No active shift found for this user." });
    } catch (error) { res.status(500).json({ message: "Server error." }); }
});

// POST /api/shifts/start -> Iniciar un nuevo turno
router.post('/start', async (req, res) => {
    if (req.body.userId !== req.user.id) {
        return res.status(403).json({ message: "No puedes iniciar un turno para otro usuario." });
    }
    try {
        const [result] = await db.query('INSERT INTO shifts (user_id, opening_balance) VALUES (?, ?)', [req.body.userId, req.body.openingBalance]);
        res.status(201).json({ message: "Shift started successfully", shiftId: result.insertId });
    } catch (error) { res.status(500).json({ message: "Server error." }); }
});

// POST /api/shifts/end/:id -> Cerrar un turno
router.post('/end/:id', async (req, res) => {
    const { id } = req.params;
    const { closingBalance } = req.body;
    try {
        const [shift] = await db.query('SELECT user_id, opening_balance FROM shifts WHERE id = ?', [id]);
        if (shift.length === 0) return res.status(404).json({ message: "Turno no encontrado." });
        if (shift[0].user_id !== req.user.id) return res.status(403).json({ message: "No puedes cerrar el turno de otro usuario." });

        const [salesRows] = await db.query('SELECT SUM(total_amount) as totalSales FROM sales WHERE shift_id = ?', [id]);
        const totalSales = salesRows[0].totalSales || 0;
        const openingBalance = shift[0].opening_balance;
        const expectedBalance = parseFloat(openingBalance) + parseFloat(totalSales);
        const difference = parseFloat(closingBalance) - expectedBalance;

        await db.query('UPDATE shifts SET end_time = NOW(), closing_balance = ?, expected_balance = ?, difference = ?, status = "closed" WHERE id = ?', [closingBalance, expectedBalance, difference, id]);
        res.json({ message: "Shift closed successfully", expectedBalance, difference });
    } catch (error) { res.status(500).json({ message: "Server error." }); }
});

module.exports = router;