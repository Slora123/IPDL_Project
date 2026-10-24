import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryChart } from "@/components/charts/CategoryChart";
import { StatsCard } from "@/components/StatsCard";
import { TrendingDown } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";
import api from "@/lib/api";

const getTodayDateStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function Spending() {
  const { t, tCategory } = useI18n();
  const [loading, setLoading] = useState(true);
  const [todayExpenses, setTodayExpenses] = useState(0);
  const [expenseTrend, setExpenseTrend] = useState("0%");
  const [topCategories, setTopCategories] = useState<any[]>([]);

  const fetchSpendingData = useCallback(async () => {
    try {
      const clientDate = getTodayDateStr();
      // Fetch today's stats and category spending concurrently
      const [statsRes, analyticsRes] = await Promise.allSettled([
        api.get('/api/stats', { params: { date: clientDate } }),
        api.get('/api/analytics/spending'),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
        setTodayExpenses(statsRes.value.data.expenses || 0);
        setExpenseTrend(statsRes.value.data.trends?.expenses || "0%");
      }

      if (analyticsRes.status === 'fulfilled' && analyticsRes.value?.data) {
        setTopCategories(analyticsRes.value.data.topCategories || []);
      }
    } catch (error) {
      console.error('Error fetching spending data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSpendingData();

    const handleSaved = () => fetchSpendingData();
    window.addEventListener('trackify:transaction-saved', handleSaved);
    return () => window.removeEventListener('trackify:transaction-saved', handleSaved);
  }, [fetchSpendingData]);

  if (loading) {
    return <div className="p-6">{t("loading", "common")}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title", "spending")}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StatsCard
          title={t("todays_expenses", "spending")}
          value={`₹${todayExpenses.toLocaleString()}`}
          icon={TrendingDown}
          trend={expenseTrend}
          variant="expense"
        />
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("title", "spending")}</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryChart data={topCategories.map(c => ({ ...c, name: c.name, value: c.amount || c.value || 0 }))} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("top_categories", "spending")}</CardTitle>
        </CardHeader>
        <CardContent>
          {topCategories.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">{t("no_expense_data", "spending")}</p>
          ) : (
            <ul className="space-y-2">
              {topCategories.map((category, index) => (
                <li key={index} className="flex justify-between items-center p-2 hover:bg-muted/50 rounded-lg transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color || 'gray' }}></div>
                    <span>{tCategory(category.name)}</span>
                  </div>
                  <span className="font-semibold">₹{(category.amount || category.value || 0).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
