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

/* --- CORS DINÁMICO PARA MULTI-TENANT --- */
const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // Permitir herramientas tipo curl o Postman

    try {
      const url = new URL(origin);
      const host = url.hostname;

      //  Entornos permitidos
      if (
        host === 'localhost' ||                      // desarrollo local (Vite)
        host === '127.0.0.1' ||                      // alternativa localhost
        host === 'orpos.site' ||                     // dominio principal
        host === 'www.orpos.site' ||                 // www
        host.endsWith('.orpos.site')                 // subdominios
      ) {
        return cb(null, true);
      }
    } catch (_) {}

    console.error(`CORS bloqueó origen: ${origin}`);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
};
app.use(cors(corsOptions));
/* --- FIN DE CORS --- */


app.use(express.json());

app.get('/api', (req, res) => {
  res.json({ message: '¡Bienvenido a la API de OrPOS!' });
});

/* --- RUTAS PÚBLICAS --- */
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantPublicRoutes);

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
