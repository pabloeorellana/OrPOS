const express = require('express');
const axios = require('axios');
const { hasPermission } = require('../middleware/authMiddleware');
const db = require('../db');
const { logAction } = require('../utils/logger');
const router = express.Router();

router.get('/', hasPermission('products:manage'), async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const query = `
            SELECT 
                p.id, p.name, p.barcode, p.description, p.cost, p.price, p.stock, 
                p.supplier_id, p.category_id, p.sale_type,
                COALESCE(p.image_url, c.image_url) as image_url,
                c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.tenant_id = ?
            ORDER BY p.name ASC
        `;
        const [rows] = await db.query(query, [tenantId]);
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener productos:", error);
        res.status(500).json({ message: "Error en el servidor." });
    }
});

router.get('/fetch-external/:barcode', async (req, res) => {
    const { barcode } = req.params;
    const apiUrl = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
    try {
        const response = await axios.get(apiUrl);
        if (response.data && response.data.status === 1) {
            const product = response.data.product;
            res.json({ name: product.product_name || product.generic_name || '', image_url: product.image_front_url || product.image_url || '' });
        } else {
            res.status(404).json({ message: 'Producto no encontrado en Open Food Facts.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error al contactar el servicio externo.' });
    }
});

router.get('/barcode/:barcode', async (req, res) => {
    const { barcode } = req.params;
    const tenantId = req.user.tenantId;
    try {
        const query = `
            SELECT p.*, c.name as category_name, COALESCE(p.image_url, c.image_url) as image_url
            FROM products p LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.barcode = ? AND p.tenant_id = ?
        `;
        const [rows] = await db.query(query, [barcode, tenantId]);
        if (rows.length === 0) return res.status(404).json({ message: "No encontrado." });
        res.json(rows[0]);
    } catch (error) { res.status(500).json({ message: "Error en el servidor." }); }
});

router.post('/', hasPermission('products:manage'), async (req, res) => {
    const { barcode, name, description, cost, price, stock, supplier_id, category_id, image_url, sale_type } = req.body;
    const tenantId = req.user.tenantId;
    if (!name || cost === undefined || price === undefined || stock === undefined) return res.status(400).json({ message: "Campos requeridos." });
    try {
        const [planInfo] = await db.query(`
            SELECT p.max_products 
            FROM plans p
            JOIN tenants t ON p.id = t.plan_id
            WHERE t.id = ?
        `, [tenantId]);

        if (planInfo.length > 0) {
            const maxProducts = planInfo[0].max_products;
            const [productCountResult] = await db.query('SELECT COUNT(id) as count FROM products WHERE tenant_id = ?', [tenantId]);
            const currentProductCount = productCountResult[0].count;

            if (currentProductCount >= maxProducts) {
                return res.status(403).json({ message: `Límite de ${maxProducts} productos alcanzado para su plan.` });
            }
        }

        const query = 'INSERT INTO products (barcode, name, description, cost, price, stock, supplier_id, category_id, image_url, sale_type, tenant_id) VALUES (NULLIF(?, \'\'), ?, NULLIF(?, \'\'), ?, ?, ?, NULLIF(?, \'\'), NULLIF(?, \'\'), NULLIF(?, \'\'), ?, ?)';
        const [result] = await db.query(query, [barcode, name, description, cost, price, stock, supplier_id, category_id, image_url, sale_type || 'unitario', tenantId]);
        await logAction(req.user.id, 'PRODUCT_CREATE', req.user.tenantId, { productId: result.insertId, name: name });
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) { 
        console.error("Error al crear producto:", error);
        res.status(500).json({ message: "Error al crear." }); 
    }
});

router.put('/:id', hasPermission('products:manage'), async (req, res) => {
    const { id } = req.params;
    const { barcode, name, description, cost, price, stock, supplier_id, category_id, image_url, sale_type } = req.body;
    const tenantId = req.user.tenantId;
    if (!name || cost === undefined || price === undefined || stock === undefined) return res.status(400).json({ message: "Campos requeridos." });
    try {
        const query = 'UPDATE products SET barcode=NULLIF(?, \'\'), name=?, description=NULLIF(?, \'\'), cost=?, price=?, stock=?, supplier_id=NULLIF(?, \'\'), category_id=NULLIF(?, \'\'), image_url=NULLIF(?, \'\'), sale_type=? WHERE id=? AND tenant_id = ?';
        const [result] = await db.query(query, [barcode, name, description, cost, price, stock, supplier_id, category_id, image_url, sale_type || 'unitario', id, tenantId]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrado." });
        await logAction(req.user.id, 'PRODUCT_UPDATE', req.user.tenantId, { productId: id, changes: req.body });
        res.json({ id: id, ...req.body });
    } catch (error) { 
        console.error("Error al actualizar producto:", error);
        res.status(500).json({ message: "Error al actualizar." }); 
    }
});

router.delete('/:id', hasPermission('products:manage'), async (req, res) => {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    try {
        const [result] = await db.query('DELETE FROM products WHERE id = ? AND tenant_id = ?', [id, tenantId]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Producto no encontrado." });
        await logAction(req.user.id, 'PRODUCT_DELETE', req.user.tenantId, { productId: id });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: "Error en el servidor al eliminar el producto." });
    }
});
module.exports = router;