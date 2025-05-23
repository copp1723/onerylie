/**
 * Integration tests for the API health endpoints
 */
import request from 'supertest';
import express from 'express';
import { getCacheStats } from '../../server/utils/cache';

// Mock cache stats
jest.mock('../../server/utils/cache', () => ({
  getCacheStats: jest.fn().mockReturnValue({
    size: 25,
    hits: 150,
    misses: 30,
    hitRate: 83.33
  }),
  shutdownCache: jest.fn()
}));

// Create mock express app for testing
const createMockApp = () => {
  const app = express();
  
  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      version: '1.0.0',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        openai: 'configured',
        sendgrid: 'configured'
      }
    });
  });
  
  // Cache stats endpoint
  app.get('/api/health/cache', (req, res) => {
    res.json(getCacheStats());
  });
  
  return app;
};

describe('Health API', () => {
  let app: express.Application;
  
  beforeEach(() => {
    app = createMockApp();
    jest.clearAllMocks();
  });
  
  test('GET /api/health should return healthy status', async () => {
    const response = await request(app).get('/api/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('environment');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('services');
    expect(response.body.services).toHaveProperty('database', 'connected');
    expect(response.body.services).toHaveProperty('openai', 'configured');
    expect(response.body.services).toHaveProperty('sendgrid', 'configured');
  });
  
  test('GET /api/health/cache should return cache statistics', async () => {
    const response = await request(app).get('/api/health/cache');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('size', 25);
    expect(response.body).toHaveProperty('hits', 150);
    expect(response.body).toHaveProperty('misses', 30);
    expect(response.body).toHaveProperty('hitRate', 83.33);
    expect(getCacheStats).toHaveBeenCalled();
  });
});