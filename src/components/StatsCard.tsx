import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "expense" | "neutral";
  className?: string;
}

export function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  variant = "default",
  className = "" 
}: StatsCardProps) {
  const { t } = useI18n();
  const isColoredBackground = className.includes("bg-gradient-success") || className.includes("bg-gradient-primary");

  const getVariantStyles = () => {
    switch (variant) {
      case "expense":
        return "bg-destructive/10 border-destructive/20";
      case "neutral":
        return "bg-muted/50 border-muted";
      default:
        return className.includes("bg-gradient") ? "" : "bg-gradient-card border-primary/20";
    }
  };

  const getTrendColor = () => {
    if (!trend) return "";
    if (isColoredBackground) return "text-white/90";
    return trend.startsWith('+') ? "text-success" : "text-destructive";
  };

  const textColorClass = isColoredBackground ? "text-white" : "";
  const titleColorClass = isColoredBackground ? "text-white/90" : "text-muted-foreground";
  const iconColorClass = isColoredBackground ? "text-white/90" : "text-foreground/70";
  const iconBgClass = isColoredBackground ? "bg-white/20" : "bg-background/50";

  return (
    <Card className={`shadow-card transition-smooth hover:shadow-lg hover:-translate-y-1 ${getVariantStyles()} ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className={`text-sm font-medium ${titleColorClass}`}>{title}</p>
            <p className={`text-2xl font-bold ${textColorClass}`}>{value}</p>
            {trend && (
              <p className={`text-sm font-medium ${getTrendColor()}`}>
                {trend} {t("from_yesterday", "dashboard", "from yesterday")}
              </p>
            )}
          </div>
          <div className={`h-12 w-12 rounded-full ${iconBgClass} flex items-center justify-center`}>
            <Icon className={`h-6 w-6 ${iconColorClass}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}