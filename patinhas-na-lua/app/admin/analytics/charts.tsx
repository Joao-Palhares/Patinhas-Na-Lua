"use client";

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';

// --- CHART 1: YEARLY (Bars) ---
export function YearlyChart({ data }: { data: any[] }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" fontSize={12} />
          <YAxis fontSize={12} unit="€" />
          <Tooltip 
            // FIX: Allow 'number | undefined' and check existence
            formatter={(value: number | undefined) => [
              `${(value || 0).toFixed(2)}€`, 
              ""
            ]}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend />
          <Bar dataKey="income" name="Entradas (Lucro)" fill="#16a34a" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name="Saídas (Custos)" fill="#dc2626" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// --- CHART 2: MONTHLY (Area) ---
export function MonthlyChart({ data }: { data: any[] }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#dc2626" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="day" fontSize={12} tickCount={10} />
          <YAxis fontSize={12} unit="€" />
          <Tooltip 
            // FIX: Allow 'number | undefined' and check existence
            formatter={(value: number | undefined) => [
              `${(value || 0).toFixed(2)}€`, 
              ""
            ]}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend />
          <Area type="monotone" dataKey="income" name="Entradas" stroke="#16a34a" fillOpacity={1} fill="url(#colorIncome)" />
          <Area type="monotone" dataKey="expense" name="Saídas" stroke="#dc2626" fillOpacity={1} fill="url(#colorExpense)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}