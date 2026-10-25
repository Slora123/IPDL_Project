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
      id: 'tutorials',
      name: 'Tutorials & Knowledge',
      description: 'Educational modules, tutorials progress, and financial guides',
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

  if (reportId === 'tutorials' || reportId === 'tutorials-report' || reportId === 'voice-accuracy') {
    const tutorialsList = [
      { title: "Small Business Financial Management", category: "Finance", duration: "2h 30m", lessons: 8, status: "Available", level: "Beginner" },
      { title: "Digital Growth for Retailers", category: "Marketing", duration: "3h 45m", lessons: 12, status: "Available", level: "Intermediate" },
      { title: "Finance For Beginners", category: "Tutorial", duration: "8:32", lessons: 1, status: "Available", level: "Beginner" },
      { title: "Reading Your Financial Dashboard", category: "Analytics", duration: "12:15", lessons: 1, status: "Available", level: "All Levels" },
      { title: "Small Business Accounting", category: "Setup", duration: "6:45", lessons: 1, status: "Available", level: "Beginner" },
    ];

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
      reportId: 'tutorials',
      reportName: 'Tutorials & Financial Knowledge Report',
      period: 'All Tutorials & Video Modules',
      date: todayStr,
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      totalTransactions: tutorialsList.length,
      tutorialsList,
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

const handleReportRequest = async (req, res) => {
  try {
    const clientDate = req.query.date || req.headers['x-client-date'];
    const reportId = req.params.id || 'today-summary';
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const report = await buildReport(userId, reportId, clientDate);
    res.json(report);
  } catch (error) {
    console.error('[Reports] Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

// Support multiple routing formats so no URL ever 404s
router.post('/generate/:id', handleReportRequest);
router.get('/generate/:id', handleReportRequest);
router.post('/:id', handleReportRequest);
router.get('/:id', handleReportRequest);

export default router;
