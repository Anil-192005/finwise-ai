import React from 'react';
import { Transaction } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ArrowUpRight, ArrowDownLeft, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  transactions: Transaction[];
}

export const RecentTransactionsList: React.FC<Props> = ({ transactions }) => {
  const { formatCurrency } = useAuth();

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#0e1526]/80 backdrop-blur-sm border border-slate-800/80 flex flex-col justify-between">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Recent Transactions</h3>
            <p className="text-[11px] text-slate-400">Latest recorded income & expenses</p>
          </div>
        </div>
        <Link
          to="/transactions"
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">
          No transactions yet. Click "Add Transaction" to start tracking.
        </div>
      ) : (
        <div className="divide-y divide-slate-800/80">
          {transactions.map((tx) => {
            const isIncome = tx.transaction_type === 'income';
            return (
              <div key={tx.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      isIncome
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    }`}
                  >
                    {isIncome ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{tx.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span>{tx.category_name || 'General'}</span>
                      <span>•</span>
                      <span>{tx.transaction_date}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className={`text-xs font-bold ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{tx.payment_method}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
