const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { protect } = require('./middleware/authMiddleware');

const authRoutes = require('./routes/authRoutes');
const tenantPublicRoutes = require('./routes/tenantPublicRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const plansRoutes = require('./routes/plansRoutes');
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const saleRoutes = require('./routes/saleRoutes');
const shiftRoutes = require('./routes/shiftRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const auditRoutes = require('./routes/auditRoutes');
const returnRoutes = require('./routes/returnRoutes');
const permissionsRoutes = require('./routes/permissionsRoutes');
const superadminRoutes = require('./routes/superadminRoutes');

const app = express();
app.use(cors()); 
app.use(express.json()); 

app.get('/api', (req, res) => {
  res.json({ message: '¡Bienvenido a la API!' });
});


// --- GESTIÓN DE RUTAS SIMPLIFICADA ---

// 1. Rutas Públicas
app.use('/api/auth', authRoutes);
// Public tenant resolution route (must be available without auth)
app.use('/api/tenants', tenantPublicRoutes);


// 2. Un único router para todas las rutas protegidas
const apiRouter = express.Router();
app.use('/api', protect, apiRouter); // Aplicamos 'protect' UNA SOLA VEZ a este router

// Ahora, registramos todas las demás rutas EN el 'apiRouter'
apiRouter.use('/tenants', tenantRoutes);
apiRouter.use('/plans', plansRoutes);
apiRouter.use('/superadmin', superadminRoutes);
apiRouter.use('/permissions', permissionsRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/suppliers', supplierRoutes);
apiRouter.use('/sales', saleRoutes);
apiRouter.use('/shifts', shiftRoutes);
apiRouter.use('/purchases', purchaseRoutes);
apiRouter.use('/reports', reportsRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/settings', settingsRoutes);
apiRouter.use('/audit', auditRoutes);
apiRouter.use('/returns', returnRoutes);


// Iniciar el servidor
const PORT = process.env.PORT || 3001; 
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});