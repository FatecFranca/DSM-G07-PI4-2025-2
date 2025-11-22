import { Router } from 'express';
import { getDashboard, getAnalytics } from '../controllers/dashboardController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getDashboard);
router.get('/analytics', getAnalytics);

export default router;

