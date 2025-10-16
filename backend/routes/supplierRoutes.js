const express = require('express');
const mysql = require('mysql2');
const { protect, restrictTo } = require('../middleware/authMiddleware'); // Importar middlewares
require('dotenv').config();

const router = express.Router();
const db = require('../db');

// Proteger todas las rutas de este enrutador
router.use(protect, restrictTo('administrador', 'propietario'));

// GET /api/suppliers
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM suppliers ORDER BY name ASC');
        res.json(rows);
    } catch (error) { res.status(500).json({ message: "Error en el servidor." }); }
});

// POST /api/suppliers
router.post('/', async (req, res) => {
    const { name, contact_person, phone, email, address } = req.body;
    if (!name) return res.status(400).json({ message: "El nombre es requerido." });
    try {
        const query = 'INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?)';
        const [result] = await db.query(query, [name, contact_person, phone, email, address]);
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) { res.status(500).json({ message: "Error al crear el proveedor." }); }
});

// PUT /api/suppliers/:id
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, contact_person, phone, email, address } = req.body;
    if (!name) return res.status(400).json({ message: "El nombre es requerido." });
    try {
        const query = 'UPDATE suppliers SET name = ?, contact_person = ?, phone = ?, email = ?, address = ? WHERE id = ?';
        const [result] = await db.query(query, [name, contact_person, phone, email, address, id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Proveedor no encontrado." });
        res.json({ id: id, ...req.body });
    } catch (error) { res.status(500).json({ message: "Error al actualizar el proveedor." }); }
});

// DELETE /api/suppliers/:id
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM suppliers WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Proveedor no encontrado." });
        res.status(204).send();
    } catch (error) { res.status(500).json({ message: "Error al eliminar el proveedor." }); }
});

module.exports = router;