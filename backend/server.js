const express = require('express');
const cors = require('cors');
require('dotenv').config();

// --- LÓGICA DE CORS MEJORADA PARA PRODUCCIÓN ---

// Define la URL principal de tu frontend desde las variables de entorno
const frontendUrl = process.env.FRONTEND_URL; // Ej: https://orpos.site
let allowedOrigins = [];

if (frontendUrl) {
    // Si la variable está definida, construimos la lista de orígenes permitidos
    const mainDomain = frontendUrl.split('//')[1]; // extrae "orpos.site"
    allowedOrigins = [
        frontendUrl, // https://orpos.site
        `https://www.${mainDomain}`, // https://www.orpos.site
        // Expresión regular para permitir CUALQUIER subdominio
        new RegExp(`^https://[a-z0-9-]+\\.${mainDomain}$`)
    ];
} else {
    // Si FRONTEND_URL no está definida (entorno local), permitimos todo por conveniencia
    console.warn("ADVERTENCIA: La variable de entorno FRONTEND_URL no está definida. CORS está abierto a todos los orígenes.");
}

const corsOptions = {
    origin: function (origin, callback) {
        // En desarrollo, puede que no haya frontendUrl, por lo que permitimos todo.
        if (!frontendUrl || !origin || allowedOrigins.some(o => (typeof o === 'string' ? o === origin : o.test(origin)))) {
            callback(null, true);
        } else {
            console.error(`Origen no permitido por CORS: ${origin}`);
            callback(new Error('No permitido por la política de CORS'));
        }
    },
    credentials: true, // Importante para que las cookies/tokens se envíen
};

// --- FIN DE LÓGICA DE CORS ---

const { protect } = require('./middleware/authMiddleware');

const authRoutes = require('./routes/authRoutes');
const tenantPublicRoutes = require('./routes/tenantPublicRoutes'); // <- Veo que añadiste esto, se mantiene
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

// APLICAMOS LAS OPCIONES DE CORS EN LUGAR DEL CORS POR DEFECTO
app.use(cors(corsOptions)); 

app.use(express.json()); 

app.get('/api', (req, res) => {
  res.json({ message: '¡Bienvenido a la API!' });
});

// --- GESTIÓN DE RUTAS SIMPLIFICADA (SIN CAMBIOS) ---
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantPublicRoutes);

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
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});