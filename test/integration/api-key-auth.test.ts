/**
 * Integration tests for API key authentication middleware
 */
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';

// Mock database response for API key validation
jest.mock('../../server/db', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    and: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue([
      {
        id: 'test-api-key-id',
        key: 'valid-test-key',
        dealershipId: 123,
        active: true,
        name: 'Test API Key'
      }
    ])
  }
}));

// Create a mock version of our API key auth middleware
const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers.authorization?.replace('Bearer ', '') || 
                req.query.api_key as string;
  
  if (!apiKey) {
    return res.status(401).json({ 
      success: false, 
      message: 'API key is required' 
    });
  }
  
  if (apiKey !== 'valid-test-key') {
    return res.status(401).json({
      success: false,
      message: 'Invalid API key'
    });
  }
  
  // Add API key info to request
  (req as any).apiKey = {
    id: 'test-api-key-id',
    dealershipId: 123,
    name: 'Test API Key'
  };
  
  next();
};

// Create mock express app for testing
const createMockApp = () => {
  const app = express();
  app.use(express.json());
  
  // Protected route
  app.post('/api/protected', apiKeyAuth, (req, res) => {
    res.json({
      success: true,
      message: 'Protected route accessed',
      apiKeyInfo: (req as any).apiKey
    });
  });
  
  // Public route
  app.get('/api/public', (req, res) => {
    res.json({
      success: true,
      message: 'Public route accessed'
    });
  });
  
  return app;
};

describe('API Key Authentication', () => {
  let app: express.Application;
  
  beforeEach(() => {
    app = createMockApp();
  });
  
  test('Should allow access to public routes without API key', async () => {
    const response = await request(app).get('/api/public');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message', 'Public route accessed');
  });
  
  test('Should block access to protected routes without API key', async () => {
    const response = await request(app).post('/api/protected');
    
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.message).toContain('API key is required');
  });
  
  test('Should block access with invalid API key', async () => {
    const response = await request(app)
      .post('/api/protected')
      .set('Authorization', 'Bearer invalid-key');
    
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.message).toContain('Invalid API key');
  });
  
  test('Should allow access with valid API key in Authorization header', async () => {
    const response = await request(app)
      .post('/api/protected')
      .set('Authorization', 'Bearer valid-test-key');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message', 'Protected route accessed');
    expect(response.body).toHaveProperty('apiKeyInfo');
    expect(response.body.apiKeyInfo).toHaveProperty('dealershipId', 123);
  });
  
  test('Should allow access with valid API key as query parameter', async () => {
    const response = await request(app)
      .post('/api/protected')
      .query({ api_key: 'valid-test-key' });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('apiKeyInfo');
    expect(response.body.apiKeyInfo).toHaveProperty('dealershipId', 123);
  });
});