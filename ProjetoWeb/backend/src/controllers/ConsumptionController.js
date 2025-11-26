import ConsumptionModel from '../models/Consumption.js';

/**
 * Recebe e registra o consumo horário enviado pelo dispositivo IoT (ESP32).
 * Aceita tanto GET (query params) quanto POST JSON.
 */
export const recordConsumption = async (req, res) => {
    // Aceita body JSON (POST) ou query string (GET)
    const deviceCode = (req.body && req.body.disp_id) || req.query.disp_id;
    const rawConsumption = (req.body && (req.body.consumo_wh ?? req.body.consumo)) || req.query.consumo_wh || req.query.consumo;
    const consumptionWh = parseFloat(rawConsumption);

    // Validação básica
    if (!deviceCode || !isFinite(consumptionWh)) {
        return res.status(400).send('Missing disp_id or invalid consumo_wh.');
    }

    try {
        // Converte o código do ESP32 para o ID interno do DB
        const deviceId = await ConsumptionModel.findDeviceIdByCode(deviceCode);

        if (!deviceId) {
            console.error(`Device not found with code: ${deviceCode}`);
            return res.status(404).send('Device not registered.');
        }

        // Registra o consumo na tabela horária
        await ConsumptionModel.recordHourlyConsumption(deviceId, consumptionWh);

        res.status(200).send('Consumption recorded.');

    } catch (error) {
        console.error('Error recording IoT consumption:', error);
        const message = process.env.NODE_ENV === 'development' ? (error.stack || error.message) : 'Internal server error.';
        res.status(500).send(message);
    }
};