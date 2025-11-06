const db = require('../db');

async function up() {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    await connection.query(`
      ALTER TABLE sales 
      ADD COLUMN table_service_fee DECIMAL(10, 2) DEFAULT 0.00
    `);
    await connection.commit();
    console.log('Migration successful: added table_service_fee to sales table.');
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error running migration:', error);
    throw error; // Re-throw error to be caught by the final catch block
  } finally {
    if (connection) connection.release();
  }
}

// Execute the migration and handle process exit
up()
  .then(() => {
    console.log('Migration script finished successfully.');
    process.exit(0);
  })
  .catch(() => {
    // Error is already logged in the up() function
    process.exit(1);
  });
