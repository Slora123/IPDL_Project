import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Users, Target, BarChart3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface GrowthMetric {
    label: string;
    value: string;
    trend: "up" | "down" | "neutral";
    color: string;
    icon: any;
    description: string;
}

export default function GrowthInsights() {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [metrics, setMetrics] = useState<GrowthMetric[]>([]);

    useEffect(() => {
        const fetchGrowthData = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/analytics/growth`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const data = response.data;

                setMetrics([
                    {
                        label: "Revenue Growth",
                        value: data.revenueGrowth,
                        trend: data.revenueGrowth.startsWith("-") ? "down" : "up",
                        color: data.revenueGrowth.startsWith("-") ? "text-destructive" : "text-success",
                        icon: TrendingUp,
                        description: "Month-over-month revenue change"
                    },
                    {
                        label: "Expense Ratio",
                        value: data.expenseRatio,
                        trend: "neutral",
                        color: "text-warning",
                        icon: Target,
                        description: "Expenses as % of revenue"
                    },
                    {
                        label: "Profit Margin",
                        value: data.profitMargin,
                        trend: data.profitMargin.startsWith("-") ? "down" : "up",
                        color: data.profitMargin.startsWith("-") ? "text-destructive" : "text-success",
                        icon: DollarSign,
                        description: "Net profit as % of revenue"
                    },
                    {
                        label: "Customer Retention",
                        value: data.customerRetention,
                        trend: "up",
                        color: "text-success",
                        icon: Users,
                        description: "Estimated customer loyalty"
                    }
                ]);
            } catch (error: any) {
                console.error("Error fetching growth insights:", error);
                setError(error.response?.data?.error || "Failed to load growth insights");
            } finally {
                setLoading(false);
            }
        };

        fetchGrowthData();
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
                <div className="container mx-auto space-y-6">
                    <div>
                        <Skeleton className="h-10 w-64 mb-2" />
                        <Skeleton className="h-5 w-96" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-48" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
                <div className="container mx-auto">
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
            <div className="container mx-auto p-6 space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                        Growth Insights
                    </h1>
                    <p className="text-muted-foreground">
                        Track your business performance and growth metrics
                    </p>
                </div>

                {/* Growth Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {metrics.map((metric, index) => (
                        <Card key={index} className="shadow-card bg-gradient-card hover:shadow-xl transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        {metric.label}
                                    </CardTitle>
                                    <metric.icon className={`h-5 w-5 ${metric.color}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className={`text-3xl font-bold ${metric.color}`}>
                                    {metric.value}
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    {metric.description}
                                </p>
                                <div className="flex items-center mt-3 text-xs">
                                    {metric.trend === "up" && (
                                        <>
                                            <TrendingUp className="h-3 w-3 text-success mr-1" />
                                            <span className="text-success">Positive trend</span>
                                        </>
                                    )}
                                    {metric.trend === "down" && (
                                        <>
                                            <TrendingDown className="h-3 w-3 text-destructive mr-1" />
                                            <span className="text-destructive">Needs attention</span>
                                        </>
                                    )}
                                    {metric.trend === "neutral" && (
                                        <>
                                            <BarChart3 className="h-3 w-3 text-muted-foreground mr-1" />
                                            <span className="text-muted-foreground">Monitor closely</span>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Insights and Recommendations */}
                <Card className="shadow-card bg-gradient-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Growth Recommendations
                        </CardTitle>
                        <CardDescription>
                            Personalized insights to help grow your business
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {metrics[0] && metrics[0].trend === "down" && (
                            <div className="p-4 bg-destructive/10 border-l-4 border-destructive rounded-md">
                                <h4 className="font-semibold text-destructive mb-2">⚠️ Revenue Declining</h4>
                                <p className="text-sm text-muted-foreground">
                                    Your month-over-month revenue is down. Consider reviewing your pricing strategy,
                                    marketing efforts, and customer acquisition channels.
                                </p>
                            </div>
                        )}

                        {metrics[1] && parseInt(metrics[1].value) > 70 && (
                            <div className="p-4 bg-warning/10 border-l-4 border-warning rounded-md">
                                <h4 className="font-semibold text-warning mb-2">💡 High Expense Ratio</h4>
                                <p className="text-sm text-muted-foreground">
                                    Your expenses are {metrics[1].value} of revenue. Look for opportunities to optimize
                                    costs without compromising quality or service.
                                </p>
                            </div>
                        )}

                        {metrics[2] && metrics[2].trend === "up" && (
                            <div className="p-4 bg-success/10 border-l-4 border-success rounded-md">
                                <h4 className="font-semibold text-success mb-2">✅ Healthy Profit Margins</h4>
                                <p className="text-sm text-muted-foreground">
                                    Great work! Your profit margin of {metrics[2].value} is trending positively.
                                    Continue monitoring to maintain this growth.
                                </p>
                            </div>
                        )}

                        <div className="p-4 bg-info/10 border-l-4 border-info rounded-md">
                            <h4 className="font-semibold text-info mb-2">📊 Keep Tracking</h4>
                            <p className="text-sm text-muted-foreground">
                                Regular monitoring of these metrics helps you make data-driven decisions.
                                Check back weekly to track your progress.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
