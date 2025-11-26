import express from 'express';
import * as ConsumptionController from '../controllers/ConsumptionController.js';

const router = express.Router();

// ENDPOINT DO ESP32 (não requer authenticateToken)
// Rota: /api/consumo/registrar
router.get('/registrar', ConsumptionController.recordConsumption);
router.post('/registrar', ConsumptionController.recordConsumption);

export default router;