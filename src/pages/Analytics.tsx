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

export default function Analytics() {
  const performanceMetrics = [
    { label: "Revenue Growth", value: "+18.2%", trend: "up", color: "text-success" },
    { label: "Expense Ratio", value: "42%", trend: "down", color: "text-warning" },
    { label: "Profit Margin", value: "58%", trend: "up", color: "text-success" },
    { label: "Customer Retention", value: "94%", trend: "up", color: "text-success" },
  ];

  const topCategories = [
    { name: "Dairy Products", revenue: 12500, growth: "+15%" },
    { name: "Beverages", revenue: 8900, growth: "+8%" },
    { name: "Snacks", revenue: 6400, growth: "+22%" },
    { name: "Groceries", revenue: 4200, growth: "+5%" },
  ];

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
                <IncomeExpenseChart />
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
                <ProfitLossChart />
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
                  <CategoryChart />
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
                      <p className="text-sm text-muted-foreground">₹{category.revenue.toLocaleString()}</p>
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
                <IncomeExpenseChart />
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
                <ProfitLossChart />
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
                Your expense ratio has improved by 5% this month. Consider investing the saved amount in inventory expansion.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Revenue Growth</h4>
              <p className="text-sm text-muted-foreground">
                Dairy products show consistent growth. Focus marketing efforts on this category for maximum ROI.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}