const jwt = require('jsonwebtoken');
require('dotenv').config();

const protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // 'decoded' ahora es el 'payload' que creamos en el login.
            // Contiene: { id, username, tenantId, role, permissions }
            req.user = decoded; 
            next();
        } catch (error) {
            res.status(401).json({ message: 'No autorizado, token inválido' });
        }
    } else {
        res.status(401).json({ message: 'No autorizado, no hay token' });
    }
};

const hasPermission = (requiredPermission) => {
    return (req, res, next) => {
        if (!req.user || !req.user.permissions || !req.user.permissions.includes(requiredPermission)) {
            return res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
        }
        next();
    };
};

module.exports = { protect, hasPermission };