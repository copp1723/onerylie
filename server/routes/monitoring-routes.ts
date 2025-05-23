
import express from 'express';
import { monitoring } from '../services/monitoring';

const router = express.Router();

router.get('/metrics', (req, res) => {
  const metrics = monitoring.getMetrics();
  res.json(metrics);
});

router.use((req, res, next) => {
  const start = performance.now();
  res.on('finish', () => {
    const duration = performance.now() - start;
    monitoring.trackRequest(req.path, duration, res.statusCode);
  });
  next();
});

export default router;
