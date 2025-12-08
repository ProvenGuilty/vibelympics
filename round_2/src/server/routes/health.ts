import { Router } from 'express';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/ready', (req, res) => {
  res.json({ ready: true, timestamp: new Date().toISOString() });
});

export default router;
