
const db = require('../db');

async function up() {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(`
      ALTER TABLE sales 
      ADD COLUMN payment_methods JSON DEFAULT NULL,
      ADD COLUMN payment_method_legacy VARCHAR(255) DEFAULT NULL
    `);
    await connection.query(`UPDATE sales SET payment_method_legacy = payment_method`);
    await connection.query(`ALTER TABLE sales DROP COLUMN payment_method`);
    await connection.query(`ALTER TABLE sales RENAME COLUMN payment_method_legacy TO payment_method`);
    await connection.commit();

  } catch (error) {
    await connection.rollback();
    console.error('Error running migration:', error);
    process.exit(1);
  } finally {
    connection.release();
    process.exit(0);
  }
}

up();
