import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from './config.js';
import { logger } from './logger.js';
import healthRoutes from './routes/health.js';
import scanRoutes from './routes/scan.js';
import configRoutes from './routes/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
    }, 'Request completed');
  });
  next();
});

// Routes
app.use('/', healthRoutes);
app.use('/', scanRoutes);
app.use('/', configRoutes);

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  const clientPath = join(__dirname, '../client');
  app.use(express.static(clientPath));
  
  app.get('*', (req, res) => {
    res.sendFile(join(clientPath, 'index.html'));
  });
}

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  logger.error({ err, path: req.path }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
const server = app.listen(config.port, () => {
  logger.info({ port: config.port }, 'Server started');
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
