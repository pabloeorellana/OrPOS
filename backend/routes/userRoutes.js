const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const { protect, restrictTo } = require('../middleware/authMiddleware'); // Importar los middlewares de seguridad
require('dotenv').config();

const router = express.Router();
const saltRounds = 10;

// Configuración de la conexión a la base de datos
const db = require('../db');

// --- Definición de Rutas Protegidas ---

// GET /api/users -> Obtener todos los usuarios (SIN CONTRASEÑA)
// Solo accesible para administradores que estén logueados.
router.get('/', protect, restrictTo('administrador'), async (req, res) => {
    try {
        const query = 'SELECT id, username, role, created_at FROM users';
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        res.status(500).json({ message: "Error en el servidor." });
    }
});

// POST /api/users -> Crear un nuevo usuario
// Solo accesible para administradores que estén logueados.
router.post('/', protect, restrictTo('administrador'), async (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
        return res.status(400).json({ message: "Usuario, contraseña y rol son requeridos." });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const query = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
        const [result] = await db.query(query, [username, hashedPassword, role]);
        res.status(201).json({ id: result.insertId, username, role });
    } catch (error) {
        console.error("Error al crear usuario:", error);
        res.status(500).json({ message: "Error al crear el usuario." });
    }
});

// DELETE /api/users/:id -> Eliminar un usuario
// Solo accesible para administradores que estén logueados.
router.delete('/:id', protect, restrictTo('administrador'), async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }
        res.status(204).send();
    } catch (error) {
        console.error("Error al eliminar usuario:", error);
        res.status(500).json({ message: "Error al eliminar el usuario." });
    }
});

// NOTA: La ruta PUT (actualizar usuario) no se ha implementado. Si la necesitáramos,
// también llevaría los middlewares 'protect' y 'restrictTo'. Por ejemplo:
// router.put('/:id', protect, restrictTo('administrador'), async (req, res) => { ... });

module.exports = router;