import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';

class MockApiKeyError extends Error {
  code: string;
  constructor(message: string, code: string = 'API_KEY_REQUIRED') {
    super(message);
    this.name = 'ApiKeyError';
    this.code = code;
  }
}

vi.mock('../services/memeService.js', () => {
  class ApiKeyError extends Error {
    code: string;
    constructor(message: string, code: string = 'API_KEY_REQUIRED') {
      super(message);
      this.name = 'ApiKeyError';
      this.code = code;
    }
  }
  
  return {
    generateAIMeme: vi.fn(),
    generateTemplateMeme: vi.fn(),
    getTemplates: vi.fn(() => [
      { id: 'drake', name: 'Drake Approves', description: 'Drake meme', url: 'https://example.com/drake.jpg', textAreas: [] }
    ]),
    ApiKeyError
  };
});

import memeRoutes, { clearRateLimits } from './meme.js';
import { generateAIMeme, generateTemplateMeme, getTemplates } from '../services/memeService.js';

describe('Meme Routes', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/meme', memeRoutes);

  beforeEach(() => {
    vi.clearAllMocks();
    clearRateLimits();
  });

  describe('GET /api/meme/templates', () => {
    it('should return list of templates', async () => {
      const response = await request(app).get('/api/meme/templates');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(getTemplates).toHaveBeenCalled();
    });
  });

  describe('POST /api/meme/generate', () => {
    it('should return 400 if topic is missing', async () => {
      const response = await request(app)
        .post('/api/meme/generate')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Topic is required');
    });

    it('should return 400 if topic is not a string', async () => {
      const response = await request(app)
        .post('/api/meme/generate')
        .send({ topic: 123 });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Topic is required');
    });

    it('should return 400 if topic exceeds 500 characters', async () => {
      const longTopic = 'a'.repeat(501);
      const response = await request(app)
        .post('/api/meme/generate')
        .send({ topic: longTopic });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Topic must be under 500 characters');
    });

    it('should accept valid topic and call generateAIMeme', async () => {
      const mockMeme = {
        imageUrl: 'https://example.com/meme.jpg',
        topText: 'Top',
        bottomText: 'Bottom',
        style: 'general',
        type: 'ai-generated'
      };
      vi.mocked(generateAIMeme).mockResolvedValue(mockMeme);

      const response = await request(app)
        .post('/api/meme/generate')
        .send({ topic: 'testing' });
      
      expect(response.status).toBe(200);
      expect(generateAIMeme).toHaveBeenCalledWith('testing', 'general', undefined, undefined);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('imageUrl', 'https://example.com/meme.jpg');
      expect(response.body).toHaveProperty('createdAt');
    });

    it('should pass style parameter to generateAIMeme', async () => {
      const mockMeme = {
        imageUrl: 'https://example.com/meme.jpg',
        topText: 'Top',
        bottomText: 'Bottom',
        style: 'security',
        type: 'ai-generated'
      };
      vi.mocked(generateAIMeme).mockResolvedValue(mockMeme);

      const response = await request(app)
        .post('/api/meme/generate')
        .send({ topic: 'CVEs', style: 'security' });
      
      expect(response.status).toBe(200);
      expect(generateAIMeme).toHaveBeenCalledWith('CVEs', 'security', undefined, undefined);
    });

    it('should pass separate text and image API keys to generateAIMeme', async () => {
      const mockMeme = {
        imageUrl: 'https://example.com/meme.jpg',
        topText: 'Top',
        bottomText: 'Bottom',
        style: 'general',
        type: 'ai-generated'
      };
      vi.mocked(generateAIMeme).mockResolvedValue(mockMeme);

      const response = await request(app)
        .post('/api/meme/generate')
        .set('X-OpenAI-Text-API-Key', 'sk-text-key-123')
        .set('X-OpenAI-Image-API-Key', 'sk-image-key-456')
        .send({ topic: 'testing' });
      
      expect(response.status).toBe(200);
      expect(generateAIMeme).toHaveBeenCalledWith('testing', 'general', 'sk-text-key-123', 'sk-image-key-456');
    });

    it('should pass only text API key when image key not provided', async () => {
      const mockMeme = {
        imageUrl: 'https://example.com/meme.jpg',
        topText: 'Top',
        bottomText: 'Bottom',
        style: 'general',
        type: 'ai-generated'
      };
      vi.mocked(generateAIMeme).mockResolvedValue(mockMeme);

      const response = await request(app)
        .post('/api/meme/generate')
        .set('X-OpenAI-Text-API-Key', 'sk-text-key-123')
        .send({ topic: 'testing' });
      
      expect(response.status).toBe(200);
      expect(generateAIMeme).toHaveBeenCalledWith('testing', 'general', 'sk-text-key-123', undefined);
    });

    it('should pass only image API key when text key not provided', async () => {
      const mockMeme = {
        imageUrl: 'https://example.com/meme.jpg',
        topText: 'Top',
        bottomText: 'Bottom',
        style: 'general',
        type: 'ai-generated'
      };
      vi.mocked(generateAIMeme).mockResolvedValue(mockMeme);

      const response = await request(app)
        .post('/api/meme/generate')
        .set('X-OpenAI-Image-API-Key', 'sk-image-key-456')
        .send({ topic: 'testing' });
      
      expect(response.status).toBe(200);
      expect(generateAIMeme).toHaveBeenCalledWith('testing', 'general', undefined, 'sk-image-key-456');
    });

    it('should return 401 with TEXT_API_KEY_REQUIRED code when text API key is missing', async () => {
      vi.mocked(generateAIMeme).mockRejectedValue(new MockApiKeyError('Text API key required', 'TEXT_API_KEY_REQUIRED'));

      const response = await request(app)
        .post('/api/meme/generate')
        .send({ topic: 'test' });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code', 'TEXT_API_KEY_REQUIRED');
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 with IMAGE_API_KEY_REQUIRED code when image API key is missing', async () => {
      vi.mocked(generateAIMeme).mockRejectedValue(new MockApiKeyError('Image API key required', 'IMAGE_API_KEY_REQUIRED'));

      const response = await request(app)
        .post('/api/meme/generate')
        .set('X-OpenAI-Text-API-Key', 'sk-text-key-123')
        .send({ topic: 'test' });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code', 'IMAGE_API_KEY_REQUIRED');
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 with API_KEY_INVALID code for invalid API key', async () => {
      const invalidKeyError = new Error('Invalid API key') as any;
      invalidKeyError.status = 401;
      vi.mocked(generateAIMeme).mockRejectedValue(invalidKeyError);

      const response = await request(app)
        .post('/api/meme/generate')
        .set('X-OpenAI-API-Key', 'sk-invalid-key')
        .send({ topic: 'test' });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code', 'API_KEY_INVALID');
    });

    it('should return 500 on service error', async () => {
      vi.mocked(generateAIMeme).mockRejectedValue(new Error('OpenAI error'));

      const response = await request(app)
        .post('/api/meme/generate')
        .send({ topic: 'test' });
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/meme/template', () => {
    it('should return 400 if template is missing', async () => {
      const response = await request(app)
        .post('/api/meme/template')
        .send({ topic: 'test' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Template and topic are required');
    });

    it('should return 400 if topic is missing', async () => {
      const response = await request(app)
        .post('/api/meme/template')
        .send({ template: 'drake' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Template and topic are required');
    });

    it('should accept valid template and topic', async () => {
      const mockMeme = {
        templateId: 'drake',
        templateUrl: 'https://example.com/drake.jpg',
        templateName: 'Drake Approves',
        captions: { 'Bad thing': 'Old code', 'Good thing': 'New code' },
        type: 'template'
      };
      vi.mocked(generateTemplateMeme).mockResolvedValue(mockMeme);

      const response = await request(app)
        .post('/api/meme/template')
        .send({ template: 'drake', topic: 'refactoring' });
      
      expect(response.status).toBe(200);
      // Template memes only use text API key (no image generation)
      expect(generateTemplateMeme).toHaveBeenCalledWith('drake', 'refactoring', 'general', undefined);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('templateId', 'drake');
      expect(response.body).toHaveProperty('createdAt');
    });

    it('should pass style parameter to generateTemplateMeme', async () => {
      const mockMeme = {
        templateId: 'drake',
        templateUrl: 'https://example.com/drake.jpg',
        templateName: 'Drake Approves',
        captions: { 'Bad thing': 'Old code', 'Good thing': 'New code' },
        type: 'template'
      };
      vi.mocked(generateTemplateMeme).mockResolvedValue(mockMeme);

      const response = await request(app)
        .post('/api/meme/template')
        .send({ template: 'drake', topic: 'CVEs', style: 'security' });
      
      expect(response.status).toBe(200);
      expect(generateTemplateMeme).toHaveBeenCalledWith('drake', 'CVEs', 'security', undefined);
    });

    it('should pass text API key to generateTemplateMeme (template memes only need text)', async () => {
      const mockMeme = {
        templateId: 'drake',
        templateUrl: 'https://example.com/drake.jpg',
        templateName: 'Drake Approves',
        captions: { 'Bad thing': 'Old code', 'Good thing': 'New code' },
        type: 'template'
      };
      vi.mocked(generateTemplateMeme).mockResolvedValue(mockMeme);

      const response = await request(app)
        .post('/api/meme/template')
        .set('X-OpenAI-Text-API-Key', 'sk-text-key-456')
        .send({ template: 'drake', topic: 'testing' });
      
      expect(response.status).toBe(200);
      // Template memes only use text API key for caption generation
      expect(generateTemplateMeme).toHaveBeenCalledWith('drake', 'testing', 'general', 'sk-text-key-456');
    });

    it('should ignore image API key for template memes (not needed)', async () => {
      const mockMeme = {
        templateId: 'drake',
        templateUrl: 'https://example.com/drake.jpg',
        templateName: 'Drake Approves',
        captions: { 'Bad thing': 'Old code', 'Good thing': 'New code' },
        type: 'template'
      };
      vi.mocked(generateTemplateMeme).mockResolvedValue(mockMeme);

      const response = await request(app)
        .post('/api/meme/template')
        .set('X-OpenAI-Text-API-Key', 'sk-text-key-456')
        .set('X-OpenAI-Image-API-Key', 'sk-image-key-789')
        .send({ template: 'drake', topic: 'testing' });
      
      expect(response.status).toBe(200);
      // Image key should be ignored for template memes
      expect(generateTemplateMeme).toHaveBeenCalledWith('drake', 'testing', 'general', 'sk-text-key-456');
    });

    it('should return 401 with TEXT_API_KEY_REQUIRED code when text API key is missing', async () => {
      vi.mocked(generateTemplateMeme).mockRejectedValue(new MockApiKeyError('Text API key required', 'TEXT_API_KEY_REQUIRED'));

      const response = await request(app)
        .post('/api/meme/template')
        .send({ template: 'drake', topic: 'test' });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code', 'TEXT_API_KEY_REQUIRED');
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 with API_KEY_INVALID code for invalid API key', async () => {
      const invalidKeyError = new Error('Invalid API key') as any;
      invalidKeyError.status = 401;
      vi.mocked(generateTemplateMeme).mockRejectedValue(invalidKeyError);

      const response = await request(app)
        .post('/api/meme/template')
        .set('X-OpenAI-Text-API-Key', 'sk-invalid-key')
        .send({ template: 'drake', topic: 'test' });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code', 'API_KEY_INVALID');
    });

    it('should return 500 on service error', async () => {
      vi.mocked(generateTemplateMeme).mockRejectedValue(new Error('Unknown template'));

      const response = await request(app)
        .post('/api/meme/template')
        .send({ template: 'invalid', topic: 'test' });
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Failed to generate template meme');
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 when rate limit exceeded', async () => {
      vi.mocked(generateAIMeme).mockResolvedValue({
        imageUrl: 'https://example.com/meme.jpg',
        topText: 'Top',
        bottomText: 'Bottom',
        style: 'general',
        type: 'ai-generated'
      });

      // Make 10 requests to hit the rate limit
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/meme/generate')
          .send({ topic: 'test' });
      }

      // 11th request should be rate limited
      const response = await request(app)
        .post('/api/meme/generate')
        .send({ topic: 'test' });
      
      expect(response.status).toBe(429);
      expect(response.body).toHaveProperty('error', 'Rate limit exceeded. Try again in a minute.');
    });
  });

  describe('Security - API Key Handling', () => {
    it('should not expose API keys in error responses', async () => {
      const invalidKeyError = new Error('Invalid API key') as any;
      invalidKeyError.status = 401;
      vi.mocked(generateAIMeme).mockRejectedValue(invalidKeyError);

      const response = await request(app)
        .post('/api/meme/generate')
        .set('X-OpenAI-Text-API-Key', 'sk-secret-key-should-not-appear')
        .set('X-OpenAI-Image-API-Key', 'sk-another-secret-key')
        .send({ topic: 'test' });
      
      expect(response.status).toBe(401);
      // Ensure API keys are not leaked in error response
      expect(JSON.stringify(response.body)).not.toContain('sk-secret-key-should-not-appear');
      expect(JSON.stringify(response.body)).not.toContain('sk-another-secret-key');
    });

    it('should not include internal error details in 500 responses', async () => {
      vi.mocked(generateAIMeme).mockRejectedValue(new Error('Internal OpenAI error with sensitive details'));

      const response = await request(app)
        .post('/api/meme/generate')
        .send({ topic: 'test' });
      
      expect(response.status).toBe(500);
      // Should return generic error, not internal details
      expect(response.body.error).toBe('Failed to generate meme. Please try again.');
      expect(JSON.stringify(response.body)).not.toContain('Internal OpenAI error');
    });

    it('should require separate keys and not fall back between text and image keys', async () => {
      const mockMeme = {
        imageUrl: 'https://example.com/meme.jpg',
        topText: 'Top',
        bottomText: 'Bottom',
        style: 'general',
        type: 'ai-generated'
      };
      vi.mocked(generateAIMeme).mockResolvedValue(mockMeme);

      // Only provide text key - image key should be undefined, not fall back to text key
      const response = await request(app)
        .post('/api/meme/generate')
        .set('X-OpenAI-Text-API-Key', 'sk-text-only')
        .send({ topic: 'testing' });
      
      expect(response.status).toBe(200);
      // Verify keys are passed separately without fallback
      expect(generateAIMeme).toHaveBeenCalledWith('testing', 'general', 'sk-text-only', undefined);
    });
  });

  describe('Security - Input Validation', () => {
    it('should reject empty topic', async () => {
      const response = await request(app)
        .post('/api/meme/generate')
        .send({ topic: '' });
      
      expect(response.status).toBe(400);
    });

    it('should reject topic with only whitespace', async () => {
      const response = await request(app)
        .post('/api/meme/generate')
        .send({ topic: '   ' });
      
      // Empty string after trim would still be a string, but validation should handle this
      expect(response.status).toBe(400);
    });

    it('should handle special characters in topic safely', async () => {
      const mockMeme = {
        imageUrl: 'https://example.com/meme.jpg',
        topText: 'Top',
        bottomText: 'Bottom',
        style: 'general',
        type: 'ai-generated'
      };
      vi.mocked(generateAIMeme).mockResolvedValue(mockMeme);

      // Test with potentially dangerous characters
      const response = await request(app)
        .post('/api/meme/generate')
        .send({ topic: '<script>alert("xss")</script>' });
      
      expect(response.status).toBe(200);
      // The topic is passed to OpenAI, not rendered - but verify it's handled
      expect(generateAIMeme).toHaveBeenCalledWith(
        '<script>alert("xss")</script>',
        'general',
        undefined,
        undefined
      );
    });

    it('should enforce maximum topic length of 500 characters', async () => {
      const longTopic = 'a'.repeat(501);
      const response = await request(app)
        .post('/api/meme/generate')
        .send({ topic: longTopic });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Topic must be under 500 characters');
    });

    it('should accept topic at exactly 500 characters', async () => {
      const mockMeme = {
        imageUrl: 'https://example.com/meme.jpg',
        topText: 'Top',
        bottomText: 'Bottom',
        style: 'general',
        type: 'ai-generated'
      };
      vi.mocked(generateAIMeme).mockResolvedValue(mockMeme);

      const exactTopic = 'a'.repeat(500);
      const response = await request(app)
        .post('/api/meme/generate')
        .send({ topic: exactTopic });
      
      expect(response.status).toBe(200);
    });
  });
});
