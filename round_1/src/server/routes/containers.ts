import { Router, Request, Response } from 'express';
import { mockContainers, Container } from '../data/containers.js';
import { createLogger } from '../logger.js';

const logger = createLogger('containers-api');
const router = Router();

// Get all containers
router.get('/', (_req: Request, res: Response) => {
  logger.debug({ count: mockContainers.length }, 'Fetching all containers');
  res.json(mockContainers);
});

// Get container by ID
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Input validation
  if (!id || typeof id !== 'string' || id.length > 50) {
    logger.warn({ id }, 'Invalid container ID requested');
    return res.status(400).json({ error: '❌🔤' });
  }
  
  const container = mockContainers.find((c: Container) => c.id === id);
  
  if (!container) {
    logger.info({ id }, 'Container not found');
    return res.status(404).json({ error: '❓📦' });
  }
  
  logger.debug({ id, name: container.name }, 'Container found');
  res.json(container);
});

// Get containers by severity filter
router.get('/filter/:severity', (req: Request, res: Response) => {
  const { severity } = req.params;
  const validSeverities = ['critical', 'high', 'medium', 'low', 'none'];
  
  if (!validSeverities.includes(severity.toLowerCase())) {
    logger.warn({ severity }, 'Invalid severity filter');
    return res.status(400).json({ error: '❌🎚️' });
  }
  
  const filtered = mockContainers.filter(
    (c: Container) => c.maxSeverity.toLowerCase() === severity.toLowerCase()
  );
  
  logger.debug({ severity, count: filtered.length }, 'Filtered containers by severity');
  res.json(filtered);
});

// Get summary statistics
router.get('/stats/summary', (_req: Request, res: Response) => {
  const stats = {
    total: mockContainers.length,
    signed: mockContainers.filter((c: Container) => c.signed).length,
    unsigned: mockContainers.filter((c: Container) => !c.signed).length,
    bySeverity: {
      critical: mockContainers.filter((c: Container) => c.maxSeverity === 'critical').length,
      high: mockContainers.filter((c: Container) => c.maxSeverity === 'high').length,
      medium: mockContainers.filter((c: Container) => c.maxSeverity === 'medium').length,
      low: mockContainers.filter((c: Container) => c.maxSeverity === 'low').length,
      none: mockContainers.filter((c: Container) => c.maxSeverity === 'none').length,
    },
    averageRating: (
      mockContainers.reduce((sum: number, c: Container) => sum + c.rating, 0) / mockContainers.length
    ).toFixed(1),
  };
  
  logger.debug({ stats }, 'Generated summary statistics');
  res.json(stats);
});

export { router as containersRouter };
