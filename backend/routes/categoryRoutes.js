const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const db = require('../db'); // Suponiendo que crearemos un archivo de conexión centralizado

const router = express.Router();

// Proteger todas las rutas, solo admin y propietario pueden gestionar categorías
router.use(protect, restrictTo('administrador', 'propietario'));

// GET /api/categories -> Obtener todas las categorías
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM categories ORDER BY name ASC');
        res.json(rows);
    } catch (error) { res.status(500).json({ message: "Error en el servidor." }); }
});

// POST /api/categories -> Crear una nueva categoría
router.post('/', async (req, res) => {
    const { name, image_url } = req.body;
    if (!name) return res.status(400).json({ message: "El nombre es requerido." });
    try {
        const [result] = await db.query('INSERT INTO categories (name, image_url) VALUES (?, ?)', [name, image_url || null]);
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) { res.status(500).json({ message: "Error al crear la categoría." }); }
});

// PUT /api/categories/:id -> Actualizar una categoría
router.put('/:id', async (req, res) => {
    const { name, image_url } = req.body;
    if (!name) return res.status(400).json({ message: "El nombre es requerido." });
    try {
        const [result] = await db.query('UPDATE categories SET name = ?, image_url = ? WHERE id = ?', [name, image_url || null, req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Categoría no encontrada." });
        res.json({ id: req.params.id, ...req.body });
    } catch (error) { res.status(500).json({ message: "Error al actualizar." }); }
});

// DELETE /api/categories/:id -> Eliminar una categoría
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Categoría no encontrada." });
        res.status(204).send();
    } catch (error) { res.status(500).json({ message: "Error al eliminar." }); }
});

module.exports = router;