import express from 'express';
import * as DeviceController from '../controllers/devicesController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, DeviceController.getDevices);
router.get('/:id', authenticateToken, DeviceController.getDevice);
router.post('/', authenticateToken, DeviceController.createDevice);
router.put('/:id', authenticateToken, DeviceController.updateDevice);
router.delete('/:id', authenticateToken, DeviceController.deleteDevice);

export default router;