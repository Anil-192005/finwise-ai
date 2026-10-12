import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { IncomeExpenseTrend } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { BarChart3 } from 'lucide-react';

interface Props {
  trends: IncomeExpenseTrend[];
  view: 'monthly' | 'yearly';
  onViewChange: (view: 'monthly' | 'yearly') => void;
}

export const IncomeExpenseChart: React.FC<Props> = ({ trends, view, onViewChange }) => {
  const { formatCurrency } = useAuth();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f172a] border border-slate-700/80 p-3 rounded-xl shadow-xl text-xs">
          <p className="font-bold text-slate-200 mb-2">{label}</p>
          <div className="space-y-1">
            <p className="flex items-center gap-2 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Income: {formatCurrency(payload[0]?.value || 0)}</span>
            </p>
            <p className="flex items-center gap-2 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Expense: {formatCurrency(payload[1]?.value || 0)}</span>
            </p>
            {payload[0] && payload[1] && (
              <p className="pt-1 border-t border-slate-800 text-slate-300">
                Net: {formatCurrency((payload[0].value || 0) - (payload[1].value || 0))}
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#0e1526]/80 backdrop-blur-sm border border-slate-800/80">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Cash Flow Trajectory</h3>
            <p className="text-[11px] text-slate-400">Income vs Expenses over time</p>
          </div>
        </div>

        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onViewChange('monthly')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              view === 'monthly'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => onViewChange('yearly')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              view === 'yearly'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full">
        {trends.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500">
            No transaction records available for this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="period"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 15, fontSize: '11px' }}
              />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
