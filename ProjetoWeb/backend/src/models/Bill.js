import pool from '../config/database.js';

function transform(row) {
  if (!row) return null;
  return {
    id: row.id,
    device_id: row.id_disp,
    month_year: row.data ? row.data.toISOString().slice(0, 7) : null,
    company_consumption_kwh: row.consumo_estimado ? parseFloat(row.consumo_estimado) : null,
    consumo_iot: row.consumo_iot ? parseFloat(row.consumo_iot) : null,
    amount_paid: row.valor_pago ? parseFloat(row.valor_pago) : null,
    price_per_kwh: row.preco_kwh ? parseFloat(row.preco_kwh) : null,
    device: row.device_id ? { id: row.device_id, name: row.device_name, identification_code: row.device_code } : null
  };
}

export async function findAll(userId) {
  if (!userId) {
    const result = await pool.query(`
      SELECT f.id, f.id_disp, f.data, f.consumo_estimado, f.consumo_iot, f.valor_pago, f.preco_kwh,
             d.id as device_id, d.nome_disp as device_name, d.codigo as device_code
      FROM tb_fatura f
      LEFT JOIN tb_dispositivos d ON f.id_disp = d.id
      ORDER BY f.data DESC
    `);
    return result.rows.map(transform);
  }

  const result = await pool.query(`
    SELECT f.id, f.id_disp, f.data, f.consumo_estimado, f.consumo_iot, f.valor_pago, f.preco_kwh,
           d.id as device_id, d.nome_disp as device_name, d.codigo as device_code
    FROM tb_fatura f
    LEFT JOIN tb_dispositivos d ON f.id_disp = d.id
    WHERE d.id_user = $1
    ORDER BY f.data DESC
  `, [parseInt(userId)]);
  return result.rows.map(transform);
}

export async function findById(id, userId) {
  if (!userId) {
    const result = await pool.query(`
      SELECT f.id, f.id_disp, f.data, f.consumo_estimado, f.consumo_iot, f.valor_pago, f.preco_kwh,
             d.id as device_id, d.nome_disp as device_name, d.codigo as device_code
      FROM tb_fatura f
      LEFT JOIN tb_dispositivos d ON f.id_disp = d.id
      WHERE f.id = $1
    `, [parseInt(id)]);
    return transform(result.rows[0] || null);
  }
  const result = await pool.query(`
    SELECT f.id, f.id_disp, f.data, f.consumo_estimado, f.consumo_iot, f.valor_pago, f.preco_kwh,
           d.id as device_id, d.nome_disp as device_name, d.codigo as device_code
    FROM tb_fatura f
    LEFT JOIN tb_dispositivos d ON f.id_disp = d.id
    WHERE f.id = $1 AND d.id_user = $2
  `, [parseInt(id), parseInt(userId)]);
  return transform(result.rows[0] || null);
}

export async function create(bill, userId) {
  const { device_id, month_year, company_consumption_kwh, consumo_iot, amount_paid, price_per_kwh } = bill;
  const billDate = new Date(month_year + '-01');

  const deviceCheck = await pool.query('SELECT id, id_user, consumo_iot FROM tb_dispositivos WHERE id = $1', [parseInt(device_id)]);
  if (!deviceCheck.rows[0] || (userId && deviceCheck.rows[0].id_user !== parseInt(userId))) {
    throw new Error('Device not found or not owned by user');
  }

  // Se consumo_iot não foi fornecido, buscar do dispositivo
  let finalConsumoIot = consumo_iot;
  if (!finalConsumoIot && deviceCheck.rows[0].consumo_iot !== null && deviceCheck.rows[0].consumo_iot !== undefined) {
    finalConsumoIot = deviceCheck.rows[0].consumo_iot;
  }

  const result = await pool.query(
    `INSERT INTO tb_fatura (id_disp, data, consumo_estimado, consumo_iot, valor_pago, preco_kwh, id_user)
     VALUES ($1, $2, $3, $4, $5, $6, $7) 
     RETURNING id, id_disp, data, consumo_estimado, consumo_iot, valor_pago, preco_kwh`,
    [
      parseInt(device_id), 
      billDate, 
      company_consumption_kwh ? String(company_consumption_kwh) : null, 
      finalConsumoIot ? String(finalConsumoIot) : null, 
      String(amount_paid), 
      String(price_per_kwh),
      userId ? parseInt(userId) : null
    ]
  );
  
  const row = result.rows[0];
  const deviceResult = await pool.query('SELECT id, nome_disp, codigo FROM tb_dispositivos WHERE id = $1', [row.id_disp]);
  if (deviceResult.rows[0]) {
    row.device_id = deviceResult.rows[0].id;
    row.device_name = deviceResult.rows[0].nome_disp;
    row.device_code = deviceResult.rows[0].codigo;
  }
  
  return transform(row);
}

export async function update(id, bill, userId) {
  // Ensure the bill belongs to a device owned by user
  if (userId) {
    const check = await pool.query(`
      SELECT f.id FROM tb_fatura f
      LEFT JOIN tb_dispositivos d ON f.id_disp = d.id
      WHERE f.id = $1 AND d.id_user = $2
    `, [parseInt(id), parseInt(userId)]);
    if (!check.rows[0]) return null;
  }

  const updates = [];
  const values = [];
  let paramCount = 1;

  if (bill.device_id !== undefined) {
    updates.push(`id_disp = $${paramCount++}`);
    values.push(parseInt(bill.device_id));
  }
  if (bill.month_year !== undefined) {
    const billDate = new Date(bill.month_year + '-01');
    updates.push(`data = $${paramCount++}`);
    values.push(billDate);
  }
  if (bill.company_consumption_kwh !== undefined) {
    updates.push(`consumo_estimado = $${paramCount++}`);
    values.push(String(bill.company_consumption_kwh));
  }
  if (bill.consumo_iot !== undefined) {
    updates.push(`consumo_iot = $${paramCount++}`);
    values.push(String(bill.consumo_iot));
  }
  if (bill.amount_paid !== undefined) {
    updates.push(`valor_pago = $${paramCount++}`);
    values.push(String(bill.amount_paid));
  }
  if (bill.price_per_kwh !== undefined) {
    updates.push(`preco_kwh = $${paramCount++}`);
    values.push(String(bill.price_per_kwh));
  }

  if (updates.length === 0) return await findById(id, userId);

  values.push(parseInt(id));
  const result = await pool.query(
    `UPDATE tb_fatura SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, id_disp, data, consumo_estimado, consumo_iot, valor_pago, preco_kwh`,
    values
  );
  
  if (!result.rows[0]) return null;
  
  const deviceId = result.rows[0].id_disp;
  const deviceResult = await pool.query('SELECT id, nome_disp, codigo FROM tb_dispositivos WHERE id = $1', [deviceId]);
  const row = result.rows[0];
  row.device_id = deviceResult.rows[0]?.id;
  row.device_name = deviceResult.rows[0]?.nome_disp;
  row.device_code = deviceResult.rows[0]?.codigo;
  
  return transform(row);
}

export async function deleteBill(id, userId) {
  if (userId) {
    const result = await pool.query(`
      DELETE FROM tb_fatura WHERE id = $1 AND id IN (
        SELECT f.id FROM tb_fatura f
        LEFT JOIN tb_dispositivos d ON f.id_disp = d.id
        WHERE f.id = $1 AND d.id_user = $2
      )
    `, [parseInt(id), parseInt(userId)]);
    return result.rowCount > 0;
  }
  const result = await pool.query('DELETE FROM tb_fatura WHERE id = $1', [parseInt(id)]);
  return result.rowCount > 0;
}

export async function findAllForDashboard(userId) {
  const params = [];
  let query = `
    SELECT f.id, f.id_disp, f.data, f.consumo_estimado, f.consumo_iot, f.valor_pago, f.preco_kwh,
           d.id as device_id, d.nome_disp as device_name, d.codigo as device_code
    FROM tb_fatura f
    LEFT JOIN tb_dispositivos d ON f.id_disp = d.id
  `;

  if (userId) {
    query += ` WHERE d.id_user = $1 `;
    params.push(parseInt(userId));
  }

  query += ` ORDER BY f.data ASC `;

  const result = await pool.query(query, params);
  return result.rows.map(transform);
}
