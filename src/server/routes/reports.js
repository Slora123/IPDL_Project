// src/server/routes/reports.js
// Dedicated backend handler for generating and retrieving business financial reports.

import { Router } from 'express';
import {
  getAllTransactions,
  getSummary,
  getWeeklyStats,
  localDateStr,
} from '../services/db.js';

const router = Router();

// GET /api/reports — List available reports
router.get('/', (_req, res) => {
  res.json([
    {
      id: 'today-summary',
      name: "Today's Summary",
      description: "Quick overview of today's income, expenses, and transactions",
    },
    {
      id: 'weekly-pl',
      name: 'Weekly P&L',
      description: '7-day profit and loss summary with daily breakdown',
    },
    {
      id: 'category-breakdown',
      name: 'Category Breakdown',
      description: 'Current month and all-time category spending & income analysis',
    },
    {
      id: 'voice-accuracy',
      name: 'Voice & Channel Breakdown',
      description: 'Voice recognition usage and language distribution',
    },
  ]);
});

// Helper to generate report payload
async function buildReport(userId, reportId, clientDate) {
  const todayStr = clientDate && /^\d{4}-\d{2}-\d{2}$/.test(clientDate)
    ? clientDate
    : localDateStr();

  const allTxs = await getAllTransactions(userId);

  if (reportId === 'today-summary') {
    const todayTxs = allTxs.filter(t => t.date === todayStr);
    const totalIncome = todayTxs
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalExpenses = todayTxs
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const formattedDate = new Date(todayStr + 'T12:00:00').toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return {
      reportId: 'today-summary',
      reportName: "Today's Financial Summary",
      period: `Today (${formattedDate})`,
      date: todayStr,
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      totalTransactions: todayTxs.length,
      transactions: todayTxs.map(t => ({
        time: t.time || '—',
        item: t.item,
        category: t.category || 'General',
        type: t.type,
        amount: Number(t.amount) || 0,
      })),
    };
  }

  if (reportId === 'weekly-pl' || reportId === 'weekly') {
    const weeklyStats = await getWeeklyStats(userId, clientDate);
    const weekDates = new Set(weeklyStats.map(d => d.date));
    const weekTxs = allTxs.filter(t => weekDates.has(t.date));

    const totalIncome = weeklyStats.reduce((sum, d) => sum + (Number(d.income) || 0), 0);
    const totalExpenses = weeklyStats.reduce((sum, d) => sum + (Number(d.expense) || 0), 0);

    const startDate = weeklyStats[0]?.date || todayStr;
    const endDate = weeklyStats[weeklyStats.length - 1]?.date || todayStr;

    return {
      reportId: 'weekly-pl',
      reportName: 'Weekly Profit & Loss Statement',
      period: `Last 7 Days (${startDate} to ${endDate})`,
      date: todayStr,
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      totalTransactions: weekTxs.length,
      dailyBreakdown: weeklyStats.map(d => ({
        name: d.name,
        date: d.date,
        income: Number(d.income) || 0,
        expense: Number(d.expense) || 0,
        profit: Number(d.profit) || 0,
      })),
    };
  }

  if (reportId === 'category-breakdown' || reportId === 'category' || reportId === 'monthly') {
    const catMap = {};
    let totalIncome = 0;
    let totalExpenses = 0;

    for (const t of allTxs) {
      const cat = t.category || 'General';
      if (!catMap[cat]) {
        catMap[cat] = { category: cat, totalIncome: 0, totalExpenses: 0, netAmount: 0 };
      }
      const amount = Number(t.amount) || 0;
      if (t.type === 'income') {
        catMap[cat].totalIncome += amount;
        totalIncome += amount;
      } else {
        catMap[cat].totalExpenses += amount;
        totalExpenses += amount;
      }
      catMap[cat].netAmount = catMap[cat].totalIncome - catMap[cat].totalExpenses;
    }

    const categories = Object.values(catMap).sort(
      (a, b) => (b.totalIncome + b.totalExpenses) - (a.totalIncome + a.totalExpenses)
    );

    return {
      reportId: 'category-breakdown',
      reportName: 'Category Financial Breakdown',
      period: 'All-Time Category Distribution',
      date: todayStr,
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      totalTransactions: allTxs.length,
      categories,
    };
  }

  if (reportId === 'voice-accuracy') {
    const langMap = {};
    let totalIncome = 0;
    let totalExpenses = 0;

    for (const t of allTxs) {
      const lang = (t.language || 'english').toLowerCase();
      langMap[lang] = (langMap[lang] || 0) + 1;
      const amount = Number(t.amount) || 0;
      if (t.type === 'income') totalIncome += amount;
      else totalExpenses += amount;
    }

    const totalCount = allTxs.length || 1;
    const languageBreakdown = Object.entries(langMap).map(([language, count]) => ({
      language,
      count,
      percentage: Math.round((count / totalCount) * 100),
    }));

    return {
      reportId: 'voice-accuracy',
      reportName: 'Voice & Input Accuracy Report',
      period: 'All-Time Input Breakdown',
      date: todayStr,
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      totalTransactions: allTxs.length,
      languageBreakdown,
    };
  }

  // Fallback for any unknown report ID
  const summary = await getSummary(userId, clientDate);
  return {
    reportId,
    reportName: 'Financial Summary Report',
    period: `As of ${todayStr}`,
    date: todayStr,
    totalIncome: summary.income || 0,
    totalExpenses: summary.expenses || 0,
    netProfit: summary.profit || 0,
    totalTransactions: summary.transactions || 0,
    transactions: (summary.recentTransactions || []).map(t => ({
      time: t.time || '—',
      item: t.item,
      category: t.category || 'General',
      type: t.type,
      amount: Number(t.amount) || 0,
    })),
  };
}

// POST /api/reports/generate/:id
router.post('/generate/:id', async (req, res) => {
  try {
    const clientDate = req.query.date || req.headers['x-client-date'];
    const report = await buildReport(req.user.id, req.params.id, clientDate);
    res.json(report);
  } catch (error) {
    console.error('[Reports] Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// GET /api/reports/generate/:id (compat)
router.get('/generate/:id', async (req, res) => {
  try {
    const clientDate = req.query.date || req.headers['x-client-date'];
    const report = await buildReport(req.user.id, req.params.id, clientDate);
    res.json(report);
  } catch (error) {
    console.error('[Reports] Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

export default router;
