// Importar los módulos necesarios
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
require('dotenv').config(); // Carga las variables de entorno desde .env

// Inicializar la aplicación de Express
const app = express();

// Configurar middlewares
app.use(cors()); // Permite solicitudes de otros orígenes (nuestro frontend)
app.use(express.json()); // Permite al servidor entender JSON

// Configuración de la conexión a la base de datos
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

// Conectar a la base de datos
db.connect(err => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    return;
  }
  console.log('Conectado exitosamente a la base de datos MySQL.');
});

// Ruta de prueba para verificar que el servidor funciona
app.get('/api', (req, res) => {
  res.json({ message: '¡Hola desde el backend de El Mercadito!' });
});

// Iniciar el servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});