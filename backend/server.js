const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar los enrutadores
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const saleRoutes = require('./routes/saleRoutes');
const shiftRoutes = require('./routes/shiftRoutes'); // Asegúrate de que esta línea exista
const purchaseRoutes = require('./routes/purchaseRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();
app.use(cors()); 
app.use(express.json()); 

// Definir las rutas de la API
app.get('/api', (req, res) => {
  res.json({ message: '¡Bienvenido a la API de El Mercadito!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/shifts', shiftRoutes); // Asegúrate de que esta línea exista
app.use('/api/purchases', purchaseRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/categories', categoryRoutes);

// Iniciar el servidor
const PORT = process.env.PORT || 3001; 
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});