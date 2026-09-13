import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
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
// @ts-ignore
import html2pdf from "html2pdf.js";


const API_URL = "" || 'http://localhost:3000';

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
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [filterActive, setFilterActive] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {

    try {

      // Fetch all required analytics
      const [growthRes, spendingRes, weeklyRes] = await Promise.all([
        axios.get(`${API_URL}/api/analytics/growth`),
        axios.get(`${API_URL}/api/analytics/spending`),
        axios.get(`${API_URL}/api/analytics/weekly-stats`)
      ]);

      const growth = growthRes.data || {};
      const revGrowthStr = growth.revenueGrowth || "0%";
      const profitMarginStr = growth.profitMargin || "0%";
      setPerformanceMetrics([
        { label: "Revenue Growth", value: revGrowthStr, trend: revGrowthStr.startsWith('-') ? "down" : "up", color: revGrowthStr.startsWith('-') ? "text-destructive" : "text-success" },
        { label: "Expense Ratio", value: growth.expenseRatio || "0%", trend: "neutral", color: "text-warning" },
        { label: "Profit Margin", value: profitMarginStr, trend: profitMarginStr.startsWith('-') ? "down" : "up", color: profitMarginStr.startsWith('-') ? "text-destructive" : "text-success" },
        { label: "Customer Retention", value: growth.customerRetention || "0%", trend: "up", color: "text-success" },
      ]);

      const topCategories = Array.isArray(spendingRes.data?.topCategories) ? spendingRes.data.topCategories : [];
      const topCats = topCategories.map((cat: any) => ({
        name: cat.name,
        revenue: cat.amount || 0,
        growth: cat.growth || "+0%"
      }));
      setTopCategories(topCats);
      setCategoryData(topCategories.map((cat: any) => ({
        ...cat,
        value: cat.amount || 0
      })));
      setWeeklyStats(Array.isArray(weeklyRes.data) ? weeklyRes.data : []);

      // Generate dynamic insights
      const topCat = topCategories[0];
      const revGrowth = growth.revenueGrowth || "0%";
      const expRatioStr = (growth.expenseRatio || "0%").replace('%', '');
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
    return <div className="w-full max-w-7xl mx-auto p-6">Loading analytics...</div>;
  }

  if (error) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6">
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  const handleExportPDF = () => {
    const element = document.getElementById('analytics-content');
    if (element) {
      const opt = {
        margin:       0.5,
        filename:     'analytics-dashboard.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(element).save();
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6" id="analytics-content">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" data-html2canvas-ignore>
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Deep insights into your business performance</p>
        </div>
        <div className="grid grid-cols-3 gap-1 sm:gap-2 w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 px-1 sm:px-3 text-[10px] sm:text-sm">
                <Filter className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Filters</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Filter Categories</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked={filterActive} onCheckedChange={setFilterActive}>
                Top Categories
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={false}>
                All Categories
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-9 px-1 sm:px-3 text-[10px] sm:text-sm">
                <CalendarIcon className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">{date ? date.toLocaleDateString() : 'Date'}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button className="bg-gradient-primary h-9 px-1 sm:px-3 text-[10px] sm:text-sm" onClick={handleExportPDF}>
            <Download className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="truncate">Export</span>
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
        <TabsList className="grid w-full grid-cols-4 h-auto gap-1 p-1">
          <TabsTrigger value="overview" className="text-[10px] sm:text-sm px-0">Overview</TabsTrigger>
          <TabsTrigger value="revenue" className="text-[10px] sm:text-sm px-0">Revenue</TabsTrigger>
          <TabsTrigger value="categories" className="text-[10px] sm:text-sm px-0">Categories</TabsTrigger>
          <TabsTrigger value="trends" className="text-[10px] sm:text-sm px-0">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-card">
              <CardHeader className="p-4 sm:p-6 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-xl whitespace-nowrap">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="truncate">Income vs Expenses (Weekly)</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Last 7 days performance breakdown</CardDescription>
              </CardHeader>
              <CardContent className="p-1 sm:p-6 pb-2">
                <IncomeExpenseChart data={weeklyStats} />
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="p-4 sm:p-6 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-xl whitespace-nowrap">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="truncate">Profit Trend</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Daily profit/loss tracking</CardDescription>
              </CardHeader>
              <CardContent className="p-1 sm:p-6 pb-2">
                <ProfitLossChart data={weeklyStats.map(d => ({ name: d.name, profit: d.profit }))} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="shadow-card">
                <CardHeader className="p-4 sm:p-6 pb-2">
                  <CardTitle className="text-sm sm:text-xl truncate">Revenue Breakdown by Category</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Analyze which categories drive the most revenue</CardDescription>
                </CardHeader>
                <CardContent className="p-1 sm:p-6 pb-2">
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
            <CardHeader className="p-4 sm:p-6 pb-2">
              <CardTitle className="text-sm sm:text-xl truncate">Category Performance Analysis</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Detailed breakdown of each business category</CardDescription>
            </CardHeader>
            <CardContent className="p-1 sm:p-6 pb-2">
              <div className="space-y-6">
                <IncomeExpenseChart data={weeklyStats} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader className="p-4 sm:p-6 pb-2">
              <CardTitle className="text-sm sm:text-xl truncate">Trends &amp; Forecasting</CardTitle>
              <CardDescription className="text-xs sm:text-sm">AI-powered insights and predictions</CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pb-2">
              <div className="space-y-6">
                <ProfitLossChart data={weeklyStats.map(d => ({ name: d.name, profit: d.profit }))} />
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