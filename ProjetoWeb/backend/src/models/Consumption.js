import pool from '../config/database.js';

/**
 * Encontra o ID interno do dispositivo (tb_dispositivos.id) baseado no código único (tb_dispositivos.codigo).
 * @param {string} deviceCode - O código único enviado pelo ESP32 (ID_DISPOSITIVO).
 * @returns {Promise<number|null>} O ID interno do dispositivo.
 */
async function findDeviceIdByCode(deviceCode) {
    if (!deviceCode) return null;
    // Busca case-insensitive para aceitar códigos como 'rel001' ou 'REL001'
    // Esta consulta é necessária para o Consumption Controller registrar dados
    const result = await pool.query(
        'SELECT id FROM tb_dispositivos WHERE LOWER(codigo) = LOWER($1)',
        [deviceCode]
    );
    // Usamos parseInt pois o resultado do DB pode ser string
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
        // Melhor lançar um erro mais específico em produção
        throw new Error('Device ID and consumption data are required.');
    }

    const consumptionNumeric = parseFloat(consumptionWh);
    if (!isFinite(consumptionNumeric) || consumptionNumeric < 0) {
        throw new Error('Invalid or negative consumption value.');
    }

    // CORREÇÃO: Removendo 'created_at' do RETURNING.
    // Se a sua tabela tiver uma coluna de timestamp automático (e.g., 'timestamp_registro'),
    // ajuste o RETURNING para o nome correto da coluna. Caso contrário,
    // apenas retornamos os valores essenciais.
    const result = await pool.query(
        `INSERT INTO tb_consumo_horario (id_disp, consumo_wh)
         VALUES ($1, $2)
         RETURNING id, id_disp, consumo_wh`,
        [deviceId, consumptionNumeric]
    );

    // Retorna o registro inserido, caso necessário para logs ou debug
    return result.rows[0];
}

export default {
    findDeviceIdByCode,
    recordHourlyConsumption
};