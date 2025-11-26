import pool from '../config/database.js';

export async function findAll(userId) {
  const result = await pool.query('SELECT id, nome_disp as name, codigo as identification_code, endereco as property_address, consumo_iot FROM tb_dispositivos WHERE id_user = $1 ORDER BY id DESC', [parseInt(userId)]);
  return result.rows;
}

export async function findById(id, userId) {
  const result = await pool.query('SELECT id, nome_disp as name, codigo as identification_code, endereco as property_address, consumo_iot FROM tb_dispositivos WHERE id = $1 AND id_user = $2', [parseInt(id), parseInt(userId)]);
  return result.rows[0] || null;
}

export async function deleteDevice(id, userId) {
  if (userId) {
    const result = await pool.query('DELETE FROM tb_dispositivos WHERE id = $1 AND id_user = $2', [parseInt(id), parseInt(userId)]);
    return result.rowCount > 0;
  }
  const result = await pool.query('DELETE FROM tb_dispositivos WHERE id = $1', [parseInt(id)]);
  return result.rowCount > 0;
}

export async function findLast(userId) {
  const result = await pool.query(
    `SELECT codigo AS identification_code
     FROM tb_dispositivos
     WHERE id_user = $1
     ORDER BY id DESC
     LIMIT 1`,
    [parseInt(userId)]
  );

  return result.rows[0] || null;
}

export async function create(device, userId) {
  const result = await pool.query(
    'INSERT INTO tb_dispositivos (nome_disp, codigo, endereco, id_user) VALUES ($1, $2, $3, $4) RETURNING id, nome_disp as name, codigo as identification_code, endereco as property_address',
    [device.name, device.identification_code, device.property_address, userId ? parseInt(userId) : null]
  );
  return result.rows[0];
}

export async function update(id, device, userId) {
  const updates = [];
  const values = [];
  let paramCount = 1;

  if (device.name !== undefined) {
    updates.push(`nome_disp = $${paramCount++}`);
    values.push(device.name);
  }
  if (device.identification_code !== undefined) {
    updates.push(`codigo = $${paramCount++}`);
    values.push(device.identification_code);
  }
  if (device.property_address !== undefined) {
    updates.push(`endereco = $${paramCount++}`);
    values.push(device.property_address);
  }
  if (device.consumo_iot !== undefined) {
    updates.push(`consumo_iot = $${paramCount++}`);
    values.push(device.consumo_iot);
  }

  if (updates.length === 0) return await findById(id, userId);

  values.push(parseInt(id));
  if (userId) {
    values.push(parseInt(userId));
    const result = await pool.query(
            `UPDATE tb_dispositivos SET ${updates.join(', ')} WHERE id = $${paramCount} AND id_user = $${paramCount+1} RETURNING id, nome_disp as name, codigo as identification_code, endereco as property_address, consumo_iot`,

      values

    );

    return result.rows[0] || null;

  } else {

    const result = await pool.query(

      `UPDATE tb_dispositivos SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, nome_disp as name, codigo as identification_code, endereco as property_address, consumo_iot`,

      values

    );

    return result.rows[0] || null;

  }
}


export async function updateConsumptionById(id, id_user, consumo_kwh) {
  if (id_user) {
    const result = await pool.query(
      `UPDATE tb_dispositivos SET consumo_iot = $1 WHERE id = $2 AND id_user = $3 RETURNING id, nome_disp as name, codigo as identification_code, endereco as property_address, consumo_iot`,
      [consumo_kwh, parseInt(id), parseInt(id_user)]
    );
    return result.rows[0] || null;
  }
}

/**
 * Atualiza o consumo_iot de um dispositivo usando o código de identificação (disp_id).
 * Este é o método preferido para requisições de dispositivos IoT (ESP32).
 */
export async function updateConsumptionByCode(disp_id, consumo_kwh) {
  // Usamos o código (disp_id) para encontrar e atualizar.
  const result = await pool.query(
    `UPDATE tb_dispositivos SET consumo_iot = $1 WHERE codigo = $2 RETURNING id, nome_disp as name, codigo as identification_code, endereco as property_address, consumo_iot`,
    [consumo_kwh, disp_id]
  );
  return result.rows[0] || null;
}

/**
 * Encontra o ID interno do dispositivo (id) usando o código de identificação (codigo).
 * Necessário para registrar consumo em tabelas relacionadas como tb_consumo_horario.
 */
export async function findDeviceIdByCode(deviceCode) {
  const result = await pool.query(
    `SELECT id FROM tb_dispositivos WHERE codigo = $1`,
    [deviceCode]
  );
  return result.rows[0] ? result.rows[0].id : null;
}