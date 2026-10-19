import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, IndianRupee, BarChart3 } from "lucide-react";
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

  const [stats, setStats] = useState({
    income: 0,
    expenses: 0,
    profit: 0,
    transactions: 0
  });
  const [trends, setTrends] = useState({
    income: "0%",
    expenses: "0%",
    profit: "0%",
    transactions: "0%",
  });
  const [weeklyStats, setWeeklyStats] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, weeklyRes, categoryRes] = await Promise.all([
        axios.get('/api/stats'),
        axios.get('/api/analytics/weekly-stats'),
        axios.get('/api/analytics/spending'),
      ]);

      const data = statsRes.data;
      // income / expenses / profit / transactions are TODAY-ONLY from the server
      setStats({
        income:       data.income       || 0,
        expenses:     data.expenses     || 0,
        profit:       data.profit       || 0,
        transactions: data.transactions || 0,
      });
      setRecentTransactions(Array.isArray(data.recentTransactions) ? data.recentTransactions : []);
      setWeeklyStats(Array.isArray(weeklyRes.data) ? weeklyRes.data : []);
      const topCats = Array.isArray(categoryRes.data?.topCategories) ? categoryRes.data.topCategories : [];
      setCategoryData(topCats.map((cat: any) => ({ ...cat, value: cat.amount || 0 })));

      // Server-computed today-vs-yesterday percentage-change strings
      const tr = data.trends || {};
      setTrends({
        income:       tr.income       || "0%",
        expenses:     tr.expenses     || "0%",
        profit:       tr.profit       || "0%",
        transactions: tr.transactions || "0%",
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {t("header_title", "dashboard")}
            </h1>
            <p className="text-muted-foreground">{t("subheader_today", "dashboard")}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title={t("todays_income", "dashboard")}
            value={`₹${stats.income.toLocaleString()}`}
            icon={TrendingUp}
            trend={trends.income}
            className="bg-gradient-success"
          />
          <StatsCard
            title={t("todays_expenses", "dashboard")}
            value={`₹${stats.expenses.toLocaleString()}`}
            icon={TrendingDown}
            trend={trends.expenses}
            variant="expense"
          />
          {persona === "business" && (
            <StatsCard
              title={t("net_profit", "dashboard")}
              value={`₹${stats.profit.toLocaleString()}`}
              icon={IndianRupee}
              trend={trends.profit}
              className="bg-gradient-primary"
            />
          )}
          <StatsCard
            title={t("transactions", "dashboard")}
            value={stats.transactions.toString()}
            icon={BarChart3}
            trend={trends.transactions}
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
              <IncomeExpenseChart data={weeklyStats} />
            </CardContent>
          </Card>

          <Card className="shadow-card bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-secondary" />
                {t("profit_trend", "dashboard")}
              </CardTitle>
              <CardDescription>
                {t("daily_profit_tracking", "dashboard")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfitLossChart data={(Array.isArray(weeklyStats) ? weeklyStats : []).map(d => ({ name: d?.name || '', profit: d?.profit || 0 }))} />
            </CardContent>
          </Card>
        </div>

        {/* Category Analysis & Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-card bg-gradient-card">
            <CardHeader className="p-4 sm:p-6 pb-2">
              <CardTitle>{t('category_analysis', 'dashboard')}</CardTitle>
            </CardHeader>
            <CardContent className="p-1 sm:p-6 pb-2">
              <CategoryChart data={categoryData} />
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
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate" title={transaction.item}>{transaction.item}</p>
                      <p className="text-sm text-muted-foreground">{transaction.date} · {transaction.time}</p>
                    </div>
                    <div className={`text-right shrink-0 ${transaction.type === 'income' ? 'text-success' : 'text-destructive'
                      }`}>
                      <p className="font-semibold">
                        {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount}
                      </p>
                      <p className="text-xs">
                        {transaction.type === 'income' ? t("income", "dashboard") : t("expense", "dashboard")}
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
              {Array.isArray(categoryData) && categoryData[0] ? (
                <>
                  <strong>Top Performing Category:</strong> {categoryData[0].name} is currently leading your activity. Keep monitoring your flow!
                </>
              ) : (
                <>
                  <strong>Track Daily Cash Flow:</strong> Add transactions to see category-specific insights here.
                </>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Floating Voice Button — refreshes dashboard on save */}
      <VoiceButton onTransactionSaved={fetchStats} />
    </div>
  );
}