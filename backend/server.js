const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { protect } = require('./middleware/authMiddleware');

const publicRoutes = require('./routes/publicRoutes');

// Rutas
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
const paymentRoutes = require('./routes/paymentRoutes');
const messageRoutes = require('./routes/messageRoutes');

const app = express();

/* --- CORS DINÁMICO PARA MULTI-TENANT --- */
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      try {
        const url = new URL(origin);
        const host = url.hostname;

        if (
          host === 'localhost' ||
          host === '127.0.0.1' ||
          host === 'orpos.site' ||
          host === 'www.orpos.site' ||
          host.endsWith('.orpos.site')
        ) {
          return cb(null, true);
        }
      } catch (_) {}

      console.error(` CORS bloqueó origen: ${origin}`);
      cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
/* --- FIN DE CORS --- */

app.use(express.json());

/* --- ENDPOINT DE SALUD --- */
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

/* --- RUTAS PÚBLICAS --- */
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantPublicRoutes);
app.use('/api/public', publicRoutes);

/* --- RUTAS PROTEGIDAS --- */
const apiRouter = express.Router();
app.use('/api', protect, apiRouter);

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
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/messages', messageRoutes);

/* --- MANEJO DE ERRORES GLOBAL --- */
app.use((err, req, res, next) => {
  console.error('Error global:', err.message);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  
});
