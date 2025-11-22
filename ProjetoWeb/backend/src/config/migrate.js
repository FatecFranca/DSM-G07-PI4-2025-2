import pool from './database.js';
import dotenv from 'dotenv';

dotenv.config();

const createTables = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ============================
    // Tabela de usuários
    // ============================
    await client.query(`
      CREATE TABLE IF NOT EXISTS tb_usuarios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        senha TEXT NOT NULL
      )
    `);

    // ============================
    // Tabela de dispositivos
    // ============================
    await client.query(`
      CREATE TABLE IF NOT EXISTS tb_dispositivos (
        id SERIAL PRIMARY KEY,
        id_user INT NOT NULL REFERENCES tb_usuarios(id) ON DELETE CASCADE,
        nome_disp VARCHAR(100) NOT NULL,
        codigo VARCHAR(100) UNIQUE NOT NULL,
        consumo_iot NUMERIC(10,2),
        endereco VARCHAR(200) NOT NULL
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_dispositivos_id_user
      ON tb_dispositivos(id_user)
    `);

    // ============================
    // Tabela de faturas
    // ============================
    await client.query(`
      CREATE TABLE IF NOT EXISTS tb_fatura (
        id SERIAL PRIMARY KEY,
        id_disp INT NOT NULL REFERENCES tb_dispositivos(id),
        id_user INT NOT NULL REFERENCES tb_usuarios(id) ON DELETE CASCADE,
        data DATE NOT NULL,
        consumo_estimado NUMERIC(10,2) NOT NULL,
        consumo_iot NUMERIC(10,2) NOT NULL,
        valor_pago NUMERIC(10,2) NOT NULL,
        preco_kwh NUMERIC(10,4) NOT NULL
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_fatura_id_disp
      ON tb_fatura(id_disp)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_fatura_id_user
      ON tb_fatura(id_user)
    `);

    // ============================
    // Trigger: valida se o dispositivo pertence a um usuário
    // ============================
    await client.query(`
      CREATE OR REPLACE FUNCTION check_bill_device_owner()
      RETURNS TRIGGER AS $$
      BEGIN
        PERFORM 1 
        FROM tb_dispositivos 
        WHERE id = NEW.id_disp AND id_user IS NOT NULL;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'Device does not exist or is not owned by a user';
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS trg_check_bill_device_owner ON tb_fatura;
    `);

    await client.query(`
      CREATE TRIGGER trg_check_bill_device_owner
      BEFORE INSERT OR UPDATE ON tb_fatura
      FOR EACH ROW 
      EXECUTE FUNCTION check_bill_device_owner();
    `);

    await client.query('COMMIT');
    console.log('✅ Tabelas e trigger criadas com sucesso!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao criar tabelas/triggers:', error.message);
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
