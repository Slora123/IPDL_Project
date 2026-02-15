import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart,
  Target
} from "lucide-react";
import { IncomeExpenseChart } from "@/components/charts/IncomeExpenseChart";
import { ProfitLossChart } from "@/components/charts/ProfitLossChart";
import { CategoryChart } from "@/components/charts/CategoryChart";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any[]>([]);
  const [topCategories, setTopCategories] = useState<any[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [insights, setInsights] = useState({
    cost: "Loading insights...",
    growth: "Analyzing category trends..."
  });

  const { token } = useAuth();

  useEffect(() => {
    fetchAnalytics();
  }, [token]);

  const fetchAnalytics = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {

      // Fetch all required analytics
      const [growthRes, spendingRes, weeklyRes] = await Promise.all([
        axios.get(`${API_URL}/api/analytics/growth`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/analytics/spending`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/analytics/weekly-stats`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const growth = growthRes.data;
      setPerformanceMetrics([
        { label: "Revenue Growth", value: growth.revenueGrowth, trend: growth.revenueGrowth.startsWith('-') ? "down" : "up", color: growth.revenueGrowth.startsWith('-') ? "text-destructive" : "text-success" },
        { label: "Expense Ratio", value: growth.expenseRatio, trend: "neutral", color: "text-warning" },
        { label: "Profit Margin", value: growth.profitMargin, trend: growth.profitMargin.startsWith('-') ? "down" : "up", color: growth.profitMargin.startsWith('-') ? "text-destructive" : "text-success" },
        { label: "Customer Retention", value: growth.customerRetention, trend: "up", color: "text-success" },
      ]);

      const topCats = spendingRes.data.topCategories.map((cat: any) => ({
        name: cat.name,
        revenue: cat.amount || 0,
        growth: "+0%"
      }));
      setTopCategories(topCats);
      setCategoryData(spendingRes.data.topCategories.map((cat: any) => ({
        ...cat,
        value: cat.amount || 0
      })));
      setWeeklyStats(weeklyRes.data);

      // Generate dynamic insights
      const topCat = spendingRes.data.topCategories[0];
      const revGrowth = growth.revenueGrowth;
      const expRatioStr = growth.expenseRatio.replace('%', '');
      const expRatio = parseInt(expRatioStr) || 0;

      setInsights({
        cost: expRatio > 50
          ? `Your expense ratio is ${growth.expenseRatio}. Focus on lowering your ${topCat?.name || 'highest'} spending to improve profit margins.`
          : expRatio > 0
            ? `Your expense ratio of ${growth.expenseRatio} is very healthy. You're managing costs effectively this month.`
            : "Add some expenses to see cost optimization advice.",
        growth: topCat
          ? `${topCat.name} is your star category with ₹${(topCat.amount || 0).toLocaleString()} in revenue. ${revGrowth.startsWith('+') ? 'Your upward trend is looking strong!' : 'Monitor this category for seasonal changes.'}`
          : "Your revenue trends will appear here as you record more sales."
      });
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      console.error('Error details:', error.response?.data || error.message);
      setError(error.response?.data?.error || error.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-6">Loading analytics...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Deep insights into your business performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Date Range
          </Button>
          <Button size="sm" className="bg-gradient-primary">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceMetrics.map((metric, index) => (
          <Card key={index} className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                </div>
                <div className={`flex items-center gap-1 ${metric.color}`}>
                  {metric.trend === "up" ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
          <TabsTrigger value="categories">Category Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends & Forecasts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Income vs Expenses (Weekly)
                </CardTitle>
                <CardDescription>Last 7 days performance breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <IncomeExpenseChart data={weeklyStats} />
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Profit Trend
                </CardTitle>
                <CardDescription>Daily profit/loss tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <ProfitLossChart data={weeklyStats.map(d => ({ name: d.name, profit: d.profit }))} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Revenue Breakdown by Category</CardTitle>
                  <CardDescription>Analyze which categories drive the most revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <CategoryChart data={categoryData} />
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Top Performers
                </CardTitle>
                <CardDescription>Best performing categories this month</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {topCategories.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{category.name}</p>
                      <p className="text-sm text-muted-foreground">₹{(category.revenue || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-success text-sm font-medium">
                      {category.growth}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Category Performance Analysis</CardTitle>
              <CardDescription>Detailed breakdown of each business category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <IncomeExpenseChart data={[]} />
                <div className="text-center text-muted-foreground">
                  <p>Category-specific analytics coming soon...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Trends & Forecasting</CardTitle>
              <CardDescription>AI-powered insights and predictions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <ProfitLossChart data={[]} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-success/10 rounded-lg">
                    <h3 className="font-medium text-success">Growing Trend</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Beverage sales showing strong upward momentum
                    </p>
                  </div>
                  <div className="p-4 bg-warning/10 rounded-lg">
                    <h3 className="font-medium text-warning">Watch Out</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Grocery expenses increasing faster than revenue
                    </p>
                  </div>
                  <div className="p-4 bg-info/10 rounded-lg">
                    <h3 className="font-medium text-info">Opportunity</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Peak sales time: 11 AM - 2 PM daily
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Financial Tips */}
      <Card className="shadow-card bg-gradient-card">
        <CardHeader>
          <CardTitle>💡 Analytics Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Cost Optimization</h4>
              <p className="text-sm text-muted-foreground">
                {insights.cost}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Revenue Growth</h4>
              <p className="text-sm text-muted-foreground">
                {insights.growth}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}