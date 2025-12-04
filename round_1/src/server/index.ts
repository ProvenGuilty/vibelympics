import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';
import { createLogger } from './logger.js';
import { containersRouter } from './routes/containers.js';
import { healthRouter } from './routes/health.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = createLogger('server');
const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const HTTPS_PORT = parseInt(process.env.HTTPS_PORT || '3443', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';
const ENABLE_HTTPS = process.env.ENABLE_HTTPS === 'true' || NODE_ENV === 'production';

// Track server state for health checks
let isReady = false;
const startTime = Date.now();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: NODE_ENV === 'production' ? false : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// Compression
app.use(compression());

// JSON parsing with size limit
app.use(express.json({ limit: '10kb' }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = crypto.randomUUID();
  const startMs = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startMs;
    logger.info({
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: duration,
      userAgent: req.get('user-agent'),
    }, `${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  
  next();
});

// API routes
app.use('/api/containers', containersRouter);
app.use('/', healthRouter(startTime, () => isReady));

// Serve static files in production
if (NODE_ENV === 'production') {
  const clientPath = path.join(__dirname, '../client');
  app.use(express.static(clientPath));
  
  // SPA fallback
  app.get('*', (req: Request, res: Response) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/health') && !req.path.startsWith('/ready')) {
      res.sendFile(path.join(clientPath, 'index.html'));
    }
  });
}

// Error handling middleware
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  }, 'Unhandled error');
  
  res.status(500).json({ error: '🚨' });
});

// Graceful shutdown
const shutdown = (signal: string) => {
  logger.info({ signal }, '🛑 Shutdown signal received');
  isReady = false;
  
  // Give time for load balancers to stop sending traffic
  setTimeout(() => {
    logger.info('👋 Server shutting down');
    process.exit(0);
  }, 5000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server(s)
const startServer = () => {
  // Start HTTPS server in production or when explicitly enabled
  if (ENABLE_HTTPS) {
    // HTTP server redirects to HTTPS
    const redirectApp = express();
    redirectApp.use((req: Request, res: Response) => {
      const httpsUrl = `https://${req.hostname}:${HTTPS_PORT}${req.url}`;
      logger.info({ from: req.url, to: httpsUrl }, '🔀 Redirecting HTTP to HTTPS');
      res.redirect(301, httpsUrl);
    });
    
    const httpServer = http.createServer(redirectApp);
    httpServer.listen(PORT, () => {
      logger.info({
        port: PORT,
        protocol: 'http',
        redirectsTo: HTTPS_PORT,
      }, `🔀 HTTP server redirecting to HTTPS on port ${HTTPS_PORT}`);
    });
    const certsPath = path.join(__dirname, '../../certs');
    const keyPath = path.join(certsPath, 'server.key');
    const certPath = path.join(certsPath, 'server.crt');

    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      const httpsOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      };

      const httpsServer = https.createServer(httpsOptions, app);
      httpsServer.listen(HTTPS_PORT, () => {
        isReady = true;
        logger.info({
          port: HTTPS_PORT,
          protocol: 'https',
          env: NODE_ENV,
        }, `🔒 HTTPS server running on https://localhost:${HTTPS_PORT}`);
      });
    } else {
      logger.warn({ certsPath }, '⚠️ HTTPS enabled but certificates not found, running HTTP only');
      isReady = true;
    }
  } else {
    // No HTTPS - serve app directly on HTTP
    const httpServer = http.createServer(app);
    httpServer.listen(PORT, () => {
      isReady = true;
      logger.info({
        port: PORT,
        protocol: 'http',
        env: NODE_ENV,
        nodeVersion: process.version,
      }, `🐙 Linky's Security Dashboard running on http://localhost:${PORT}`);
    });
  }
};

startServer();

export { app };
