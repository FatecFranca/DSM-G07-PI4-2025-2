import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

export async function findByEmail(email) {
  const result = await pool.query('SELECT * FROM tb_usuarios WHERE email = $1', [email]);
  return result.rows[0] || null;
}

export async function findById(id) {
  const result = await pool.query('SELECT id, nome, email FROM tb_usuarios WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function create(nome, email, password) {
  const passwordHash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    'INSERT INTO tb_usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email',
    [nome, email, passwordHash]
  );
  return result.rows[0];
}

export async function verifyPassword(user, password) {
  if (!user?.senha) return false;
  return await bcrypt.compare(password, user.senha);
}
