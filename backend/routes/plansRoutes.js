const express = require('express');
const db = require('../db');
const router = express.Router();

// Middleware para asegurar que solo el Superadmin acceda
const superadminOnly = (req, res, next) => {
    if (req.user && req.user.isSuperAdmin) {
        next();
    } else {
        res.status(403).json({ message: 'Acceso denegado.' });
    }
};

router.use(superadminOnly);

// GET /api/plans -> Obtener todos los planes
router.get('/', async (req, res) => {
    try {
        const [plans] = await db.query('SELECT * FROM plans ORDER BY price ASC');
        res.json(plans);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los planes.' });
    }
});

// POST /api/plans -> Crear un nuevo plan
router.post('/', async (req, res) => {
    const { name, price, max_users, max_products } = req.body;
    if (!name || price === undefined || max_users === undefined || max_products === undefined) {
        return res.status(400).json({ message: 'Todos los campos son requeridos.' });
    }
    try {
        const [result] = await db.query(
            'INSERT INTO plans (name, price, max_users, max_products) VALUES (?, ?, ?, ?)',
            [name, price, max_users, max_products]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear el plan.' });
    }
});

// PUT /api/plans/:id -> Actualizar un plan
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, price, max_users, max_products } = req.body;
    if (!name || price === undefined || max_users === undefined || max_products === undefined) {
        return res.status(400).json({ message: 'Todos los campos son requeridos.' });
    }
    try {
        const [result] = await db.query(
            'UPDATE plans SET name = ?, price = ?, max_users = ?, max_products = ? WHERE id = ?',
            [name, price, max_users, max_products, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Plan no encontrado.' });
        }
        res.json({ message: 'Plan actualizado.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el plan.' });
    }
});

// DELETE /api/plans/:id -> Eliminar un plan
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Opcional: Verificar si algún tenant está usando este plan antes de borrar
        const [tenants] = await db.query('SELECT id FROM tenants WHERE plan_id = ?', [id]);
        if (tenants.length > 0) {
            return res.status(400).json({ message: 'No se puede eliminar el plan porque está en uso por uno o más negocios.' });
        }

        const [result] = await db.query('DELETE FROM plans WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Plan no encontrado.' });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el plan.' });
    }
});

module.exports = router;