import express from 'express';
import cors from 'cors';
import pg from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { verifyGoogleToken, generateToken, authenticateToken } from './auth.js';
import 'dotenv/config';

const connectionString = `${process.env.DATABASE_URL}`;

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const app = express();
const PORT = process.env.PORT || 5000;

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

// Transactions endpoints
app.get('/api/transactions', authenticateToken, async (req: any, res) => {
    const transactions = await prisma.transaction.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
    });
    res.json(transactions);
});

app.post('/api/transactions', authenticateToken, async (req: any, res) => {
    const transaction = await prisma.transaction.create({
        data: {
            ...req.body,
            userId: req.user.id,
        },
    });
    res.json(transaction);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
