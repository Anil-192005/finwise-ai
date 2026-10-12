import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Budget, Category } from '../types';
import { BudgetModal } from '../components/budgets/BudgetModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import {
  PiggyBank,
  Plus,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Edit2,
  Trash2,
  ArrowRight
} from 'lucide-react';

export const BudgetsPage: React.FC = () => {
  const { formatCurrency } = useAuth();
  const { success, error } = useToast();

  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchBudgets = useCallback(async () => {
    setIsLoading(true);
    try {
      const [budgetsData, catsData] = await Promise.all([
        api.getBudgets(selectedMonth),
        api.getCategories('expense'),
      ]);
      setBudgets(budgetsData);
      setCategories(catsData);
    } catch (err: any) {
      error(err.message || 'Failed to load budgets');
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await api.deleteBudget(deletingId);
      success('Budget removed');
      setDeletingId(null);
      fetchBudgets();
    } catch (err: any) {
      error(err.message || 'Failed to delete budget');
    }
  };

  const totalAllocated = budgets.reduce((acc, b) => acc + b.amount, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.actual_spent, 0);
  const overallUtilization = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Monthly Budgets</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure category-wise spending limits and prevent overspending
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#0d1322] border border-slate-800 px-3 py-1.5 rounded-xl">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs text-white font-semibold focus:outline-none"
            />
          </div>

          <button
            onClick={() => {
              setEditingBudget(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Budget</span>
          </button>
        </div>
      </div>

      {/* Aggregate Budget Summary Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0d162d] via-[#101b35] to-[#0c1426] border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
            {selectedMonth} Aggregate Envelope
          </span>
          <h3 className="text-2xl font-black text-white mt-1">
            {formatCurrency(totalSpent)} <span className="text-sm font-normal text-slate-400">spent of {formatCurrency(totalAllocated)}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {totalAllocated > totalSpent
              ? `You have ${formatCurrency(totalAllocated - totalSpent)} left across all budgeted categories.`
              : `Total spending exceeds allocation by ${formatCurrency(totalSpent - totalAllocated)}.`}
          </p>
        </div>

        <div className="w-full md:w-64 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-300">Overall Utilization</span>
            <span className={overallUtilization >= 100 ? 'text-rose-400' : overallUtilization >= 75 ? 'text-amber-400' : 'text-emerald-400'}>
              {overallUtilization}%
            </span>
          </div>
          <div className="h-3 rounded-full bg-slate-900 border border-slate-700/60 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallUtilization >= 100 ? 'bg-rose-500' : overallUtilization >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, overallUtilization)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Budget Category Cards Grid */}
      {isLoading ? (
        <LoadingSpinner message="Calculating budget utilization..." />
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title={`No budgets defined for ${selectedMonth}`}
          description="Establish monthly spending thresholds for groceries, dining, utilities, or entertainment to stay on track."
          actionText="Set First Budget"
          onAction={() => {
            setEditingBudget(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {budgets.map((b) => {
            const isExceeded = b.status === 'budget_exceeded';
            const isApproaching = b.status === 'approaching_limit';

            let cardBorder = 'border-slate-800/80';
            let statusBadge = (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Within Budget
              </span>
            );

            if (isExceeded) {
              cardBorder = 'border-rose-500/40 shadow-rose-950/20';
              statusBadge = (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Limit Exceeded
                </span>
              );
            } else if (isApproaching) {
              cardBorder = 'border-amber-500/40 shadow-amber-950/20';
              statusBadge = (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Nearing Limit
                </span>
              );
            }

            return (
              <div
                key={b.id}
                className={`p-5 rounded-2xl bg-[#0e1526]/80 backdrop-blur-sm border ${cardBorder} flex flex-col justify-between space-y-4 shadow-lg hover:shadow-xl transition-all group`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                        {b.category_name}
                      </h4>
                      <p className="text-[11px] text-slate-400">Budget for {b.budget_month}</p>
                    </div>
                    {statusBadge}
                  </div>

                  {/* Amounts */}
                  <div className="mt-4 flex items-baseline justify-between text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400">Spent: </span>
                      <span className="font-bold text-white text-base">{formatCurrency(b.actual_spent)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400">Cap: </span>
                      <span className="font-semibold text-slate-300">{formatCurrency(b.amount)}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-2.5 h-2.5 w-full rounded-full bg-slate-800/80 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isExceeded ? 'bg-rose-500' : isApproaching ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, b.utilization_percentage)}%` }}
                    />
                  </div>

                  {/* Footer details */}
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span>{b.utilization_percentage}% utilized</span>
                    <span>
                      {b.remaining_budget >= 0
                        ? `${formatCurrency(b.remaining_budget)} remaining`
                        : `${formatCurrency(Math.abs(b.remaining_budget))} over limit`}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setEditingBudget(b);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Edit Budget"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingId(b.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete Budget"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBudget(null);
        }}
        onSuccess={fetchBudgets}
        budgetToEdit={editingBudget}
        categories={categories}
        currentMonth={selectedMonth}
      />

      {/* Confirm Delete */}
      <ConfirmModal
        isOpen={deletingId !== null}
        title="Remove Budget"
        message="Are you sure you want to remove this budget envelope? Transactions within this category will remain intact."
        confirmText="Remove Budget"
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};
