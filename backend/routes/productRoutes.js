const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const db = require('../db');

const router = express.Router();

// GET /api/products -> CORREGIDO
router.get('/', protect, restrictTo('administrador', 'propietario', 'empleado'), async (req, res) => {
    try {
        // Consulta corregida y simplificada
        const query = `
            SELECT 
                p.id, p.name, p.barcode, p.description, p.cost, p.price, p.stock, p.supplier_id, p.category_id,
                p.image_url, -- Primero obtenemos la URL del producto
                c.name as category_name,
                c.image_url as category_image_url -- Y también la URL de la categoría
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            ORDER BY p.name ASC
        `;
        const [rows] = await db.query(query);

        // La lógica de la imagen ahora la hacemos aquí, es más seguro
        const productsWithImages = rows.map(p => ({
            ...p,
            image_url: p.image_url || p.category_image_url || null // Si no hay imagen de producto, usa la de categoría
        }));

        res.json(productsWithImages);
    } catch (error) {
        console.error("Error al obtener productos:", error);
        res.status(500).json({ message: "Error en el servidor." });
    }
});

// POST /api/products
router.post('/', protect, restrictTo('administrador', 'propietario', 'empleado'), async (req, res) => {
    const { barcode, name, description, cost, price, stock, supplier_id, category_id, image_url } = req.body;
    if (!name || cost === undefined || price === undefined || stock === undefined) return res.status(400).json({ message: "Campos requeridos." });
    try {
        const query = 'INSERT INTO products (barcode, name, description, cost, price, stock, supplier_id, category_id, image_url) VALUES (NULLIF(?, \'\'), ?, NULLIF(?, \'\'), ?, ?, ?, NULLIF(?, \'\'), NULLIF(?, \'\'), NULLIF(?, \'\'))';
        const [result] = await db.query(query, [barcode, name, description, cost, price, stock, supplier_id, category_id, image_url]);
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        console.error("Error al crear producto:", error);
        res.status(500).json({ message: "Error al crear." });
    }
});

// PUT /api/products/:id
router.put('/:id', protect, restrictTo('administrador', 'propietario', 'empleado'), async (req, res) => {
    const { id } = req.params;
    const { barcode, name, description, cost, price, stock, supplier_id, category_id, image_url } = req.body;
    if (!name || cost === undefined || price === undefined || stock === undefined) return res.status(400).json({ message: "Campos requeridos." });
    try {
        const query = 'UPDATE products SET barcode=NULLIF(?, \'\'), name=?, description=NULLIF(?, \'\'), cost=?, price=?, stock=?, supplier_id=NULLIF(?, \'\'), category_id=NULLIF(?, \'\'), image_url=NULLIF(?, \'\') WHERE id=?';
        const [result] = await db.query(query, [barcode, name, description, cost, price, stock, supplier_id, category_id, image_url, id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrado." });
        res.json({ id: id, ...req.body });
    } catch (error) {
        console.error("Error al actualizar producto:", error);
        res.status(500).json({ message: "Error al actualizar." });
    }
});

// DELETE
router.delete('/:id', protect, restrictTo('administrador', 'propietario', 'empleado'), async (req, res) => {
    try { await db.query('DELETE FROM products WHERE id = ?', [req.params.id]); res.status(204).send(); }
    catch (error) { res.status(500).json({ message: "Error al eliminar." }); }
});

// GET /barcode/:barcode
router.get('/barcode/:barcode', protect, async (req, res) => {
    const { barcode } = req.params;
    try {
        const query = `
            SELECT 
                p.*, c.name as category_name,
                COALESCE(p.image_url, c.image_url) as image_url
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.barcode = ?
        `;
        const [rows] = await db.query(query, [barcode]);
        if (rows.length === 0) return res.status(404).json({ message: "No encontrado." });
        res.json(rows[0]);
    } catch (error) { res.status(500).json({ message: "Error en el servidor." }); }
});

module.exports = router;