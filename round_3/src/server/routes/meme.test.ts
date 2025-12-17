import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../services/memeService.js', () => ({
  generateAIMeme: vi.fn(),
  generateTemplateMeme: vi.fn(),
  getTemplates: vi.fn(() => [
    { id: 'drake', name: 'Drake Approves', description: 'Drake meme', url: 'https://example.com/drake.jpg', textAreas: [] }
  ])
}));

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
      expect(generateAIMeme).toHaveBeenCalledWith('testing', 'general');
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
      expect(generateAIMeme).toHaveBeenCalledWith('CVEs', 'security');
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
      expect(generateTemplateMeme).toHaveBeenCalledWith('drake', 'refactoring', 'general');
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
      expect(generateTemplateMeme).toHaveBeenCalledWith('drake', 'CVEs', 'security');
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
});
