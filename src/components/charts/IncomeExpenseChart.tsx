import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Mon', income: 2400, expense: 1200 },
  { name: 'Tue', income: 1398, expense: 800 },
  { name: 'Wed', income: 9800, expense: 2000 },
  { name: 'Thu', income: 3908, expense: 1500 },
  { name: 'Fri', income: 4800, expense: 1800 },
  { name: 'Sat', income: 3800, expense: 1300 },
  { name: 'Sun', income: 4300, expense: 1100 },
];

export function IncomeExpenseChart() {
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