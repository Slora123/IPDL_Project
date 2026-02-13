import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

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
  const getVariantStyles = () => {
    switch (variant) {
      case "expense":
        return "bg-destructive/10 border-destructive/20";
      case "neutral":
        return "bg-muted/50 border-muted";
      default:
        return "bg-gradient-card border-primary/20";
    }
  };

  const getTrendColor = () => {
    if (!trend) return "";
    return trend.startsWith('+') ? "text-success" : "text-destructive";
  };

  return (
    <Card className={`shadow-card transition-smooth hover:shadow-lg hover:-translate-y-1 ${getVariantStyles()} ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend && (
              <p className={`text-sm font-medium ${getTrendColor()}`}>
                {trend} from yesterday
              </p>
            )}
          </div>
          <div className="h-12 w-12 rounded-full bg-background/50 flex items-center justify-center">
            <Icon className="h-6 w-6 text-foreground/70" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}