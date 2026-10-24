import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useI18n } from '@/contexts/I18nContext';

interface ProfitLossChartProps {
  data?: { name: string; profit: number }[];
}

export function ProfitLossChart({ data = [] }: ProfitLossChartProps) {
  const { t } = useI18n();

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="name"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
        />
        <Tooltip
          formatter={(value: any) => [`₹${Number(value || 0).toLocaleString()}`, '']}
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            color: 'hsl(var(--card-foreground))'
          }}
        />
        <Line
          type="monotone"
          dataKey="profit"
          stroke="#0ea5e9"
          strokeWidth={3}
          dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 4 }}
          name={t('profit_rupees', 'common', 'Profit (₹)')}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}