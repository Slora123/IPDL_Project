// src/server/routes/analytics.js
// All analytics endpoints require authentication and are filtered by userId.

import { Router } from 'express';
import { requireAuth } from './auth.js';
import { getSummary, getWeeklyStats, getCategorySpending, getGrowthMetrics } from '../services/db.js';

const router = Router();

// Apply auth to every analytics route
router.use(requireAuth);

// GET /api/analytics/weekly-stats
router.get('/weekly-stats', (req, res) => {
  res.json(getWeeklyStats(req.user.id));
});

// GET /api/analytics/spending
router.get('/spending', (req, res) => {
  res.json(getCategorySpending(req.user.id));
});

// GET /api/analytics/growth
router.get('/growth', (req, res) => {
  res.json(getGrowthMetrics(req.user.id));
});

export default router;
