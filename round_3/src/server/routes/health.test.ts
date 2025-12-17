import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import healthRoutes from './health.js';

describe('Health Routes', () => {
  const app = express();
  app.use('/health', healthRoutes);

  describe('GET /health', () => {
    it('should return status ok', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
    });

    it('should return timestamp', async () => {
      const response = await request(app).get('/health');
      
      expect(response.body).toHaveProperty('timestamp');
      expect(new Date(response.body.timestamp).getTime()).not.toBeNaN();
    });

    it('should return service name', async () => {
      const response = await request(app).get('/health');
      
      expect(response.body).toHaveProperty('service', 'meme-generator-3000');
    });

    it('should return JSON content type', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });
});
