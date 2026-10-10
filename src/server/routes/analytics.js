// server/src/routes/analytics.js
import { Router } from 'express';
import { getSummary, getWeeklyStats, getCategorySpending, getGrowthMetrics } from '../services/db.js';

const router = Router();

// GET /api/stats  — dashboard summary
router.get('/stats', (req, res) => {
  res.json(getSummary());
});

// GET /api/analytics/weekly-stats
router.get('/weekly-stats', (req, res) => {
  res.json(getWeeklyStats());
});

// GET /api/analytics/spending
router.get('/spending', (req, res) => {
  res.json(getCategorySpending());
});

// GET /api/analytics/growth
router.get('/growth', (req, res) => {
  res.json(getGrowthMetrics());
});

export default router;
