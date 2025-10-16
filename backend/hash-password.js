const bcrypt = require('bcrypt');

const saltRounds = 10; // Factor de costo para el hasheo
const plainPassword = 'admin123';

bcrypt.hash(plainPassword, saltRounds, function(err, hash) {
    if (err) {
        console.error('Error al hashear la contraseña:', err);
        return;
    }
    console.log('Contraseña en texto plano:', plainPassword);
    console.log('Hash generado:', hash);
    console.log("\nEjecuta esta sentencia SQL en MySQL Workbench para actualizar al usuario:");
    console.log(`UPDATE users SET password = '${hash}' WHERE username = 'admin';`);
});