import { useEffect, useState } from "react";
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
  const [topCategories, setTopCategories] = useState<any[]>([]);

  const fetchSpendingData = async () => {
    try {
      const clientDate = getTodayDateStr();
      // Fetch today's stats with client local date
      const statsRes = await api.get('/api/stats', {
        params: { date: clientDate },
        headers: { 'x-client-date': clientDate },
      });
      setTodayExpenses(statsRes.data.expenses);

      // Fetch spending analytics
      const analyticsRes = await api.get('/api/analytics/spending');
      setTopCategories(analyticsRes.data.topCategories || []);
    } catch (error) {
      console.error('Error fetching spending data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpendingData();

    const handleSaved = () => fetchSpendingData();
    window.addEventListener('trackify:transaction-saved', handleSaved);
    return () => window.removeEventListener('trackify:transaction-saved', handleSaved);
  }, []);

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
          trend="-5%"
          variant="expense"
        />
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("title", "spending")}</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryChart data={topCategories.map(c => ({ ...c, name: tCategory(c.name), value: c.amount }))} />
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
                  <span className="font-semibold">₹{category.amount.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
