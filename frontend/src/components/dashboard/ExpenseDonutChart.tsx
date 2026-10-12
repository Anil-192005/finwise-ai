import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { CategoryBreakdown } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { PieChart as PieIcon } from 'lucide-react';

interface Props {
  breakdown: CategoryBreakdown[];
  month: string;
}

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6',
  '#06b6d4', '#f43f5e', '#14b8a6', '#6366f1', '#eab308'
];

export const ExpenseDonutChart: React.FC<Props> = ({ breakdown, month }) => {
  const { formatCurrency } = useAuth();
  const totalAmount = breakdown.reduce((sum, item) => sum + item.amount, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0f172a] border border-slate-700/80 p-3 rounded-xl shadow-xl text-xs">
          <p className="font-bold text-white mb-1">{data.category_name}</p>
          <p className="text-blue-400 font-semibold">{formatCurrency(data.amount)}</p>
          <p className="text-slate-400 text-[10px] mt-0.5">{data.percentage}% of monthly total</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#0e1526]/80 backdrop-blur-sm border border-slate-800/80 flex flex-col justify-between">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <PieIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Expense Distribution</h3>
            <p className="text-[11px] text-slate-400">By category for {month}</p>
          </div>
        </div>
        <span className="text-xs font-semibold text-slate-300">
          Total: <span className="text-rose-400">{formatCurrency(totalAmount)}</span>
        </span>
      </div>

      {breakdown.length === 0 ? (
        <div className="h-56 flex items-center justify-center text-xs text-slate-500">
          No expenses recorded for this month.
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="h-52 w-52 relative shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="amount"
                >
                  {breakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] uppercase font-bold text-slate-400">Categories</span>
              <span className="text-base font-extrabold text-white">{breakdown.length}</span>
            </div>
          </div>

          <div className="flex-1 w-full space-y-2 max-h-52 overflow-y-auto pr-1">
            {breakdown.slice(0, 6).map((item, idx) => (
              <div key={item.category_id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate pr-2">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="text-slate-300 font-medium truncate">{item.category_name}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-white font-semibold">{formatCurrency(item.amount)}</span>
                  <span className="text-[10px] text-slate-400 ml-1.5">({item.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
