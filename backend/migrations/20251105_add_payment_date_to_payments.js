const db = require('../db');

async function up() {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(`
      ALTER TABLE payments
      ADD COLUMN payment_date DATETIME DEFAULT CURRENT_TIMESTAMP;
    `);
    await connection.commit();

  } catch (error) {
    await connection.rollback();
    console.error('Error running migration 20251105_add_payment_date_to_payments:', error);
    process.exit(1);
  } finally {
    connection.release();
    process.exit(0);
  }
}

up();
