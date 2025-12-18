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

export function clearRateLimits(): void {
  rateLimits.clear();
}

// Generate AI meme (DALL-E + GPT-4)
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const ip = req.ip || 'unknown';
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ error: 'Rate limit exceeded. Try again in a minute.' });
    }

    const { topic, style = 'general' } = req.body;
    // Separate keys for text and image - NO fallback between them
    const textApiKey = req.headers['x-openai-text-api-key'] as string | undefined;
    const imageApiKey = req.headers['x-openai-image-api-key'] as string | undefined;
    
    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'Topic is required' });
    }

    // Trim and validate - reject empty or whitespace-only topics
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      return res.status(400).json({ error: 'Topic is required' });
    }
    
    if (trimmedTopic.length > 500) {
      return res.status(400).json({ error: 'Topic must be under 500 characters' });
    }

    const meme = await generateAIMeme(topic, style, textApiKey, imageApiKey);
    
    res.json({
      id: uuidv4(),
      ...meme,
      createdAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Meme generation error:', error?.message || error);
    
    // Return specific error for missing API key
    if (error?.name === 'ApiKeyError') {
      return res.status(401).json({ 
        error: error.message,
        code: error.code || 'API_KEY_REQUIRED'
      });
    }
    
    // Check for invalid API key errors from OpenAI
    if (error?.status === 401 || error?.code === 'invalid_api_key') {
      return res.status(401).json({
        error: 'Invalid API key. Please check your OpenAI API key and try again.',
        code: 'API_KEY_INVALID'
      });
    }
    
    // Generic error for client - don't expose internal details
    res.status(500).json({ error: 'Failed to generate meme. Please try again.' });
  }
});

// Generate template meme (classic format + GPT-4 caption)
router.post('/template', async (req: Request, res: Response) => {
  try {
    const ip = req.ip || 'unknown';
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ error: 'Rate limit exceeded. Try again in a minute.' });
    }

    const { template, topic, style = 'general' } = req.body;
    // Text key only - NO fallback
    const textApiKey = req.headers['x-openai-text-api-key'] as string | undefined;
    
    if (!template || !topic) {
      return res.status(400).json({ error: 'Template and topic are required' });
    }

    const meme = await generateTemplateMeme(template, topic, style, textApiKey);
    
    res.json({
      id: uuidv4(),
      ...meme,
      createdAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Template meme error:', error);
    
    // Return specific error for missing API key
    if (error?.name === 'ApiKeyError') {
      return res.status(401).json({ 
        error: error.message,
        code: error.code || 'API_KEY_REQUIRED'
      });
    }
    
    // Check for invalid API key errors from OpenAI
    if (error?.status === 401 || error?.code === 'invalid_api_key') {
      return res.status(401).json({
        error: 'Invalid API key. Please check your OpenAI API key and try again.',
        code: 'API_KEY_INVALID'
      });
    }
    
    res.status(500).json({ error: 'Failed to generate template meme' });
  }
});

// List available templates
router.get('/templates', (req: Request, res: Response) => {
  res.json(getTemplates());
});

// Proxy external images to avoid CORS issues for download
router.get('/proxy-image', async (req: Request, res: Response) => {
  try {
    const { url } = req.query;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Only allow proxying from known safe domains
    const allowedDomains = [
      'oaidalleapiprodscus.blob.core.windows.net',
      'i.imgflip.com'
    ];
    
    const urlObj = new URL(url);
    // Use exact match or proper suffix matching to prevent SSRF bypass
    const isAllowed = allowedDomains.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
    );
    if (!isAllowed) {
      return res.status(403).json({ error: 'Domain not allowed' });
    }

    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch image' });
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Image proxy error:', error);
    res.status(500).json({ error: 'Failed to proxy image' });
  }
});

export default router;
