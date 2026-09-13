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
  { id: '1', date: todayStr, time: '09:30 AM', item: 'Grocery Store', amount: 120.50, type: 'expense', category: 'Food', language: 'english' },
  { id: '2', date: todayStr, time: '11:15 AM', item: 'Client Payment', amount: 5000.00, type: 'income', category: 'Business', language: 'english', voiceInput: 'Received 5000 from client' },
  { id: '3', date: yesterdayStr, time: '02:45 PM', item: 'Office Supplies', amount: 45.00, type: 'expense', category: 'Supplies', language: 'english' },
  { id: '4', date: yesterdayStr, time: '04:20 PM', item: 'Software Subscription', amount: 29.99, type: 'expense', category: 'Software', language: 'english' },
  { id: '5', date: twoDaysAgoStr, time: '10:00 AM', item: 'Consulting Fee', amount: 1500.00, type: 'income', category: 'Services', language: 'hindi', voiceInput: 'Consulting ke 1500 mile' },
  { id: '6', date: todayStr, time: '07:30 PM', item: 'Dinner at Restaurant', amount: 85.00, type: 'expense', category: 'Food', language: 'marathi', voiceInput: 'Hotelmaddhe 85 kharch jhale' },
];

const mockStats = {
  income: 6500,
  expenses: 195.49,
  profit: 6304.51,
  transactions: 5,
  recentTransactions: mockTransactions
};

const mockWeeklyStats = [
  { name: 'Mon', income: 1400, expense: 1000, profit: 400 },
  { name: 'Tue', income: 1500, expense: 1200, profit: 300 },
  { name: 'Wed', income: 800, expense: 900, profit: -100 },
  { name: 'Thu', income: 2000, expense: 1200, profit: 800 },
  { name: 'Fri', income: 2500, expense: 1300, profit: 1200 },
  { name: 'Sat', income: 3000, expense: 1000, profit: 2000 },
  { name: 'Sun', income: 2800, expense: 1300, profit: 1500 },
];

const mockSpending = {
  topCategories: [
    { name: 'Food', amount: 120.50, percentage: 35, color: '#f87171', growth: '-2%' },
    { name: 'Transport', amount: 85.00, percentage: 25, color: '#60a5fa', growth: '+8%' },
    { name: 'Supplies', amount: 45.00, percentage: 15, color: '#facc15', growth: '+5%' },
    { name: 'Software', amount: 29.99, percentage: 15, color: '#4ade80', growth: '+12%' },
    { name: 'Utilities', amount: 25.00, percentage: 10, color: '#c084fc', growth: '+3%' },
  ]
};

const mockGrowth = {
  revenueGrowth: "+12.5%",
  expenseRatio: "15%",
  profitMargin: "45%",
  customerRetention: "92%"
};

const mockLoans = [
  { id: '1', name: 'Business Loan', amount: 50000, emiAmount: 2500, dueDate: '2026-10-01', status: 'active' },
  { id: '2', name: 'Equipment Financing', amount: 15000, emiAmount: 800, dueDate: '2026-09-20', status: 'active' },
];

export const setupMockApi = () => {
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
      return { data: { businessName: 'My Awesome Business', name: 'Guest User', email: 'guest@example.com' }, status: 200 };
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
          totalTransactions: 2,
          totalIncome: 5120.50,
          totalExpenses: 120.50,
          netProfit: 5000.00,
          transactions: [
            { item: 'Grocery Store', amount: 120.50, type: 'expense', category: 'Food', time: '09:30 AM' },
            { item: 'Client Payment', amount: 5000.00, type: 'income', category: 'Business', time: '11:15 AM' }
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
            { category: 'Food', totalIncome: 0, totalExpenses: 120.50, netAmount: -120.50, transactionCount: 1 },
            { category: 'Business', totalIncome: 5000.00, totalExpenses: 0, netAmount: 5000.00, transactionCount: 1 },
            { category: 'Supplies', totalIncome: 0, totalExpenses: 45.00, netAmount: -45.00, transactionCount: 1 },
            { category: 'Software', totalIncome: 0, totalExpenses: 29.99, netAmount: -29.99, transactionCount: 1 }
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
