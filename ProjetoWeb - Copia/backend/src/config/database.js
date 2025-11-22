import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL não configurada');
  process.exit(1);
}

// Configura o pool de conexões
const pool = new Pool({
  connectionString,
  ssl: false, // desativa SSL para local
  max: 5,
  min: 0,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Eventos do pool
pool.on('connect', () => {
  console.log('✅ Conexão com PostgreSQL estabelecida!');
});

pool.on('error', (err) => {
  console.error('❌ Database error:', err.message);
});

// Função de validação da conexão
const validateConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW() AS server_time');
    console.log('🕒 PostgreSQL funcionando! Hora do servidor:', res.rows[0].server_time);
  } catch (err) {
    console.error('❌ Falha ao validar conexão com PostgreSQL:', err.message);
    process.exit(1);
  }
};

// Executa a validação ao iniciar o backend
validateConnection();

export default pool;
