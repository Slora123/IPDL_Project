import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryChart } from "@/components/charts/CategoryChart";
import { StatsCard } from "@/components/StatsCard";
import { TrendingDown } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

export default function Spending() {
  const { t } = useI18n();
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("category_breakdown", "dashboard")}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StatsCard
          title={t("todays_expenses", "dashboard")}
          value={`₹${(1200).toLocaleString()}`}
          icon={TrendingDown}
          trend="-5%"
          variant="expense"
        />
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("category_breakdown", "dashboard")}</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryChart />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Spending Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex justify-between"><span>Groceries</span><span>₹5,500</span></li>
            <li className="flex justify-between"><span>Rent</span><span>₹10,000</span></li>
            <li className="flex justify-between"><span>Salary</span><span>₹18,000</span></li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}


