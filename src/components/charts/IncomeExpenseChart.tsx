import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface IncomeExpenseChartProps {
  data?: { name: string; income: number; expense: number }[];
}

export function IncomeExpenseChart({ data = [] }: IncomeExpenseChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            color: 'hsl(var(--card-foreground))'
          }}
        />
        <Bar
          dataKey="income"
          fill="hsl(var(--success))"
          radius={[4, 4, 0, 0]}
          name="Income (₹)"
        />
        <Bar
          dataKey="expense"
          fill="hsl(var(--destructive))"
          radius={[4, 4, 0, 0]}
          name="Expense (₹)"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}