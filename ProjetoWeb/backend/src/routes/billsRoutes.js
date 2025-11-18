import express from 'express';
import * as BillsController from '../controllers/billsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, BillsController.getBills);
router.get('/:id', authenticateToken, BillsController.getBill);
router.post('/', authenticateToken, BillsController.createBill);
router.put('/:id', authenticateToken, BillsController.updateBill);
router.delete('/:id', authenticateToken, BillsController.deleteBill);

export default router;