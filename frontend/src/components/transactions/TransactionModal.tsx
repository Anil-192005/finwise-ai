import React, { useState, useEffect } from 'react';
import { Category, Transaction } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { X, Sparkles, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transactionToEdit?: Transaction | null;
  categories: Category[];
}

export const TransactionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  transactionToEdit,
  categories,
}) => {
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<{ name: string; id?: number | null; confidence: number } | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    transaction_type: 'expense' as 'income' | 'expense',
    category_id: '',
    transaction_date: new Date().toISOString().split('T')[0],
    payment_method: 'UPI',
    tags: '',
  });

  useEffect(() => {
    if (transactionToEdit) {
      setFormData({
        title: transactionToEdit.title,
        description: transactionToEdit.description || '',
        amount: String(transactionToEdit.amount),
        transaction_type: transactionToEdit.transaction_type,
        category_id: String(transactionToEdit.category_id),
        transaction_date: transactionToEdit.transaction_date,
        payment_method: transactionToEdit.payment_method,
        tags: transactionToEdit.tags || '',
      });
      setSuggestion(null);
    } else {
      setFormData({
        title: '',
        description: '',
        amount: '',
        transaction_type: 'expense',
        category_id: '',
        transaction_date: new Date().toISOString().split('T')[0],
        payment_method: 'UPI',
        tags: '',
      });
      setSuggestion(null);
    }
  }, [transactionToEdit, isOpen]);

  // Handle title blur to auto-categorize if in expense mode and category is not selected
  const handleTitleBlur = async () => {
    if (!formData.title || formData.title.length < 3) return;
    if (formData.category_id && transactionToEdit) return;

    try {
      setIsSuggesting(true);
      const res = await api.autoCategorize(formData.title, formData.description);
      if (res && res.category_name) {
        setSuggestion({
          name: res.category_name,
          id: res.category_id,
          confidence: res.confidence_score,
        });

        // If confidence is high, auto set category if empty
        if (res.confidence_score >= 0.7 && res.category_id && !formData.category_id) {
          setFormData((prev) => ({ ...prev, category_id: String(res.category_id) }));
        }
      }
    } catch (err) {
      // Non-blocking
    } finally {
      setIsSuggesting(false);
    }
  };

  const filteredCategories = categories.filter(
    (c) => c.transaction_type === formData.transaction_type
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      error('Transaction title is required');
      return;
    }
    const numAmount = parseFloat(formData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      error('Please enter a valid amount greater than zero');
      return;
    }
    if (!formData.category_id) {
      error('Please select a category');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        amount: numAmount,
        transaction_type: formData.transaction_type,
        category_id: parseInt(formData.category_id, 10),
        transaction_date: formData.transaction_date,
        payment_method: formData.payment_method,
        tags: formData.tags.trim() || null,
      };

      if (transactionToEdit) {
        await api.updateTransaction(transactionToEdit.id, payload);
        success('Transaction updated successfully');
      } else {
        await api.createTransaction(payload);
        success('Transaction added successfully');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-[#0f172a] border border-slate-700/80 p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">
              {transactionToEdit ? 'Edit Transaction' : 'Record Transaction'}
            </h3>
            <p className="text-xs text-slate-400">
              {transactionToEdit ? 'Update details of your financial entry' : 'Log a new income or expense transaction'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* Type Selector */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Transaction Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, transaction_type: 'expense', category_id: '' });
                  setSuggestion(null);
                }}
                className={`py-2 px-3 rounded-xl font-semibold transition-all border ${
                  formData.transaction_type === 'expense'
                    ? 'bg-rose-500/15 border-rose-500/50 text-rose-400 shadow-sm'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, transaction_type: 'income', category_id: '' });
                  setSuggestion(null);
                }}
                className={`py-2 px-3 rounded-xl font-semibold transition-all border ${
                  formData.transaction_type === 'income'
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 shadow-sm'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                Income
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              Title / Payee <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                onBlur={handleTitleBlur}
                placeholder="e.g. Swiggy food delivery, Monthly Salary, Uber ride"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {isSuggesting && (
                <div className="absolute right-3 top-3">
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                </div>
              )}
            </div>

            {/* AI auto-categorization badge */}
            {suggestion && (
              <div className="mt-2 p-2 rounded-lg bg-blue-950/40 border border-blue-500/30 flex items-center justify-between text-[11px] text-blue-300">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>
                    AI Suggestion: <strong className="text-white">{suggestion.name}</strong> ({Math.round(suggestion.confidence * 100)}% match)
                  </span>
                </div>
                {suggestion.id && formData.category_id !== String(suggestion.id) && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, category_id: String(suggestion.id) })}
                    className="underline hover:text-white font-medium"
                  >
                    Apply
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Amount & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Amount <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Category <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="">Select category</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Payment Method</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="UPI">UPI</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Net Banking">Net Banking</option>
                <option value="Cash">Cash</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Description (Optional)</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add optional notes or itemized breakdown..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Tags (Comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="e.g. food, dinner, weekend"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{transactionToEdit ? 'Save Changes' : 'Record Transaction'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
