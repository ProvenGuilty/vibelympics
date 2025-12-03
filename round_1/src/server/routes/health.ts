import { Router, Request, Response } from 'express';

export const healthRouter = (startTime: number, isReadyFn: () => boolean) => {
  const router = Router();

  // Liveness probe - is the server running?
  router.get('/health', (_req: Request, res: Response) => {
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    
    res.status(200).json({
      status: '🟢',
      uptime: `${uptime}⏱️`,
      memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}📊`,
    });
  });

  // Readiness probe - is the server ready to accept traffic?
  router.get('/ready', (_req: Request, res: Response) => {
    if (isReadyFn()) {
      res.status(200).json({
        status: '✅',
        ready: '🚀',
      });
    } else {
      res.status(503).json({
        status: '❌',
        ready: '⏳',
      });
    }
  });

  // Metrics endpoint (simplified)
  router.get('/metrics', (_req: Request, res: Response) => {
    const mem = process.memoryUsage();
    
    res.status(200).json({
      heap: `${Math.round(mem.heapUsed / 1024 / 1024)}📈`,
      rss: `${Math.round(mem.rss / 1024 / 1024)}📊`,
      uptime: `${Math.floor(process.uptime())}⏱️`,
    });
  });

  return router;
};
