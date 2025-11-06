const bcrypt = require('bcrypt');

const saltRounds = 10; // Factor de costo para el hasheo
const plainPassword = 'admin123';

bcrypt.hash(plainPassword, saltRounds, function(err, hash) {
    if (err) {
        console.error('Error al hashear la contraseña:', err);
        return;
    }




});