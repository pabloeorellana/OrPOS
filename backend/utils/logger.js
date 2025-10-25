const db = require('../db');

// La firma de la función ahora incluye 'tenantId'
const logAction = async (userId, action, tenantId, details = {}) => {
  try {
    // La consulta INSERT ahora incluye la columna tenant_id
    const query = 'INSERT INTO audit_log (user_id, action, details, tenant_id) VALUES (?, ?, ?, ?)';
    
    // Pasamos el tenantId como último parámetro. Puede ser un número o NULL.
    await db.query(query, [userId, action, JSON.stringify(details), tenantId]);
  } catch (error) {
    console.error('Failed to write to audit log:', error);
  }
};

module.exports = { logAction };