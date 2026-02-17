import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Konfigurasi Sequelize dengan connection pooling dan transaction isolation
const sequelize = new Sequelize(process.env.DATABASE_URL || {
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'postgres'
}, {
  // Connection pooling untuk performa
  pool: {
    max: 20,
    min: 5,
    acquire: 30000,
    idle: 10000
  },
  
  // Transaction isolation level untuk row locking
  isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
  
  // Logging
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  
  // Timezone
  timezone: '+07:00',
  
  // Define options
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
});

// Test koneksi
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return false;
  }
};

export default sequelize;
