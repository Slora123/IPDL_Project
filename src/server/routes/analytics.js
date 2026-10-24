// src/server/routes/analytics.js
// All analytics endpoints require authentication and are filtered by userId.

import { Router } from 'express';
import { requireAuth } from './auth.js';
import { getSummary, getWeeklyStats, getCategorySpending, getGrowthMetrics } from '../services/db.js';

const router = Router();

// Apply auth to every analytics route
router.use(requireAuth);

// GET /api/analytics/weekly-stats
router.get('/weekly-stats', async (req, res) => {
  try {
    const clientDate = req.query.date || req.headers['x-client-date'];
    res.json(await getWeeklyStats(req.user.id, clientDate));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch weekly stats' });
  }
});

// GET /api/analytics/spending
router.get('/spending', async (req, res) => {
  try {
    res.json(await getCategorySpending(req.user.id));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch spending data' });
  }
});

// GET /api/analytics/growth
router.get('/growth', async (req, res) => {
  try {
    res.json(await getGrowthMetrics(req.user.id));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch growth metrics' });
  }
});

export default router;
