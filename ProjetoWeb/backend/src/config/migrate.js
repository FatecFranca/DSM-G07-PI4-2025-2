import pool from './database.js';
import dotenv from 'dotenv';

dotenv.config();

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Tabela de usuários
    await client.query(`
      CREATE TABLE IF NOT EXISTS tb_usuarios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        senha TEXT NOT NULL
      )
    `);

    // Tabela de dispositivos (agora com id_user)
    await client.query(`
      CREATE TABLE IF NOT EXISTS tb_dispositivos (
        id SERIAL PRIMARY KEY,
        nome_disp VARCHAR(100) NOT NULL,
        codigo VARCHAR(100) UNIQUE NOT NULL,
        endereco VARCHAR(200) NOT NULL,
        id_user INT REFERENCES tb_usuarios(id)
      )
    `);

    // Tabela de faturas (agora com id_user)
    await client.query(`
      CREATE TABLE IF NOT EXISTS tb_fatura (
        id SERIAL PRIMARY KEY,
        id_disp INT NOT NULL REFERENCES tb_dispositivos(id),
        data DATE NOT NULL,
        consumo_estimado VARCHAR(20),
        consumo_real VARCHAR(20),
        valor_pago VARCHAR(20),
        preco_kwh VARCHAR(20),
        id_user INT REFERENCES tb_usuarios(id)
      )
    `);

    await client.query('COMMIT');
    console.log('✅ Tabelas criadas com sucesso!');
    console.log('📋 Tabelas criadas:');
    console.log('   - tb_usuarios (usuários)');
    console.log('   - tb_dispositivos (dispositivos)');
    console.log('   - tb_fatura (faturas)');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao criar tabelas:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

const runMigration = async () => {
  try {
    console.log('🔄 Iniciando migração do banco de dados...');
    await createTables();
    console.log('✅ Migração concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migração falhou:', error);
    process.exit(1);
  }
};

runMigration();