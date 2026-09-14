import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PreferencesProvider, usePreferences } from "@/contexts/PreferencesContext";
import { I18nProvider } from "@/contexts/I18nContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { OnboardingDialog } from "@/components/OnboardingDialog";
import { Layout } from "./pages/Layout";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { language, name, businessName, phone } = usePreferences();
  const needsOnboarding = !language || !name || !businessName || !phone;

  return (
    <>
      <Routes>
        <Route path="/" element={
          <Layout>
            <Index />
          </Layout>
        } />
        <Route path="/analytics" element={
          <Layout>
            <Analytics />
          </Layout>
        } />
        <Route path="/transactions" element={
          <Layout>
            <Transactions />
          </Layout>
        } />
        <Route path="/reports" element={
          <Layout>
            <Reports />
          </Layout>
        } />
        <Route path="/spending" element={
          <Layout>
            <Spending />
          </Layout>
        } />
        <Route path="/loan-alert" element={
          <Layout>
            <LoanAlert />
          </Layout>
        } />
        <Route path="/learn" element={
          <Layout>
            <Learn />
          </Layout>
        } />
        <Route path="/insights" element={
          <Layout>
            <GrowthInsights />
          </Layout>
        } />
        <Route path="/settings" element={
          <Layout>
            <Settings />
          </Layout>
        } />
        <Route path="/help" element={
          <Layout>
            <Help />
          </Layout>
        } />
        <Route path="/scan" element={
          <Layout>
            <ScanBill />
          </Layout>
        } />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <OnboardingDialog open={Boolean(needsOnboarding)} onClose={() => { }} />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <PreferencesProvider>
      <I18nProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </I18nProvider>
    </PreferencesProvider>
  </QueryClientProvider>
);

export default App;