import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PreferencesProvider, usePreferences } from "@/contexts/PreferencesContext";
import { I18nProvider } from "@/contexts/I18nContext";
import { OnboardingDialog } from "@/components/OnboardingDialog";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "./pages/Layout";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import Index from "./pages/Index";
import Analytics from "./pages/Analytics";
import Transactions from "./pages/Transactions";
import Reports from "./pages/Reports";
import Spending from "./pages/Spending";
import LoanAlert from "./pages/LoanAlert";
import Learn from "./pages/Learn";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";
import { useAuth } from "@/contexts/AuthContext";

const queryClient = new QueryClient();

const AppContent = () => {
  const { language, persona } = usePreferences();
  const { user } = useAuth();
  const location = useLocation();
  const isLoginRoute = location.pathname === "/login";
  const needsOnboarding = user && !isLoginRoute && (!language || !persona);
  return (
    <>
      <Routes>
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <Index />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute>
            <Layout>
              <Analytics />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/transactions" element={
          <ProtectedRoute>
            <Layout>
              <Transactions />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute>
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/spending" element={
          <ProtectedRoute>
            <Layout>
              <Spending />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/loan-alert" element={
          <ProtectedRoute>
            <Layout>
              <LoanAlert />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/learn" element={
          <ProtectedRoute>
            <Layout>
              <Learn />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/insights" element={
          <ProtectedRoute>
            <Layout>
              <Analytics />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/help" element={
          <ProtectedRoute>
            <Layout>
              <Help />
            </Layout>
          </ProtectedRoute>
        } />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
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
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </I18nProvider>
    </PreferencesProvider>
  </QueryClientProvider>
);

export default App;