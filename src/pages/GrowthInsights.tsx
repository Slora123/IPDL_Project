import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, IndianRupee, Users, Target, BarChart3 } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

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
    const { t } = useI18n();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [metrics, setMetrics] = useState<GrowthMetric[]>([]);

    useEffect(() => {
        const fetchGrowthData = async () => {
            try {
                setLoading(true);
                const response = await api.get(`${""}/api/analytics/growth`);

                const data = response.data || {};
                const revenueGrowth = data.revenueGrowth || "0%";
                const profitMargin = data.profitMargin || "0%";

                setMetrics([
                    {
                        label: t("revenue_growth", "analytics", "Revenue Growth"),
                        value: revenueGrowth,
                        trend: revenueGrowth.startsWith("-") ? "down" : "up",
                        color: revenueGrowth.startsWith("-") ? "text-destructive" : "text-success",
                        icon: TrendingUp,
                        description: t("revenue_change_desc", "analytics", "Month-over-month revenue change")
                    },
                    {
                        label: t("expense_ratio", "analytics", "Expense Ratio"),
                        value: data.expenseRatio || "0%",
                        trend: "neutral",
                        color: "text-warning",
                        icon: Target,
                        description: t("expense_pct_desc", "analytics", "Expenses as % of revenue")
                    },
                    {
                        label: t("profit_margin", "analytics", "Profit Margin"),
                        value: profitMargin,
                        trend: profitMargin.startsWith("-") ? "down" : "up",
                        color: profitMargin.startsWith("-") ? "text-destructive" : "text-success",
                        icon: IndianRupee,
                        description: t("net_profit_pct_desc", "analytics", "Net profit as % of revenue")
                    },
                    {
                        label: t("customer_retention", "analytics", "Customer Retention"),
                        value: data.customerRetention || "0%",
                        trend: "up",
                        color: "text-success",
                        icon: Users,
                        description: t("active_users_desc", "analytics", "Active users returning")
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
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
                <div className="w-full max-w-7xl mx-auto space-y-6">
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
                <div className="w-full max-w-7xl mx-auto">
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
            <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                        {t('growth_metrics', 'analytics', 'Growth Insights')}
                    </h1>
                    <p className="text-muted-foreground">
                        {t('subtitle', 'analytics', 'Track your business performance and growth metrics')}
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
                                            <span className="text-success">{t("positive_trend", "analytics", "Positive trend")}</span>
                                        </>
                                    )}
                                    {metric.trend === "down" && (
                                        <>
                                            <TrendingDown className="h-3 w-3 text-destructive mr-1" />
                                            <span className="text-destructive">{t("needs_attention", "analytics", "Needs attention")}</span>
                                        </>
                                    )}
                                    {metric.trend === "neutral" && (
                                        <>
                                            <BarChart3 className="h-3 w-3 text-muted-foreground mr-1" />
                                            <span className="text-muted-foreground">{t("monitor_closely", "analytics", "Monitor closely")}</span>
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
                            {t("growth_recommendations", "analytics", "Growth Recommendations")}
                        </CardTitle>
                        <CardDescription>
                            {t("growth_rec_subtitle", "analytics", "Personalized insights to help grow your business")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {metrics[0] && metrics[0].trend === "down" && (
                            <div className="p-4 bg-destructive/10 border-l-4 border-destructive rounded-md">
                                <h4 className="font-semibold text-destructive mb-2">⚠️ {t("revenue_declining", "analytics", "Revenue Declining")}</h4>
                                <p className="text-sm text-muted-foreground">
                                    {t("revenue_declining_desc", "analytics", "Your month-over-month revenue is down. Consider reviewing your pricing strategy, marketing efforts, and customer acquisition channels.")}
                                </p>
                            </div>
                        )}

                        {metrics[1] && parseInt(metrics[1].value) > 70 && (
                            <div className="p-4 bg-warning/10 border-l-4 border-warning rounded-md">
                                <h4 className="font-semibold text-warning mb-2">💡 {t("high_expense_ratio", "analytics", "High Expense Ratio")}</h4>
                                <p className="text-sm text-muted-foreground">
                                    {t("high_expense_desc", "analytics", "Your expenses are high compared to revenue. Look for opportunities to optimize costs without compromising quality or service.")}
                                </p>
                            </div>
                        )}

                        {metrics[2] && metrics[2].trend === "up" && (
                            <div className="p-4 bg-success/10 border-l-4 border-success rounded-md">
                                <h4 className="font-semibold text-success mb-2">✅ {t("healthy_profit_margins", "analytics", "Healthy Profit Margins")}</h4>
                                <p className="text-sm text-muted-foreground">
                                    {t("healthy_profit_desc", "analytics", "Great work! Your profit margin is trending positively. Continue monitoring to maintain this growth.")}
                                </p>
                            </div>
                        )}

                        <div className="p-4 bg-info/10 border-l-4 border-info rounded-md">
                            <h4 className="font-semibold text-info mb-2">📊 {t("keep_tracking", "analytics", "Keep Tracking")}</h4>
                            <p className="text-sm text-muted-foreground">
                                {t("keep_tracking_desc", "analytics", "Regular monitoring of these metrics helps you make data-driven decisions. Check back weekly to track your progress.")}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
