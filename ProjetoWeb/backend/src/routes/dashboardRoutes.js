import { Router } from 'express';
import { getDashboard } from '../controllers/dashboardController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getDashboard);

export default router;

