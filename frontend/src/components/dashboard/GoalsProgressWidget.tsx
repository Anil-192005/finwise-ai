import React from 'react';
import { SavingsGoal } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Target, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  goals: SavingsGoal[];
}

export const GoalsProgressWidget: React.FC<Props> = ({ goals }) => {
  const { formatCurrency } = useAuth();

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#0e1526]/80 backdrop-blur-sm border border-slate-800/80 flex flex-col justify-between">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Savings Envelopes</h3>
            <p className="text-[11px] text-slate-400">Target milestones</p>
          </div>
        </div>
        <Link
          to="/savings"
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
        >
          <span>All Goals</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {goals.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">
          No savings goals created yet. Set a financial milestone to track progress.
        </div>
      ) : (
        <div className="space-y-3.5">
          {goals.slice(0, 3).map((g) => {
            const isCompleted = g.progress_percentage >= 100;
            return (
              <div key={g.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-medium text-slate-200 truncate">
                    <span>{g.name}</span>
                    {isCompleted && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                  </div>
                  <div className="text-slate-400 shrink-0">
                    <span className="font-semibold text-white">{formatCurrency(g.current_saved)}</span>
                    <span className="text-[11px]"> / {formatCurrency(g.target_amount)}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full rounded-full bg-slate-800/80 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, g.progress_percentage)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>{g.progress_percentage}% completed</span>
                  <span>{formatCurrency(g.remaining_target)} remaining</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
