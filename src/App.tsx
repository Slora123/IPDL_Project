import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { PreferencesProvider, usePreferences } from "@/contexts/PreferencesContext";
import { I18nProvider } from "@/contexts/I18nContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { OnboardingDialog } from "@/components/OnboardingDialog";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "./pages/Layout";
import AuthPage from "./pages/AuthPage";
import Index from "./pages/Index";
import Analytics from "./pages/Analytics";
import Transactions from "./pages/Transactions";
import Reports from "./pages/Reports";
import Spending from "./pages/Spending";
import LoanAlert from "./pages/LoanAlert";
import Learn from "./pages/Learn";
import GrowthInsights from "./pages/GrowthInsights";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import ScanBill from "./pages/ScanBill";
import Trending from "./pages/Trending";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Helper: wraps a page in Layout + ProtectedRoute
function Protected({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

const AppContent = () => {
  const { language, name, businessName, phone } = usePreferences();
  const { pathname } = useLocation();
  const needsOnboarding = pathname !== "/login" && (!language || !name || !businessName || !phone);

  return (
    <>
      <Routes>
        {/* ── Public ───────────────────────────────────────────────────── */}
        <Route path="/login" element={<AuthPage />} />

        {/* ── Protected ────────────────────────────────────────────────── */}
        <Route path="/"           element={<Protected><Index /></Protected>} />
        <Route path="/analytics"  element={<Protected><Analytics /></Protected>} />
        <Route path="/transactions" element={<Protected><Transactions /></Protected>} />
        <Route path="/reports"    element={<Protected><Reports /></Protected>} />
        <Route path="/spending"   element={<Protected><Spending /></Protected>} />
        <Route path="/loan-alert" element={<Protected><LoanAlert /></Protected>} />
        <Route path="/learn"      element={<Protected><Learn /></Protected>} />
        <Route path="/insights"   element={<Protected><GrowthInsights /></Protected>} />
        <Route path="/settings"   element={<Protected><Settings /></Protected>} />
        <Route path="/help"       element={<Protected><Help /></Protected>} />
        <Route path="/scan"       element={<Protected><ScanBill /></Protected>} />
        <Route path="/trending"   element={<Protected><Trending /></Protected>} />

        {/* ── 404 ──────────────────────────────────────────────────────── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <OnboardingDialog open={Boolean(needsOnboarding)} onClose={() => {}} />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <PreferencesProvider>
      <I18nProvider>
        <ThemeProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppContent />
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </I18nProvider>
    </PreferencesProvider>
  </QueryClientProvider>
);

export default App;
