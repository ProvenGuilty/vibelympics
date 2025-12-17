import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { generateAIMeme, generateTemplateMeme, getTemplates } from '../services/memeService.js';

const router = Router();

// Rate limiting (simple in-memory)
const rateLimits = new Map<string, number[]>();
const RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW = 60000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const requests = rateLimits.get(ip) || [];
  const recentRequests = requests.filter(t => now - t < RATE_WINDOW);
  
  if (recentRequests.length >= RATE_LIMIT) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimits.set(ip, recentRequests);
  return true;
}

// Generate AI meme (DALL-E + GPT-4)
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const ip = req.ip || 'unknown';
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ error: 'Rate limit exceeded. Try again in a minute.' });
    }

    const { topic, style = 'general' } = req.body;
    
    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'Topic is required' });
    }
    
    if (topic.length > 500) {
      return res.status(400).json({ error: 'Topic must be under 500 characters' });
    }

    const meme = await generateAIMeme(topic, style);
    
    res.json({
      id: uuidv4(),
      ...meme,
      createdAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Meme generation error:', error?.message || error);
    console.error('Full error:', JSON.stringify(error, null, 2));
    res.status(500).json({ error: error?.message || 'Failed to generate meme' });
  }
});

// Generate template meme (classic format + GPT-4 caption)
router.post('/template', async (req: Request, res: Response) => {
  try {
    const ip = req.ip || 'unknown';
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ error: 'Rate limit exceeded. Try again in a minute.' });
    }

    const { template, topic } = req.body;
    
    if (!template || !topic) {
      return res.status(400).json({ error: 'Template and topic are required' });
    }

    const meme = await generateTemplateMeme(template, topic);
    
    res.json({
      id: uuidv4(),
      ...meme,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Template meme error:', error);
    res.status(500).json({ error: 'Failed to generate template meme' });
  }
});

// List available templates
router.get('/templates', (req: Request, res: Response) => {
  res.json(getTemplates());
});

export default router;
