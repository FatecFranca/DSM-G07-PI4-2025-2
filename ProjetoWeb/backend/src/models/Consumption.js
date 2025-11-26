import pool from '../config/database.js';

/**
 * Encontra o ID interno do dispositivo (tb_dispositivos.id) baseado no código único (tb_dispositivos.codigo).
 * @param {string} deviceCode - O código único enviado pelo ESP32 (ID_DISPOSITIVO).
 * @returns {Promise<number|null>} O ID interno do dispositivo.
 */
async function findDeviceIdByCode(deviceCode) {
    if (!deviceCode) return null;
    // Busca case-insensitive para aceitar códigos como 'rel001' ou 'REL001'
    const result = await pool.query(
        'SELECT id FROM tb_dispositivos WHERE LOWER(codigo) = LOWER($1)',
        [deviceCode]
    );
    return result.rows[0] ? parseInt(result.rows[0].id) : null;
}

/**
 * Registra o consumo de energia (Wh) na tabela tb_consumo_horario.
 * @param {number} deviceId - O ID interno (id_disp) do dispositivo.
 * @param {number} consumptionWh - O consumo acumulado no período (Wh).
 * @returns {Promise<object>} O registro inserido.
 */
export async function recordHourlyConsumption(deviceId, consumptionWh) {
    if (!deviceId || consumptionWh === undefined || consumptionWh === null) {
        throw new Error('Device ID and consumption data are required.');
    }

    const consumptionNumeric = parseFloat(consumptionWh);
    if (!isFinite(consumptionNumeric)) {
        throw new Error('Invalid consumption value');
    }

    const result = await pool.query(
        `INSERT INTO tb_consumo_horario (id_disp, consumo_wh)
         VALUES ($1, $2)
         RETURNING id, id_disp, timestamp_fim, consumo_wh`,
        [deviceId, consumptionNumeric]
    );

    // Retorna o registro inserido, caso necessário para logs ou debug
    return result.rows[0];
}

export default {
    findDeviceIdByCode,
    recordHourlyConsumption
};