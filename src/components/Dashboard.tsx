import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3 } from "lucide-react";
import { IncomeExpenseChart } from "./charts/IncomeExpenseChart";
import { ProfitLossChart } from "./charts/ProfitLossChart";
import { CategoryChart } from "./charts/CategoryChart";
import { VoiceButton } from "./VoiceButton";
import { StatsCard } from "./StatsCard";
import { useI18n } from "@/contexts/I18nContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useAuth } from "@/contexts/AuthContext";

export function Dashboard() {
  const { t } = useI18n();
  const { persona } = usePreferences();
  const { token } = useAuth();

  const [stats, setStats] = useState({
    income: 0,
    expenses: 0,
    profit: 0,
    transactions: 0
  });
  const [growth, setGrowth] = useState({
    revenueGrowth: "0%",
    expenseRatio: "0%",
    profitMargin: "0%",
    customerRetention: "0%"
  });
  const [weeklyStats, setWeeklyStats] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [statsRes, weeklyRes, categoryRes, growthRes] = await Promise.all([
          axios.get(`${""}/api/stats`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${""}/api/analytics/weekly-stats`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${""}/api/analytics/spending`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${""}/api/analytics/growth`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const data = statsRes.data;
        setStats({
          income: data.income || 0,
          expenses: data.expenses || 0,
          profit: data.profit || 0,
          transactions: data.transactions || 0
        });
        setRecentTransactions(data.recentTransactions || []);
        setWeeklyStats(weeklyRes.data);
        setCategoryData(categoryRes.data.topCategories);
        setGrowth(growthRes.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

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
            value={`₹${stats.income.toLocaleString()}`}
            icon={TrendingUp}
            trend={growth.revenueGrowth}
            className="bg-gradient-success"
          />
          <StatsCard
            title={t("todays_expenses", "dashboard")}
            value={`₹${stats.expenses.toLocaleString()}`}
            icon={TrendingDown}
            trend={growth.expenseRatio}
            variant="expense"
          />
          {persona === "business" && (
            <StatsCard
              title={t("net_profit", "dashboard")}
              value={`₹${stats.profit.toLocaleString()}`}
              icon={DollarSign}
              trend={growth.profitMargin}
              className="bg-gradient-primary"
            />
          )}
          <StatsCard
            title={t("transactions", "dashboard")}
            value={stats.transactions.toString()}
            icon={BarChart3}
            trend={`${stats.transactions > 0 ? '+' : ''}${stats.transactions}`}
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
              <ProfitLossChart data={weeklyStats.map(d => ({ name: d.name, profit: d.profit }))} />
            </CardContent>
          </Card>
        </div>

        {/* Category Analysis & Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-card bg-gradient-card">
            <CardHeader>
              <CardTitle>{t("category_breakdown", "dashboard")}</CardTitle>
            </CardHeader>
            <CardContent>
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
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{transaction.item}</p>
                      <p className="text-sm text-muted-foreground">{transaction.time}</p>
                    </div>
                    <div className={`text-right ${transaction.type === 'sale' ? 'text-success' : 'text-destructive'
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
              {categoryData[0] ? (
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

      {/* Floating Voice Button */}
      <VoiceButton />
    </div>
  );
}