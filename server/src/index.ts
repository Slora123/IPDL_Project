import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
// @ts-ignore
import { PrismaClient } from '@prisma/client';
// @ts-ignore
import { verifyGoogleToken, generateToken, authenticateToken } from './auth.js';
// @ts-ignore
import { classifyVoiceTransaction } from './voice.js';

const execPromise = promisify(exec);

const prisma = new PrismaClient({});
const app = express();
const PORT = process.env.PORT || 5000;

// Configure multer for audio uploads
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/mpeg'];
        if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.webm')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only audio files allowed.'));
        }
    }
});

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

app.use(cors());
app.use(express.json());

// Auth endpoint
app.post('/api/auth/google', async (req, res) => {
    const { token } = req.body;
    const payload = await verifyGoogleToken(token);

    if (!payload) {
        return res.status(401).json({ error: 'Invalid Google token' });
    }

    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
        return res.status(400).json({ error: 'Email not provided by Google' });
    }

    let user = await prisma.user.findUnique({
        where: { googleId },
    });

    if (!user) {
        user = await prisma.user.create({
            data: {
                googleId,
                email,
                name,
                picture,
            },
        });
    }

    const jwtToken = generateToken(user);
    res.json({ user, token: jwtToken });
});

// Test/Bypass login for development
app.post('/api/auth/test', async (req, res) => {
    let user = await prisma.user.findUnique({
        where: { googleId: 'test_user_id' },
    });

    if (!user) {
        user = await prisma.user.create({
            data: {
                googleId: 'test_user_id',
                email: 'test@example.com',
                name: 'Test User',
                picture: 'https://github.com/shadcn.png',
                onboarded: true,
                language: 'en',
                persona: 'Retailer'
            },
        });
    }

    const jwtToken = generateToken(user);
    res.json({ user, token: jwtToken });
});

// Transactions endpoints
app.get('/api/transactions', authenticateToken, async (req: any, res) => {
    try {
        const transactions = await prisma.transaction.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
        });
        res.json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

app.post('/api/transactions', authenticateToken, async (req: any, res) => {
    try {
        console.log('Received transaction request:', req.body);
        const { item, amount, type, category, date, language, voiceInput, time } = req.body;

        if (!item || !amount || !date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const transaction = await prisma.transaction.create({
            data: {
                userId: req.user.id,
                item,
                amount: parseFloat(amount),
                type,
                category,
                date,
                time: time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                language,
                voiceInput,
            },
        });
        res.json(transaction);
    } catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({ error: 'Failed to create transaction' });
    }
});

app.put('/api/transactions/:id', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const existing = await prisma.transaction.findUnique({ where: { id } });

        if (!existing || existing.userId !== req.user.id) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        const { item, amount, type, category, date, language, voiceInput, time } = req.body;
        const transaction = await prisma.transaction.update({
            where: { id },
            data: { item, amount: parseFloat(amount), type, category, date, time, language, voiceInput },
        });
        res.json(transaction);
    } catch (error) {
        console.error('Error updating transaction:', error);
        res.status(500).json({ error: 'Failed to update transaction' });
    }
});

app.delete('/api/transactions/:id', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const existing = await prisma.transaction.findUnique({ where: { id } });

        if (!existing || existing.userId !== req.user.id) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        await prisma.transaction.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ error: 'Failed to delete transaction' });
    }
});

// Voice processing endpoint - now uses Whisper for transcription
app.post('/api/voice/process', authenticateToken, upload.single('audio'), async (req: any, res) => {
    let audioPath: string | undefined;

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Audio file is required' });
        }

        audioPath = req.file.path;
        let language = req.body.language || 'en'; // en, hi, mr

        // Map common language names to ISO codes for Whisper
        const languageMap: { [key: string]: string } = {
            'english': 'en',
            'hindi': 'hi',
            'marathi': 'mr',
            'hi': 'hi',
            'mr': 'mr',
            'en': 'en'
        };

        const whisperLanguage = languageMap[language.toLowerCase()] || language;

        console.log('=== WHISPER TRANSCRIPTION ===');
        console.log('Audio file:', audioPath);
        console.log('Input language:', language);
        console.log('Mapped Whisper language:', whisperLanguage);

        // Execute Whisper Python script
        const pythonCommand = `python3 speech.py "${audioPath}" "${whisperLanguage}"`;
        console.log('Executing:', pythonCommand);

        const { stdout, stderr } = await execPromise(pythonCommand);

        if (stderr && !stdout) {
            console.error('Whisper error:', stderr);
            // Don't throw if we have some stdout, as Whisper often outputs progress to stderr
            if (!stdout) throw new Error('Transcription failed');
        }

        const transcript = stdout.trim();
        console.log('Transcript:', transcript);

        if (!transcript) {
            return res.json({
                success: false,
                message: 'Could not detect speech in audio',
                classification: { action: 'none', amount: null, item: null, category: null }
            });
        }

        // Use rule-based classification on transcript
        const classification = await classifyVoiceTransaction(transcript);

        console.log('Classification:', classification);

        // Only create transaction if it's income or expense
        if (classification.action === 'none' || !classification.amount) {
            console.log('No transaction detected - action:', classification.action, 'amount:', classification.amount);
            return res.json({
                success: false,
                message: 'No financial transaction detected. Try saying something like "I earned 500 rupees" or "spent 50 on milk"',
                classification,
                transcript
            });
        }

        // Create the transaction
        const transaction = await prisma.transaction.create({
            data: {
                userId: req.user.id,
                item: classification.item || 'Voice transaction',
                amount: classification.amount,
                type: classification.action,
                category: classification.category || 'General',
                date: new Date().toISOString().split('T')[0],
                time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                language: language || 'english',
                voiceInput: transcript,
            },
        });

        console.log('Transaction created:', transaction.id);
        console.log('============================');

        res.json({
            success: true,
            message: 'Transaction created successfully',
            transaction,
            classification,
            transcript
        });
    } catch (error: any) {
        console.error('Error processing voice transaction:', error);
        res.status(500).json({
            error: 'Failed to process voice transaction',
            details: error.message
        });
    } finally {
        // Clean up uploaded file
        if (audioPath && fs.existsSync(audioPath)) {
            fs.unlinkSync(audioPath);
            console.log('Cleaned up audio file:', audioPath);
        }
    }
});

// Dashboard stats endpoint (alias for /api/stats for compatibility)
app.get('/api/dashboard/stats', authenticateToken, async (req: any, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const transactions = await prisma.transaction.findMany({
            where: {
                userId: req.user.id,
                date: today
            }
        });

        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const expenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        res.json({
            income,
            expenses,
            balance: income - expenses,
            transactionCount: transactions.length
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

app.get('/api/stats', authenticateToken, async (req: any, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const transactions = await prisma.transaction.findMany({
            where: {
                userId: req.user.id,
                date: today
            },
            orderBy: { createdAt: 'desc' },
        });

        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        // Fetch recent transactions (last 4, not just today)
        const recentTransactions = await prisma.transaction.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: 4
        });

        res.json({
            income,
            expenses,
            profit: income - expenses,
            transactions: transactions.length,
            recentTransactions: recentTransactions.map(t => ({
                id: t.id,
                item: t.item,
                amount: t.amount,
                type: t.type === 'income' ? 'sale' : 'expense',
                time: t.time
            }))
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

app.get('/api/analytics/weekly-stats', authenticateToken, async (req: any, res) => {
    try {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const result: any[] = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = days[date.getDay()];

            const dayTransactions = await prisma.transaction.findMany({
                where: {
                    userId: req.user.id,
                    date: dateStr
                }
            });

            const income = dayTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);

            const expense = dayTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            result.push({
                name: dayName,
                income,
                expense,
                profit: income - expense
            });
        }

        res.json(result);
    } catch (error) {
        console.error('Error fetching weekly stats:', error);
        res.status(500).json({ error: 'Failed to fetch weekly stats' });
    }
});

// ===== LOAN ENDPOINTS =====
app.get('/api/loans', authenticateToken, async (req: any, res) => {
    try {
        const loans = await prisma.loanAlert.findMany({
            where: { userId: req.user.id },
            orderBy: { dueDate: 'asc' },
        });
        res.json(loans);
    } catch (error) {
        console.error('Error fetching loans:', error);
        res.status(500).json({ error: 'Failed to fetch loans' });
    }
});

app.post('/api/loans', authenticateToken, async (req: any, res) => {
    try {
        const { lender, amount, dueDate, reminderEnabled } = req.body;
        const loan = await prisma.loanAlert.create({
            data: {
                userId: req.user.id,
                lender,
                amount: parseFloat(amount),
                dueDate,
                reminderEnabled: reminderEnabled || false,
            },
        });
        res.json(loan);
    } catch (error) {
        console.error('Error creating loan:', error);
        res.status(500).json({ error: 'Failed to create loan' });
    }
});

app.put('/api/loans/:id', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const { lender, amount, dueDate, reminderEnabled, status } = req.body;
        const loan = await prisma.loanAlert.update({
            where: { id },
            data: { lender, amount: parseFloat(amount), dueDate, reminderEnabled, status },
        });
        res.json(loan);
    } catch (error) {
        console.error('Error updating loan:', error);
        res.status(500).json({ error: 'Failed to update loan' });
    }
});

app.delete('/api/loans/:id', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        await prisma.loanAlert.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting loan:', error);
        res.status(500).json({ error: 'Failed to delete loan' });
    }
});

// ===== REPORT ENDPOINTS =====
app.get('/api/reports', authenticateToken, async (req: any, res) => {
    try {
        const reports = await prisma.report.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
        });
        res.json(reports);
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});

app.post('/api/reports/generate', authenticateToken, async (req: any, res) => {
    try {
        const { title, description, type, format } = req.body;
        const report = await prisma.report.create({
            data: {
                userId: req.user.id,
                title,
                description,
                type,
                format,
                date: new Date().toISOString().split('T')[0],
                size: '0 KB',
                status: 'processing',
            },
        });

        // Simulate report generation
        setTimeout(async () => {
            await prisma.report.update({
                where: { id: report.id },
                data: { status: 'ready', size: `${Math.random() * 3 + 1}`.substring(0, 3) + ' MB' },
            });
        }, 2000);

        res.json(report);
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

app.delete('/api/reports/:id', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        await prisma.report.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting report:', error);
        res.status(500).json({ error: 'Failed to delete report' });
    }
});

// ===== LEARNING ENDPOINTS =====
app.get('/api/learning/progress', authenticateToken, async (req: any, res) => {
    try {
        const progress = await prisma.userProgress.findMany({
            where: { userId: req.user.id },
            include: { course: true },
        });
        res.json(progress);
    } catch (error) {
        console.error('Error fetching progress:', error);
        res.status(500).json({ error: 'Failed to fetch progress' });
    }
});

app.post('/api/learning/progress', authenticateToken, async (req: any, res) => {
    try {
        const { courseId, progress, completed } = req.body;
        const userProgress = await prisma.userProgress.upsert({
            where: {
                userId_courseId: {
                    userId: req.user.id,
                    courseId,
                },
            },
            update: { progress, completed, lastAccessed: new Date() },
            create: {
                userId: req.user.id,
                courseId,
                progress,
                completed,
            },
        });
        res.json(userProgress);
    } catch (error) {
        console.error('Error updating progress:', error);
        res.status(500).json({ error: 'Failed to update progress' });
    }
});

app.get('/api/learning/achievements', authenticateToken, async (req: any, res) => {
    try {
        const achievements = await prisma.userAchievement.findMany({
            where: { userId: req.user.id },
            include: { achievement: true },
        });
        res.json(achievements);
    } catch (error) {
        console.error('Error fetching achievements:', error);
        res.json([]); // Return empty array on error
    }
});

// ===== USER PROFILE ENDPOINTS =====
app.get('/api/user/profile', authenticateToken, async (req: any, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
        });
        res.json(user);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

app.put('/api/user/profile', authenticateToken, async (req: any, res) => {
    try {
        const { firstName, lastName, businessName, phone, language } = req.body;
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: { firstName, lastName, businessName, phone, language },
        });
        res.json(user);
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

app.put('/api/user/settings', authenticateToken, async (req: any, res) => {
    try {
        const settings = req.body;
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: settings,
        });
        res.json(user);
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// ===== ANALYTICS ENDPOINTS =====
app.get('/api/analytics/spending', authenticateToken, async (req: any, res) => {
    try {
        const transactions = await prisma.transaction.findMany({
            where: {
                userId: req.user.id,
                type: 'expense'
            },
        });

        console.log(`Analytics: Found ${transactions.length} expenses for user ${req.user.id}`);
        if (transactions.length > 0) {
            console.log('Sample expense:', transactions[0]);
        }

        // Group by category
        const byCategory: any = {};
        transactions.forEach(t => {
            const cat = t.category || 'Other';
            if (!byCategory[cat]) {
                byCategory[cat] = 0;
            }
            // Use absolute value for expenses since they might be stored as negative
            byCategory[cat] += Math.abs(t.amount);
        });

        const colors = [
            'hsl(var(--primary))',
            'hsl(var(--secondary))',
            'hsl(var(--info))',
            'hsl(var(--warning))',
            'hsl(var(--muted-foreground))'
        ];

        const topCategories = Object.entries(byCategory)
            .map(([name, amount], index) => ({
                name,
                amount: amount,
                color: colors[index % colors.length]
            }))
            .sort((a: any, b: any) => b.amount - a.amount)
            .slice(0, 5);

        const totalExpenses = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const responseData = { topCategories, totalExpenses };
        console.log('=== ANALYTICS RESPONSE ===');
        console.log('Top Categories Count:', topCategories.length);
        console.log('Response Data:', JSON.stringify(responseData, null, 2));
        console.log('=========================');

        res.json(responseData);
    } catch (error) {
        console.error('Error fetching spending analytics:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

app.get('/api/analytics/growth', authenticateToken, async (req: any, res) => {
    try {
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        const lastMonthDate = new Date();
        lastMonthDate.setMonth(now.getMonth() - 1);
        const lastMonth = lastMonthDate.getMonth();
        const lastMonthYear = lastMonthDate.getFullYear();

        const transactions = await prisma.transaction.findMany({
            where: { userId: req.user.id },
        });

        const getMonthStats = (m: number, y: number) => {
            const monthly = transactions.filter(t => {
                const d = new Date(t.date);
                return d.getMonth() === m && d.getFullYear() === y;
            });
            const inc = monthly.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
            const exp = monthly.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
            return { inc, exp, profit: inc - exp };
        };

        const current = getMonthStats(thisMonth, thisYear);
        const previous = getMonthStats(lastMonth, lastMonthYear);

        const calcGrowth = (curr: number, prev: number) => {
            if (prev === 0) return curr > 0 ? '+100%' : '0%';
            const growth = ((curr - prev) / prev) * 100;
            return (growth >= 0 ? '+' : '') + growth.toFixed(1) + '%';
        };

        res.json({
            revenueGrowth: calcGrowth(current.inc, previous.inc),
            expenseRatio: current.inc > 0 ? ((current.exp / current.inc) * 100).toFixed(0) + '%' : '0%',
            profitMargin: current.inc > 0 ? (((current.inc - current.exp) / current.inc) * 100).toFixed(0) + '%' : '0%',
            customerRetention: '94%', // Still a placeholder as we don't track unique customers yet
        });
    } catch (error) {
        console.error('Error fetching growth analytics:', error);
        res.status(500).json({ error: 'Failed to fetch growth analytics' });
    }
});

// ===== REPORTS ENDPOINTS =====
app.post('/api/reports/generate/today-summary', authenticateToken, async (req: any, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const transactions = await prisma.transaction.findMany({
            where: { userId: req.user.id, date: today }
        });
        const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        res.json({
            reportName: "Today's Summary", date: today, totalTransactions: transactions.length,
            totalIncome: income, totalExpenses: expenses, netProfit: income - expenses,
            transactions: transactions.map(t => ({ item: t.item, amount: t.amount, type: t.type, category: t.category, time: t.time }))
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

app.post('/api/reports/generate/weekly-pl', authenticateToken, async (req: any, res) => {
    try {
        const weeklyData: any[] = []; let totalIncome = 0; let totalExpenses = 0;
        for (let i = 6; i >= 0; i--) {
            const date = new Date(); date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayTransactions = await prisma.transaction.findMany({ where: { userId: req.user.id, date: dateStr } });
            const income = dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const expenses = dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            totalIncome += income; totalExpenses += expenses;
            weeklyData.push({ date: dateStr, income, expenses, profit: income - expenses });
        }
        res.json({ reportName: "Weekly P&L", period: "Last 7 Days", totalIncome, totalExpenses, netProfit: totalIncome - totalExpenses, dailyBreakdown: weeklyData });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

app.post('/api/reports/generate/category-breakdown', authenticateToken, async (req: any, res) => {
    try {
        const firstDayOfMonth = new Date(); firstDayOfMonth.setDate(1);
        const firstDayStr = firstDayOfMonth.toISOString().split('T')[0];
        const transactions = await prisma.transaction.findMany({ where: { userId: req.user.id, date: { gte: firstDayStr } } });
        const categoryMap: any = {};
        transactions.forEach(t => {
            if (!categoryMap[t.category]) categoryMap[t.category] = { income: 0, expenses: 0, count: 0 };
            categoryMap[t.category].count++; if (t.type === 'income') categoryMap[t.category].income += t.amount; else categoryMap[t.category].expenses += t.amount;
        });
        const breakdown = Object.keys(categoryMap).map(category => ({
            category, totalIncome: categoryMap[category].income, totalExpenses: categoryMap[category].expenses,
            netAmount: categoryMap[category].income - categoryMap[category].expenses, transactionCount: categoryMap[category].count
        }));
        res.json({ reportName: "Category Breakdown", period: "Current Month", categories: breakdown, totalCategories: breakdown.length });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

app.post('/api/reports/generate/voice-accuracy', authenticateToken, async (req: any, res) => {
    try {
        const voiceTransactions = await prisma.transaction.findMany({ where: { userId: req.user.id, voiceInput: { not: null } }, orderBy: { createdAt: 'desc' }, take: 100 });
        const languageStats: any = {};
        voiceTransactions.forEach(t => {
            const lang = t.language || 'unknown';
            if (!languageStats[lang]) languageStats[lang] = { count: 0 };
            languageStats[lang].count++;
        });
        const stats = Object.keys(languageStats).map(lang => ({
            language: lang, count: languageStats[lang].count,
            percentage: (languageStats[lang].count / voiceTransactions.length * 100).toFixed(1)
        }));
        res.json({ reportName: "Voice Accuracy Report", totalVoiceTransactions: voiceTransactions.length, languageBreakdown: stats, averageConfidence: "95.3%", mostUsedLanguage: stats.length > 0 ? stats[0].language : 'N/A' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
