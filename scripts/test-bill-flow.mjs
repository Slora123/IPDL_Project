// Isolated bill-flow integration check: two accounts, mocked OCR, temporary SQLite DB.
// Run with `npm run test:bill-flow`; it never reads or writes the developer DB.
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const tempDir = await mkdtemp(path.join(os.tmpdir(), 'trackify-bill-flow-'));
process.env.DB_PATH = path.join(tempDir, 'test.db');
process.env.JWT_SECRET = 'isolated-bill-flow-test-secret';
process.env.GEMINI_API_KEY = 'mocked-test-key';

const originalFetch = globalThis.fetch;
const ocrResponse = {
  isBill: true,
  confidence: 0.99,
  transaction: {
    vendorName: 'Test Vendor',
    date: '2026-10-20',
    invoiceNumber: 'SHARED-INVOICE-42',
    items: [{ name: 'Test item', quantity: 1, unitPrice: 125, totalPrice: 125 }],
    subtotal: 125,
    tax: 0,
    total: 125,
    currencySymbol: '₹',
  },
};

globalThis.fetch = async (url, options) => {
  if (String(url).includes('generativelanguage.googleapis.com')) {
    return new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: JSON.stringify(ocrResponse) }] } }],
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  return originalFetch(url, options);
};

const [{ default: express }, { default: authRoutes, requireAuth }, { default: billRoutes }, { default: transactionRoutes }] = await Promise.all([
  import('express'),
  import('../src/server/routes/auth.js'),
  import('../src/server/routes/bills.js'),
  import('../src/server/routes/transactions.js'),
]);
const { default: db } = await import('../src/server/services/db.js');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use('/api/auth', authRoutes);
app.use('/api/bills', requireAuth, billRoutes);
app.use('/api/transactions', transactionRoutes);
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
const baseUrl = `http://127.0.0.1:${server.address().port}`;

async function request(route, { token, ...options } = {}) {
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return originalFetch(`${baseUrl}${route}`, { ...options, headers });
}

try {
  const accounts = [];
  for (const email of ['first@example.test', 'second@example.test']) {
    const response = await request('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: email, email, password: 'secure-test-password' }),
    });
    assert.equal(response.status, 201, `registration failed for ${email}`);
    accounts.push((await response.json()).token);
  }

  const scans = [];
  for (const token of accounts) {
    const form = new FormData();
    form.append('image', new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], { type: 'image/jpeg' }), 'bill.jpg');
    const response = await request('/api/bills/scan', { method: 'POST', token, body: form });
    assert.equal(response.status, 200, 'authenticated bill upload/scan failed');
    const result = await response.json();
    assert.equal(result.isBill, true);
    scans.push(result);
  }

  const saved = [];
  for (let index = 0; index < accounts.length; index += 1) {
    const response = await request('/api/bills/confirm', {
      method: 'POST',
      token: accounts[index],
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ transaction: scans[index].transaction, imageBase64: scans[index].imageBase64 }),
    });
    assert.equal(response.status, 201, 'bill expense confirmation failed');
    saved.push((await response.json()).transaction);
  }

  assert.notEqual(saved[0].userId, saved[1].userId, 'transactions must have separate owners');
  assert.equal(saved[0].billRef, saved[1].billRef, 'same invoice is permitted for different owners');
  for (let index = 0; index < accounts.length; index += 1) {
    const response = await request('/api/transactions', { token: accounts[index] });
    assert.equal(response.status, 200);
    const transactions = await response.json();
    assert.equal(transactions.length, 1, 'each account should see only its own expense');
    assert.equal(transactions[0].userId, saved[index].userId);
  }

  const crossAccountRead = await request(`/api/transactions/${saved[1].id}`, { token: accounts[0] });
  assert.equal(crossAccountRead.status, 404, 'one account must not read another account’s expense');

  console.log('PASS: two accounts uploaded/scanned bills and saved expenses with isolated ownership.');
} finally {
  globalThis.fetch = originalFetch;
  await new Promise(resolve => server.close(resolve));
  db.close();
  // The test DB is inside a unique OS temp directory; no project or production DB is touched.
  await rm(tempDir, { recursive: true, force: true });
}
