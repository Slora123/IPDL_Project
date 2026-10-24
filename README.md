# Trackify: AI-Powered Multilingual Finance Tracker 🚀

Trackify is a next-generation financial management platform designed for shopkeepers, micro-businesses, and individual users in multilingual environments. Built with AI-first workflows, Trackify enables hands-free voice accounting, intelligent bill and receipt OCR scanning, real-time dashboard analytics, and seamless instant localization in English, Hindi (हिन्दी), and Marathi (मराठी).

---

## 🌟 Key Features

### 🎙️ AI Multilingual Voice Transactions
- Record transactions by speaking naturally in **English**, **Hindi**, or **Marathi**.
- Integrated with **Sarvam AI** for high-accuracy speech-to-text and translation.
- Configured with **Google Gemini Flash** for financial intent classification:
  - Accurately classifies money spent vs. money received (income vs. expense).
  - Automatically extracts positive amounts, item descriptions, and categories.
  - Interactive confirmation modal allowing quick review and edits before saving.

### 🧾 AI Bill & Receipt Scanner (OCR)
- Upload or capture receipts using camera or file picker (JPEG, PNG, WebP).
- Powered by **Gemini Vision AI** to extract:
  - Vendor name, invoice/receipt number, itemized line items, quantities, prices, subtotal, and tax.
- **Three Clear Actions**:
  - **Discard**: Dismiss the scan without recording.
  - **Add as Expense**: Record the purchase under business or personal expense categories (e.g., Shopping, Inventory, Utilities).
  - **Add as Income**: Record customer sales / revenue (money in).
- **Smart Date Handling**: Defaults to today's transaction date for instant appearance on Dashboard and Spending, while retaining the historical receipt date.
- Automatically redirects to the corresponding tab (`Expenses` or `Income`) upon saving.

### 🌍 Zero-Latency Complete Localization
- Instant switching between **English**, **हिन्दी (Hindi)**, and **मराठी (Marathi)** without page reloads.
- 100% UI coverage: Navigation sidebar, header, dashboards, charts, dialogs, forms, notifications, error states, and tooltips.
- Strictly preserves user-entered transaction descriptions and customer notes in their original script.
- Persistent language preferences saved locally and accessible across sessions.

### 📊 Real-Time Financial Dashboard & Spending Analytics
- **Live Metrics**: Today's Income, Today's Expenses, Net Profit, and Total Transactions.
- **Dynamic Trend Indicators**: Real percentage change calculated against yesterday's figures.
- **Interactive Visualizations**:
  - Income vs. Expense weekly bar charts.
  - Daily profit trend line charts.
  - Category breakdown pie charts with dynamic localized category labels.
- **Top Spending Categories**: Ranked breakdown with color badges and localized category names.

### 📑 Comprehensive Transactions Explorer
- **Dedicated Tabs**:
  - `All`: Chronological grouping by day (Today, Yesterday, and past dates).
  - `Today`: Transactions recorded for the current day.
  - `Income`: All revenue and sales records.
  - `Expenses`: All expense transactions.
  - `Bills`: Dedicated tab for all scanned receipts with bill badges.
  - `Voice`: Voice-recorded transactions with audio transcript badges.
- **Advanced Filters**: Real-time text search, transaction type (All/Income/Expense), category dropdown, and custom start/end date ranges.
- **Inline Editing & Deletion**: Edit transaction details or delete with instant live synchronization.

### 💼 Persona Modes & Smart Tools
- **Business vs. Personal**: Switch personas to toggle net profit cards and commercial metrics.
- **Loan Repayment Alerts**: Track due dates, lenders, and repayment reminders.
- **Growth Insights & Financial Tips**: AI-driven cash flow recommendations tailored for micro-merchants.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with `@vitejs/plugin-react-swc`
- **Styling**: Tailwind CSS & Shadcn UI (Radix UI primitives)
- **Routing**: React Router DOM v6
- **Data Fetching**: Axios with centralized request interceptors & TanStack Query
- **Charts**: Recharts
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js (`>=22.5.0` with `--experimental-sqlite`)
- **Framework**: Express.js
- **Database Layer**: SQLite via `@libsql/client` (Turso cloud database in production or local SQLite in development/testing)
- **Authentication**: JWT & bcryptjs password hashing
- **File Handling**: Multer for receipt image uploads
- **AI Integrations**:
  - **Google Gemini API** (`gemini-3.8-flash` / `gemini-1.5-flash` / Gemini Vision)
  - **Sarvam AI API** (Speech-to-text transcription and translation)

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v22.5.0 or higher
- **npm**: v9+
- Optional API Keys:
  - `GEMINI_API_KEY`: Required for bill OCR and voice transaction parsing.
  - `SARVAM_API_KEY`: Required for speech-to-text and translation.
  - `TURSO_DATABASE_URL` & `TURSO_AUTH_TOKEN`: Optional for remote Turso cloud database (falls back to local SQLite if omitted).

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Slora123/IPDL_Project.git
   cd TRACKIFY
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:

   Create a `.env` file in the project root:
   ```env
   # Server Configuration
   PORT=3001
   ALLOWED_ORIGIN=*

   # Authentication
   JWT_SECRET=your_super_secret_jwt_key_here

   # AI Service API Keys
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-3.8-flash
   SARVAM_API_KEY=your_sarvam_api_key_here

   # Database (Leave empty to use built-in local SQLite)
   TURSO_DATABASE_URL=
   TURSO_AUTH_TOKEN=

   # Client API URL (Leave blank in dev for Vite proxy to http://localhost:3001)
   VITE_API_URL=
   ```

4. **Start Development Environment**:
   ```bash
   npm run dev
   ```
   This runs both the Vite client (`http://localhost:8080` or `5173`) and the Express backend (`http://localhost:3001`) concurrently.

---

## 🧪 Testing & Verification

- **Linting**:
  ```bash
  npm run lint
  ```
- **Production Build Check**:
  ```bash
  npm run build
  ```
- **Automated Bill Flow Test**:
  ```bash
  npm run test:bill-flow
  ```

---

## 📂 Project Architecture

```text
TRACKIFY/
├── src/
│   ├── components/            # Reusable UI components
│   │   ├── charts/            # Recharts components (Category, IncomeExpense, ProfitLoss)
│   │   ├── ui/                # Shadcn UI primitives (Button, Card, Dialog, Tabs, etc.)
│   │   ├── Dashboard.tsx      # Main dashboard with live summary & charts
│   │   ├── LanguageSelector.tsx # Header dropdown for English, हिन्दी, मराठी
│   │   ├── ManualTransactionDialog.tsx # Manual add modal
│   │   ├── EditTransactionDialog.tsx   # Edit transaction modal
│   │   └── VoiceButton.tsx    # Audio recording & AI voice processing widget
│   ├── contexts/              # Global state providers
│   │   ├── AuthContext.tsx    # User session, JWT tokens, and login/logout
│   │   ├── I18nContext.tsx    # Comprehensive dictionary for en, hi, mr
│   │   └── PreferencesContext.tsx # Currency, language, and persona preferences
│   ├── pages/                 # Route views
│   │   ├── Analytics.tsx      # Financial analytics and performance insights
│   │   ├── AuthPage.tsx       # Sign in & Registration
│   │   ├── GrowthInsights.tsx # Profit & revenue growth metrics
│   │   ├── LoanAlert.tsx      # Loan repayment manager
│   │   ├── Reports.tsx        # Financial report generator & PDF export
│   │   ├── ScanBill.tsx       # Bill/receipt OCR scanning workflow
│   │   ├── Settings.tsx       # Profile, preferences, and security settings
│   │   ├── Spending.tsx       # Expense category breakdown and trends
│   │   ├── Transactions.tsx   # Transaction history with tab filters
│   │   └── Trending.tsx       # Trending products & margin calculator
│   └── server/                # Express backend
│       ├── routes/            # REST API endpoints
│       │   ├── analytics.js   # Weekly, spending, and growth analytics
│       │   ├── auth.js        # Register, login, and profile routes
│       │   ├── bills.js       # OCR scan and bill confirmation endpoints
│       │   ├── transactions.js# Transaction CRUD
│       │   └── voice.js       # Sarvam + Gemini voice transaction pipeline
│       ├── services/
│       │   ├── db.js          # Database client, schemas, and analytical queries
│       │   ├── gemini.js      # Gemini NLP intent classification
│       │   ├── ocr.js         # Gemini Vision multimodal receipt extraction
│       │   └── sarvam.js      # Sarvam audio transcription & translation
│       └── index.js           # Server entry point & CORS configuration
├── scripts/                   # Integration tests
│   └── test-bill-flow.mjs     # End-to-end multi-account bill scanning test
└── vite.config.ts             # Vite configuration with API proxying
```

---

## 📡 API Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create a new user account |
| `POST` | `/api/auth/login` | Authenticate and receive JWT token |
| `GET` | `/api/stats` | Retrieve today's income, expenses, profit, and trends |
| `GET` | `/api/transactions` | Fetch all user transactions |
| `POST` | `/api/transactions` | Create a manual transaction |
| `PUT` | `/api/transactions/:id` | Update an existing transaction |
| `DELETE` | `/api/transactions/:id` | Delete a transaction |
| `POST` | `/api/voice/process` | Transcribe, translate, and parse voice transaction |
| `POST` | `/api/bills/scan` | Analyze bill/receipt image with Gemini Vision |
| `POST` | `/api/bills/confirm` | Save scanned bill as an expense transaction |
| `POST` | `/api/bills/confirm-sale` | Save scanned bill as a customer sale/income |
| `GET` | `/api/analytics/spending` | Category expense distribution |
| `GET` | `/api/analytics/weekly-stats` | 7-day profit and loss stats |
| `GET` | `/api/analytics/growth` | Revenue growth and profit margins |

---

## 📄 License

This project is developed for academic and practical financial tracking applications. All rights reserved.
