import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import crypto from 'crypto';
import { pino } from 'pino';
import path from 'path';
import { fileURLToPath } from 'url';
import healthRoutes from './routes/health.js';
import memeRoutes from './routes/meme.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: { colorize: true }
  } : undefined
});

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

// Generate CSP nonce per request
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
});

// Security middleware with nonce-based CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", (req, res) => `'nonce-${(res as express.Response).locals.nonce}'`],
      styleSrc: ["'self'", (req, res) => `'nonce-${(res as express.Response).locals.nonce}'`],
      imgSrc: ["'self'", "data:", "blob:", "https://oaidalleapiprodscus.blob.core.windows.net", "https://i.imgflip.com"],
      connectSrc: ["'self'"],
    }
  }
}));

// CORS with origin validation
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:8080')
  .split(',')
  .map(origin => origin.trim())
  .filter(origin => {
    try {
      new URL(origin);
      return true;
    } catch {
      logger.warn(`Invalid CORS origin ignored: ${origin}`);
      return false;
    }
  });
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '1mb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Date.now() - start
    });
  });
  next();
});

// API Routes
app.use('/health', healthRoutes);
app.use('/api/meme', memeRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const clientPath = path.join(__dirname, '../client');
  app.use(express.static(clientPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({ error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  logger.info({
    message: `🐙 Meme Generator 3000 running on http://localhost:${PORT}`,
    port: PORT,
    env: process.env.NODE_ENV || 'development'
  });
});

export { app, logger };
