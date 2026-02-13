import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3 } from "lucide-react";
import { IncomeExpenseChart } from "./charts/IncomeExpenseChart";
import { ProfitLossChart } from "./charts/ProfitLossChart";
import { CategoryChart } from "./charts/CategoryChart";
import { VoiceButton } from "./VoiceButton";
import { StatsCard } from "./StatsCard";
import { useI18n } from "@/contexts/I18nContext";
import { usePreferences } from "@/contexts/PreferencesContext";

export function Dashboard() {
  const { t } = useI18n();
  const { persona } = usePreferences();
  // Mock data - will be replaced with real data from Supabase
  const todayStats = {
    income: 2850,
    expenses: 1200,
    profit: 1650,
    transactions: 15
  };

  const recentTransactions = [
    { id: 1, item: "दूध", type: "expense", amount: 50, time: "10:30 AM" },
    { id: 2, item: "Cold Drinks", type: "sale", amount: 90, time: "11:45 AM" },
    { id: 3, item: "चाय पत्ती", type: "expense", amount: 120, time: "2:15 PM" },
    { id: 4, item: "Snacks", type: "sale", amount: 150, time: "3:30 PM" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {t("header_title", "dashboard")}
            </h1>
            <p className="text-muted-foreground">{t("subheader_today", "dashboard")}</p>
          </div>
          <Button variant="outline" className="shadow-card">
            <PieChart className="mr-2 h-4 w-4" />
            {t("view_reports", "dashboard")}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title={t("todays_income", "dashboard")}
            value={`₹${todayStats.income.toLocaleString()}`}
            icon={TrendingUp}
            trend="+12%"
            className="bg-gradient-success"
          />
          <StatsCard
            title={t("todays_expenses", "dashboard")}
            value={`₹${todayStats.expenses.toLocaleString()}`}
            icon={TrendingDown}
            trend="-5%"
            variant="expense"
          />
          {persona === "business" && (
            <StatsCard
              title={t("net_profit", "dashboard")}
              value={`₹${todayStats.profit.toLocaleString()}`}
              icon={DollarSign}
              trend="+18%"
              className="bg-gradient-primary"
            />
          )}
          <StatsCard
            title={t("transactions", "dashboard")}
            value={todayStats.transactions.toString()}
            icon={BarChart3}
            trend="+3"
            variant="neutral"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-card bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                {t("income_vs_expenses", "dashboard")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <IncomeExpenseChart />
            </CardContent>
          </Card>

          {persona === "business" && (
          <Card className="shadow-card bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-secondary" />
                {t("profit_loss_trend", "dashboard")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProfitLossChart />
            </CardContent>
          </Card>
          )}
        </div>

        {/* Category Analysis & Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-card bg-gradient-card">
            <CardHeader>
              <CardTitle>{t("category_breakdown", "dashboard")}</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryChart />
            </CardContent>
          </Card>

          <Card className="shadow-card bg-gradient-card">
            <CardHeader>
              <CardTitle>{t("recent_transactions", "dashboard")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{transaction.item}</p>
                      <p className="text-sm text-muted-foreground">{transaction.time}</p>
                    </div>
                    <div className={`text-right ${
                      transaction.type === 'sale' ? 'text-success' : 'text-destructive'
                    }`}>
                      <p className="font-semibold">
                        {transaction.type === 'sale' ? '+' : '-'}₹{transaction.amount}
                      </p>
                      <p className="text-xs">
                        {transaction.type === 'sale' ? t("sale", "dashboard") : t("expense", "dashboard")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Tips */}
        <Card className="shadow-card bg-gradient-card">
          <CardHeader>
            <CardTitle>💡 {t("tip_title", "dashboard")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              <strong>Track Daily Cash Flow:</strong> Keep monitoring your top categories and spend.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Floating Voice Button */}
      <VoiceButton />
    </div>
  );
}