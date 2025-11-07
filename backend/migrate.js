const db = require('./db');
const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, 'migrations');

async function runMigrations() {
  try {
    const files = fs.readdirSync(migrationsDir).sort();
    for (const file of files) {
      if (file.endsWith('.js')) {
        const migration = require(path.join(migrationsDir, file));
        if (typeof migration.up === 'function') {
          console.log(`Running migration: ${file}`);
          await migration.up();
        }
      }
    }
    console.log('Migrations completed.');
  } catch (error) {
    console.error('Error running migrations:', error);
  } finally {
    db.end();
  }
}

runMigrations();
