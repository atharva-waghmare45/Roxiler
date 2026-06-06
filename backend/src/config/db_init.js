const fs = require('fs');
const path = require('path');
const { hashPassword } = require('../utils/hash');
const { query, pool } = require('../db');

const runMigrations = async () => {
  try {
    const migrationsDir = path.join(__dirname, 'migrations');

    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found. Creating it...');
      fs.mkdirSync(migrationsDir, { recursive: true });
      return;
    }

    // Read and sort SQL files alphabetically
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration file(s).`);

    for (const file of files) {
      console.log(`Running migration: ${file}...`);
      const migrationPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationPath, 'utf8');
      
      // Execute the raw DDL queries
      await query(sql);
      console.log(`Completed migration: ${file}`);
    }

    console.log('All migrations completed successfully!');

    // Seed default admin user
    const adminEmail = 'admin@roxiler.com';
    const adminCheck = await query('SELECT * FROM users WHERE email = $1', [adminEmail]);

    if (adminCheck.rows.length === 0) {
      console.log('Seeding default system administrator...');
      const hashedPassword = await hashPassword('AdminPassword123!');
      
      await query(
        'INSERT INTO users (name, email, password, address, role) VALUES ($1, $2, $3, $4, $5)',
        [
          'System Administrator Account',
          adminEmail,
          hashedPassword,
          'System Admin Address, Roxiler Store Rating App Headquarters',
          'SYSTEM_ADMIN'
        ]
      );
      console.log('Default admin created:');
      console.log(`Email: ${adminEmail}`);
      console.log('Password: AdminPassword123!');
    } else {
      console.log('System administrator already exists.');
    }
  } catch (error) {
    console.error('Error running migrations:', error);
  } finally {
    await pool.end();
  }
};

runMigrations();
