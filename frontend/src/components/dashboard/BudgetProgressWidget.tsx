import React from 'react';
import { Budget } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { PiggyBank, ArrowRight, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  budgets: Budget[];
  month: string;
}

export const BudgetProgressWidget: React.FC<Props> = ({ budgets, month }) => {
  const { formatCurrency } = useAuth();

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#0e1526]/80 backdrop-blur-sm border border-slate-800/80 flex flex-col justify-between">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <PiggyBank className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Budget Utilization</h3>
            <p className="text-[11px] text-slate-400">Category limits for {month}</p>
          </div>
        </div>
        <Link
          to="/budgets"
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
        >
          <span>Manage</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {budgets.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">
          No active budgets set for {month}. Create a budget to track spending limits.
        </div>
      ) : (
        <div className="space-y-3.5">
          {budgets.slice(0, 4).map((b) => {
            const isExceeded = b.status === 'budget_exceeded';
            const isApproaching = b.status === 'approaching_limit';

            let barColor = 'bg-emerald-500';
            if (isExceeded) barColor = 'bg-rose-500';
            else if (isApproaching) barColor = 'bg-amber-500';

            return (
              <div key={b.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-200">{b.category_name}</span>
                    {isExceeded && (
                      <span className="flex items-center gap-0.5 text-[10px] text-rose-400 font-bold">
                        <AlertTriangle className="w-3 h-3" /> Exceeded
                      </span>
                    )}
                  </div>
                  <div className="text-slate-400">
                    <span className="font-semibold text-white">{formatCurrency(b.actual_spent)}</span>
                    <span className="text-[11px]"> / {formatCurrency(b.amount)}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full rounded-full bg-slate-800/80 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.min(100, b.utilization_percentage)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>{b.utilization_percentage}% utilized</span>
                  <span>
                    {b.remaining_budget >= 0
                      ? `${formatCurrency(b.remaining_budget)} left`
                      : `${formatCurrency(Math.abs(b.remaining_budget))} over`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
