import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Mon', profit: 1200 },
  { name: 'Tue', profit: 598 },
  { name: 'Wed', profit: 7800 },
  { name: 'Thu', profit: 2408 },
  { name: 'Fri', profit: 3000 },
  { name: 'Sat', profit: 2500 },
  { name: 'Sun', profit: 3200 },
];

export function ProfitLossChart() {
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
          stroke="hsl(var(--primary))" 
          strokeWidth={3}
          dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
          name="Profit (₹)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}