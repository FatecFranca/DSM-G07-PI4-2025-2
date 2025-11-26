import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import devicesRoutes from './routes/devicesRoutes.js';
import billsRoutes from './routes/billsRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import consumptionRoutes from './routes/consumptionRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();



app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Log simple das requisições (método, url e body) para debug do ESP
app.use((req, res, next) => {
  try {
    console.log(`[REQ] ${req.method} ${req.originalUrl}`);
    if (Object.keys(req.headers || {}).length) console.log('[REQ HEADERS]', { host: req.headers.host, 'content-type': req.headers['content-type'] });
    if (req.body && Object.keys(req.body).length) console.log('[REQ BODY]', req.body);
  } catch (e) {
    console.error('Error logging request', e);
  }
  next();
});

// Routes
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'index.html'));
});


app.use('/api/auth', authRoutes);
app.use('/api/devices', devicesRoutes);
// Alias em PT-BR para compatibilidade com sketches antigos
app.use('/api/dispositivos', devicesRoutes);
app.use('/api/bills', billsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/consumo', consumptionRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});
app.use((err, req, res, next) => {
  // Log do erro no servidor sempre
  console.error(err);

  // Em ambiente de desenvolvimento, envie stack/message para facilitar debug
  if (process.env.NODE_ENV === 'development') {
    const message = err.stack || err.message || 'Internal server error';
    return res.status(500).json({ error: message });
  }

  // Em produção, não vaze detalhes sensíveis
  res.status(500).json({ error: 'Internal server error' });
});

export default app;

