import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run database migrations
 */
async function runMigrations() {
    try {
        console.log('🔄 Running database migrations...');

        // Read migration file
        const migrationPath = path.join(__dirname, '../../migrations/001_create_tables.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Execute migration
        await sequelize.query(migrationSQL);

        console.log('✅ Migrations completed successfully');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

/**
 * Run database seeds
 */
async function runSeeds() {
    try {
        console.log('🌱 Running database seeds...');

        // Read seed file
        const seedPath = path.join(__dirname, '../../seeds/001_master_data.sql');
        const seedSQL = fs.readFileSync(seedPath, 'utf8');

        // Execute seed
        await sequelize.query(seedSQL);

        console.log('✅ Seeds completed successfully');
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    }
}

// Main execution
(async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established');

        await runMigrations();
        await runSeeds();

        console.log('');
        console.log('========================================');
        console.log('✅ Database setup completed!');
        console.log('========================================');
        console.log('');
        console.log('Default credentials:');
        console.log('  Admin:    username: admin, password: password123');
        console.log('  TURT:     username: turt_kepala, password: password123');
        console.log('  Pemohon:  username: osdm_staff, password: password123');
        console.log('');

        process.exit(0);
    } catch (error) {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    }
})();
