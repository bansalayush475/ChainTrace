import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load .env if present
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [k, ...v] = trimmed.split('=');
      const key = k.trim();
      const val = v.join('=').trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

// Import routes
import healthRouter from './routes/health.js';
import investigationsRouter from './routes/investigations.js';
import ncrpRouter from './routes/ncrp.js';
import traceRouter from './routes/trace.js';
import freezeRouter from './routes/freeze.js';
import auditRouter from './routes/audit.js';
import walletsRouter from './routes/wallets.js';
import transactionsRouter from './routes/transactions.js';
import evidenceRouter from './routes/evidence.js';
import authRouter from './routes/auth.js';
import blockchainRouter from './routes/blockchain.js';
import mlRouter from './routes/ml.js';

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Audit request logger
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[ChainTrace API] ${req.method} ${req.path} ${res.statusCode} (${duration}ms)`);
    });
  }
  next();
});

// API Routes
app.use('/api/health', healthRouter);
app.use('/api/investigations', investigationsRouter);
app.use('/api/ncrp', ncrpRouter);
app.use('/api/trace', traceRouter);
app.use('/api/blockchain', blockchainRouter);
app.use('/api/freeze', freezeRouter);
app.use('/api/audit', auditRouter);
app.use('/api/wallets', walletsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/evidence', evidenceRouter);
app.use('/api/auth', authRouter);
app.use('/api/ml', mlRouter);

// Root API ping
app.get('/api', (req, res) => {
  res.json({
    name: 'ChainTrace: Sovereign Crypto-Blockchain Forensic & Intelligence Platform',
    version: '2.0.0',
    status: 'OPERATIONAL',
    docs: '/api/health',
    blockchainNodes: '/api/blockchain/status',
  });
});

export default app;
