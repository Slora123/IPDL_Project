import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryChart } from "@/components/charts/CategoryChart";
import { StatsCard } from "@/components/StatsCard";
import { TrendingDown } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";
import axios from "axios";



export default function Spending() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [todayExpenses, setTodayExpenses] = useState(0);
  const [topCategories, setTopCategories] = useState<any[]>([]);

  useEffect(() => {
    fetchSpendingData();
  }, []);

  const fetchSpendingData = async () => {
    try {
      const token = localStorage.getItem('token');

      // Fetch today's stats
      const statsRes = await axios.get('/api/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTodayExpenses(statsRes.data.expenses);

      // Fetch spending analytics
      const analyticsRes = await axios.get('/api/analytics/spending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTopCategories(analyticsRes.data.topCategories || []);
    } catch (error) {
      console.error('Error fetching spending data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("category_breakdown", "dashboard")}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StatsCard
          title={t("todays_expenses", "dashboard")}
          value={`₹${todayExpenses.toLocaleString()}`}
          icon={TrendingDown}
          trend="-5%"
          variant="expense"
        />
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("category_breakdown", "dashboard")}</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryChart data={topCategories.map(c => ({ ...c, value: c.amount }))} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Spending Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {topCategories.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No expense data yet</p>
          ) : (
            <ul className="space-y-2">
              {topCategories.map((category, index) => (
                <li key={index} className="flex justify-between items-center p-2 hover:bg-muted/50 rounded-lg transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color || 'gray' }}></div>
                    <span>{category.name}</span>
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
