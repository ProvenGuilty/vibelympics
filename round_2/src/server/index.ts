import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import https from 'https';
import http from 'http';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from './config.js';
import { logger } from './logger.js';
import healthRoutes from './routes/health.js';
import scanRoutes from './routes/scan.js';
import configRoutes from './routes/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// HTTPS configuration
const HTTPS_PORT = parseInt(process.env.HTTPS_PORT || '8443', 10);
const ENABLE_HTTPS = process.env.ENABLE_HTTPS === 'true' || process.env.NODE_ENV === 'production';

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

// Configure CORS with allowed origins (restrict in production)
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:5173',
  'http://localhost:8080',
  'https://localhost:8443',
];
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? allowedOrigins : true,
  credentials: true,
}));
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

// Track servers for graceful shutdown
let httpServer: http.Server;
let httpsServer: https.Server | null = null;

// Start server(s)
const startServer = () => {
  if (ENABLE_HTTPS) {
    // HTTP server redirects to HTTPS
    const redirectApp = express();
    redirectApp.use((req, res) => {
      const httpsUrl = `https://${req.hostname}:${HTTPS_PORT}${req.url}`;
      logger.info({ from: req.url, to: httpsUrl }, 'Redirecting HTTP to HTTPS');
      res.redirect(301, httpsUrl);
    });

    httpServer = http.createServer(redirectApp);
    httpServer.listen(config.port, () => {
      logger.info({
        port: config.port,
        protocol: 'http',
        redirectsTo: HTTPS_PORT,
      }, `HTTP server redirecting to HTTPS on port ${HTTPS_PORT}`);
    });

    // Load certificates
    const certsPath = join(__dirname, '../../certs');
    const keyPath = join(certsPath, 'server.key');
    const certPath = join(certsPath, 'server.crt');

    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      const httpsOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      };

      httpsServer = https.createServer(httpsOptions, app);
      httpsServer.listen(HTTPS_PORT, () => {
        logger.info({
          port: HTTPS_PORT,
          protocol: 'https',
          env: process.env.NODE_ENV,
        }, `🔒 HTTPS server running on https://localhost:${HTTPS_PORT}`);
      });
    } else {
      logger.warn({ certsPath }, 'HTTPS enabled but certificates not found, falling back to HTTP only');
      httpServer = http.createServer(app);
      httpServer.listen(config.port, () => {
        logger.info({ port: config.port }, 'Server started (HTTP only - no certs found)');
      });
    }
  } else {
    // HTTP only mode
    httpServer = http.createServer(app);
    httpServer.listen(config.port, () => {
      logger.info({ port: config.port }, 'Server started');
    });
  }
};

startServer();

// Graceful shutdown
const shutdown = (signal: string) => {
  logger.info({ signal }, 'Shutdown signal received');
  
  const closeServers = () => {
    httpServer?.close(() => {
      logger.info('HTTP server closed');
    });
    httpsServer?.close(() => {
      logger.info('HTTPS server closed');
    });
    
    setTimeout(() => {
      logger.info('Server shutdown complete');
      process.exit(0);
    }, 1000);
  };
  
  closeServers();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
