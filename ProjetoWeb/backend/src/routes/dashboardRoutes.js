import { Router } from 'express';
import { getDashboard, getAnalytics, getMediaGeral, getDesvioPadrao, getProbabilidadeProximoMes } from '../controllers/dashboardController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getDashboard);
router.get('/analytics', getAnalytics);
router.get('/media-geral', getMediaGeral);
router.get('/desvio-padrao', getDesvioPadrao);
router.get('/probabilidade-proximo-mes', getProbabilidadeProximoMes);

export default router;

