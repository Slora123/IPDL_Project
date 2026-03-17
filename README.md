# Trackify: AI-Powered Financial Freedom 🚀

DevFusion is a next-generation financial management application designed to empower users—especially business owners and individuals in multilingual environments—with AI-driven insights, voice-activated transactions, and personalized educational content.

## 🌟 Key Features

- **🎙️ AI Voice Input**: Add transactions effortlessly using natural language voice commands.
- **🌍 Multilingual Support**: Fully localized interface supporting English, Hindi, and Marathi.
- **📊 Advanced Analytics**: Visual insights into income, expenses, profit trends, and category breakdowns.
- **💼 Persona-Based Experience**: Tailored dashboards for both "Personal" and "Business" users.
- **🛡️ Secure Authentication**: Integrated with Google OAuth for a seamless and secure login experience.
- **📚 Learn & Grow**: Built-in educational modules to improve financial literacy and business growth.
- **🔔 Smart Alerts**: Never miss a loan repayment with automated reminders.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **State Management**: TanStack Query (React Query)
- **Styling**: Tailwind CSS & Shadcn UI
- **Routing**: React Router DOM v6
- **Charts**: Recharts
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js (via `tsx`)
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT & Google Auth Library
- **File Handling**: Multer (for uploads)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL database
- Google Cloud Project (for OAuth)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd DevFusion
   ```

2. **Install dependencies**:
   ```bash
   # Install root and client dependencies
   npm install

   # Install server dependencies
   cd server
   npm install
   cd ..
   ```

3. **Configure Environment Variables**:

   **Root `.env` (Client)**:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   VITE_API_URL=http://localhost:5000
   ```

   **Server `.env`**:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/devfusion_db"
   GOOGLE_CLIENT_ID="your_google_client_id"
   JWT_SECRET="your_very_secret_key"
   PORT=5000
   ```

4. **Initialize Database**:
   ```bash
   cd server
   npx prisma migrate dev
   npx prisma db seed # If a seed script exists
   cd ..
   ```

5. **Run the Application**:
   ```bash
   npm run dev
   ```
   This will concurrently start both the Vite development server and the Express backend.

## 📂 Project Structure

```text
├── server/             # Express backend
│   ├── prisma/        # Database schema and migrations
│   ├── src/           # API routes, controllers, and logic
│   └── uploads/       # Temporary storage for uploads
├── src/                # React frontend
│   ├── components/    # Reusable UI components
│   ├── contexts/      # Context providers (Auth, Theme, I18n)
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utility functions
│   └── pages/         # Application views/routes
└── public/             # Static assets
```

