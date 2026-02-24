import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import authRoutes from './routes/auth.js';
import customerRoutes from './routes/customers.js';
import deviceRoutes from './routes/devices.js';
import ticketRoutes from './routes/tickets.js';
import timelineRoutes from './routes/timeline.js';
import scheduleRoutes from './routes/schedules.js';
import financialRoutes from './routes/financial.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Obter IP da maquina
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const LOCAL_IP = getLocalIP();

// Configurar armazenamento para uploads de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads');
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Middleware para criar diretório de uploads se não existir
import fs from 'fs';
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// CORS para permitir acesso de qualquer origem na rede
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', `http://${LOCAL_IP}:3000`, `http://${LOCAL_IP}:5173`, '*'],
  credentials: true
}));
app.use(express.json());

// Rotas para upload de arquivos
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }
  res.json({
    filename: req.file.filename,
    originalname: req.file.originalname,
    path: `/uploads/${req.file.filename}`
  });
});

app.post('/api/upload-multiple', upload.array('files'), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }
  const filesInfo = (req.files as Express.Multer.File[]).map(file => ({
    filename: file.filename,
    originalname: file.originalname,
    path: `/uploads/${file.filename}`
  }));
  res.json({ files: filesInfo });
});

// Servir arquivos estáticos de uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/financial', financialRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erro:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Servir arquivos estaticos do frontend (modo producao)
const distPath = path.join(__dirname, '../../dist');
app.use(express.static(distPath));

// Rota catch-all para o frontend (SPA)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  }
});

// Escutar em todas as interfaces (0.0.0.0)
const portNumber = typeof PORT === 'string' ? parseInt(PORT, 10) : PORT;
app.listen(portNumber, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${portNumber}`);
  console.log(`API disponivel em:`);
  console.log(`  - Local: http://localhost:${portNumber}/api`);
  console.log(`  - Rede:  http://${LOCAL_IP}:${portNumber}/api`);
  console.log(`Frontend disponivel em:`);
  console.log(`  - Local: http://localhost:${portNumber}`);
  console.log(`  - Rede:  http://${LOCAL_IP}:${portNumber}`);
});
