import React, { useState, useEffect } from 'react';
import { Category, Budget } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { X, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  budgetToEdit?: Budget | null;
  categories: Category[];
  currentMonth: string;
}

export const BudgetModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  budgetToEdit,
  categories,
  currentMonth,
}) => {
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [budgetMonth, setBudgetMonth] = useState(currentMonth);

  useEffect(() => {
    if (budgetToEdit) {
      setAmount(String(budgetToEdit.amount));
      setCategoryId(budgetToEdit.category_id ? String(budgetToEdit.category_id) : '');
      setBudgetMonth(budgetToEdit.budget_month);
    } else {
      setAmount('');
      setCategoryId('');
      setBudgetMonth(currentMonth);
    }
  }, [budgetToEdit, isOpen, currentMonth]);

  const expenseCategories = categories.filter((c) => c.transaction_type === 'expense');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      error('Please enter a valid budget amount');
      return;
    }

    setIsSubmitting(true);
    try {
      if (budgetToEdit) {
        await api.updateBudget(budgetToEdit.id, numAmount);
        success('Budget limit updated');
      } else {
        await api.createBudget({
          category_id: categoryId ? parseInt(categoryId, 10) : null,
          amount: numAmount,
          budget_month: budgetMonth,
        });
        success('Budget envelope created');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to save budget');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-[#0f172a] border border-slate-700/80 p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">
              {budgetToEdit ? 'Adjust Budget Limit' : 'Set Monthly Budget'}
            </h3>
            <p className="text-xs text-slate-400">Allocate spending guardrails per category</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Target Month</label>
            <input
              type="month"
              required
              disabled={!!budgetToEdit}
              value={budgetMonth}
              onChange={(e) => setBudgetMonth(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Expense Category</label>
            <select
              disabled={!!budgetToEdit}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
            >
              <option value="">Overall Monthly Budget (Total Expenses)</option>
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              Budget Limit Amount <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="e.g. 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{budgetToEdit ? 'Update Limit' : 'Save Budget'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
