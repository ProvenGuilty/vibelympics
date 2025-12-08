import { Router } from 'express';
import { config, updateConfig } from '../config.js';
import { logger } from '../logger.js';

const router = Router();

router.get('/api/config', (req, res) => {
  // Don't expose sensitive keys
  const safeConfig = {
    ...config,
    openaiApiKey: config.openaiApiKey ? '***' : undefined,
    anthropicApiKey: config.anthropicApiKey ? '***' : undefined,
    githubToken: config.githubToken ? '***' : undefined,
    githubClientSecret: config.githubClientSecret ? '***' : undefined,
  };
  res.json(safeConfig);
});

router.put('/api/config', (req, res) => {
  try {
    const updates = req.body;
    updateConfig(updates);
    logger.info({ updates }, 'Configuration updated');
    res.json({ success: true });
  } catch (error) {
    logger.error({ error }, 'Failed to update configuration');
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

export default router;
