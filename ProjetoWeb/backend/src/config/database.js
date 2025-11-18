import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL não configurada');
  process.exit(1);
}

// Configurar SSL para Supabase
const sslConfig = connectionString.includes('supabase') 
  ? { rejectUnauthorized: false }
  : false;

const pool = new Pool({
  connectionString,
  ssl: sslConfig,
  max: 5,
  min: 0,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Database error:', err.message);
});

export default pool;
