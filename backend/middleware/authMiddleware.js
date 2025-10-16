const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware para proteger rutas que requieren autenticación
const protect = (req, res, next) => {
    let token;

    // El token se envía en el encabezado de autorización como "Bearer <token>"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 1. Extraer el token
            token = req.headers.authorization.split(' ')[1];

            // 2. Verificar que el token sea válido usando nuestro secreto
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Añadir los datos del usuario decodificado al objeto 'req'
            //    para que las siguientes funciones puedan usarlo
            req.user = decoded;

            next(); // El token es válido, continuar a la siguiente función (la ruta principal)
        } catch (error) {
            res.status(401).json({ message: 'No autorizado, token inválido' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'No autorizado, no hay token' });
    }
};

// Middleware para restringir el acceso solo a ciertos roles
const restrictTo = (...roles) => {
    return (req, res, next) => {
        // 'roles' es un array como ['administrador', 'propietario']
        // req.user.role viene del middleware 'protect'
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
        }
        next();
    };
};

module.exports = { protect, restrictTo };