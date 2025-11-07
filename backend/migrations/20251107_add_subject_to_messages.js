const db = require('../db');

module.exports.up = async function () {
  // Agrega columna subject a la tabla messages
  await db.query(`ALTER TABLE messages ADD COLUMN subject VARCHAR(200) NOT NULL DEFAULT '' AFTER message`);
};

module.exports.down = async function () {
  await db.query(`ALTER TABLE messages DROP COLUMN subject`);
};
