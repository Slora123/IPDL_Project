import axios from 'axios';

const today = new Date();
const todayStr = today.toISOString().split('T')[0];
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayStr = yesterday.toISOString().split('T')[0];
const twoDaysAgo = new Date(today);
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

const mockTransactions = [
  { id: '1', date: todayStr, time: '09:30 AM', item: 'Restock: Milk & Bread', amount: 1250.00, type: 'expense', category: 'Inventory', language: 'english' },
  { id: '2', date: todayStr, time: '11:15 AM', item: 'Customer Sale (UPI)', amount: 560.00, type: 'income', category: 'Sales', language: 'english', voiceInput: 'Received 560 for groceries' },
  { id: '3', date: yesterdayStr, time: '02:45 PM', item: 'Electricity Bill', amount: 850.00, type: 'expense', category: 'Utilities', language: 'english' },
  { id: '4', date: yesterdayStr, time: '04:20 PM', item: 'Shop Assistant Salary', amount: 3000.00, type: 'expense', category: 'Salary', language: 'english' },
  { id: '5', date: twoDaysAgoStr, time: '10:00 AM', item: 'Wholesale Vegetables', amount: 1500.00, type: 'expense', category: 'Inventory', language: 'hindi', voiceInput: 'Sabji ke liye 1500 diye' },
  { id: '6', date: todayStr, time: '07:30 PM', item: 'Evening Sales (Cash)', amount: 2450.00, type: 'income', category: 'Sales', language: 'marathi', voiceInput: 'S संध्याकाळी 2450 ची विक्री झाली' },
];

const mockStats = {
  income: 14500,
  expenses: 6600,
  profit: 7900,
  transactions: 24,
  recentTransactions: mockTransactions
};

const mockWeeklyStats = [
  { name: 'Mon', income: 1800, expense: 800, profit: 1000 },
  { name: 'Tue', income: 2100, expense: 1200, profit: 900 },
  { name: 'Wed', income: 1900, expense: 600, profit: 1300 },
  { name: 'Thu', income: 2300, expense: 1500, profit: 800 },
  { name: 'Fri', income: 2500, expense: 1000, profit: 1500 },
  { name: 'Sat', income: 3200, expense: 800, profit: 2400 },
  { name: 'Sun', income: 3800, expense: 1200, profit: 2600 },
];

const mockSpending = {
  topCategories: [
    { name: 'Inventory', amount: 4500.00, percentage: 55, color: '#f87171', growth: '+12%' },
    { name: 'Salary', amount: 3000.00, percentage: 25, color: '#60a5fa', growth: '0%' },
    { name: 'Utilities', amount: 850.00, percentage: 10, color: '#facc15', growth: '+5%' },
    { name: 'Transport', amount: 450.00, percentage: 7, color: '#4ade80', growth: '-2%' },
    { name: 'Maintenance', amount: 200.00, percentage: 3, color: '#c084fc', growth: '+1%' },
  ]
};

const mockGrowth = {
  revenueGrowth: "+12.5%",
  expenseRatio: "15%",
  profitMargin: "45%",
  customerRetention: "92%"
};

const mockLoans = [
  { id: '1', name: 'Shop Expansion Loan', amount: 150000, emiAmount: 5500, dueDate: '2026-10-01', status: 'active' },
  { id: '2', name: 'New Deep Freezer EMI', amount: 35000, emiAmount: 2200, dueDate: '2026-09-20', status: 'active' },
];

// Real Express backend (server/) now handles all /api/* calls via Vite proxy.
// This mock is disabled. setupMockApi is kept as a no-op so existing imports don't break.
export const setupMockApi = () => {
  console.log('[MockAPI] DISABLED — real backend is active on port 3001');
  // no monkey-patching; all axios calls go through the Vite proxy → Express
};

// Dead-code reference below (kept for documentation only):
const _disabledMock = () => {
  const originalGet = axios.get;
  
  // @ts-ignore
  axios.get = async (url, config) => {
    console.log(`[Mock API] GET ${url}`);
    
    if (url.includes('/api/stats') || url.includes('/api/dashboard/stats')) {
      return { data: mockStats, status: 200 };
    }
    if (url.includes('/api/analytics/weekly-stats')) {
      return { data: mockWeeklyStats, status: 200 };
    }
    if (url.includes('/api/analytics/spending')) {
      return { data: mockSpending, status: 200 };
    }
    if (url.includes('/api/analytics/growth')) {
      return { data: mockGrowth, status: 200 };
    }
    if (url.includes('/api/transactions')) {
      return { data: mockTransactions, status: 200 };
    }
    if (url.includes('/api/loans')) {
      return { data: mockLoans, status: 200 };
    }
    if (url.includes('/api/user/profile')) {
      return { data: { businessName: 'Super Grocery Mart', name: 'Ramesh Patel', email: 'ramesh@example.com' }, status: 200 };
    }

    return originalGet(url, config);
  };

  const originalPost = axios.post;
  // @ts-ignore
  axios.post = async (url, data, config) => {
    console.log(`[Mock API] POST ${url}`, data);
    
    // Mock reports
    if (url.includes('/api/reports/generate/today-summary')) {
      return { 
        data: {
          reportName: "Today's Summary",
          date: todayStr,
          totalTransactions: 15,
          totalIncome: 14500.50,
          totalExpenses: 6600.00,
          netProfit: 7900.50,
          transactions: [
            { item: 'Restock: Milk & Bread', amount: 1250.00, type: 'expense', category: 'Inventory', time: '09:30 AM' },
            { item: 'Customer Sale (UPI)', amount: 560.00, type: 'income', category: 'Sales', time: '11:15 AM' }
          ]
        }, 
        status: 200 
      };
    }
    
    if (url.includes('/api/reports/generate/weekly-pl')) {
      return { 
        data: {
          reportName: "Weekly P&L",
          period: "Last 7 Days",
          totalIncome: 13000,
          totalExpenses: 7900,
          netProfit: 5100,
          dailyBreakdown: mockWeeklyStats
        }, 
        status: 200 
      };
    }
    
    if (url.includes('/api/reports/generate/category-breakdown')) {
      return { 
        data: {
          reportName: "Category Breakdown",
          period: "Current Month",
          categories: [
            { category: 'Inventory', totalIncome: 0, totalExpenses: 4500.00, netAmount: -4500.00, transactionCount: 15 },
            { category: 'Sales', totalIncome: 14500.00, totalExpenses: 0, netAmount: 14500.00, transactionCount: 120 },
            { category: 'Utilities', totalIncome: 0, totalExpenses: 850.00, netAmount: -850.00, transactionCount: 2 },
            { category: 'Salary', totalIncome: 0, totalExpenses: 3000.00, netAmount: -3000.00, transactionCount: 1 }
          ],
          totalCategories: 4
        }, 
        status: 200 
      };
    }
    
    if (url.includes('/api/reports/generate/voice-accuracy')) {
      return { 
        data: {
          reportName: "Voice Accuracy Report",
          totalVoiceTransactions: 3,
          languageBreakdown: [
            { language: 'english', count: 1, percentage: '33.3' },
            { language: 'hindi', count: 1, percentage: '33.3' },
            { language: 'marathi', count: 1, percentage: '33.3' }
          ],
          averageConfidence: "94.0%",
          mostUsedLanguage: "english"
        }, 
        status: 200 
      };
    }

    return { data: { success: true, message: "Mock POST successful" }, status: 200 };
  };

  const originalPut = axios.put;
  // @ts-ignore
  axios.put = async (url, data, config) => {
    console.log(`[Mock API] PUT ${url}`, data);
    return { data: { success: true, message: "Mock PUT successful" }, status: 200 };
  };

  const originalDelete = axios.delete;
  // @ts-ignore
  axios.delete = async (url, config) => {
    console.log(`[Mock API] DELETE ${url}`);
    return { data: { success: true, message: "Mock DELETE successful" }, status: 200 };
  };
};
