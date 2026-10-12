import React, { useState, useEffect } from 'react';
import { Category, RecurringTransaction } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { X, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  itemToEdit?: RecurringTransaction | null;
  categories: Category[];
}

export const RecurringModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  itemToEdit,
  categories,
}) => {
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    transaction_type: 'expense' as 'income' | 'expense',
    category_id: '',
    recurrence_frequency: 'monthly' as 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    next_scheduled_date: new Date().toISOString().split('T')[0],
    is_active: true,
  });

  useEffect(() => {
    if (itemToEdit) {
      setFormData({
        title: itemToEdit.title,
        amount: String(itemToEdit.amount),
        transaction_type: itemToEdit.transaction_type,
        category_id: String(itemToEdit.category_id),
        recurrence_frequency: itemToEdit.recurrence_frequency,
        start_date: itemToEdit.start_date,
        end_date: itemToEdit.end_date || '',
        next_scheduled_date: itemToEdit.next_scheduled_date,
        is_active: itemToEdit.is_active,
      });
    } else {
      setFormData({
        title: '',
        amount: '',
        transaction_type: 'expense',
        category_id: '',
        recurrence_frequency: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        next_scheduled_date: new Date().toISOString().split('T')[0],
        is_active: true,
      });
    }
  }, [itemToEdit, isOpen]);

  const filteredCategories = categories.filter((c) => c.transaction_type === formData.transaction_type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      error('Title is required');
      return;
    }
    const numAmt = parseFloat(formData.amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      error('Amount must be greater than zero');
      return;
    }
    if (!formData.category_id) {
      error('Please choose a category');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        amount: numAmt,
        transaction_type: formData.transaction_type,
        category_id: parseInt(formData.category_id, 10),
        recurrence_frequency: formData.recurrence_frequency,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        next_scheduled_date: formData.next_scheduled_date,
        is_active: formData.is_active,
      };

      if (itemToEdit) {
        await api.updateRecurringTransaction(itemToEdit.id, payload);
        success('Recurring transaction updated');
      } else {
        await api.createRecurringTransaction(payload);
        success('Recurring schedule created');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to save recurring transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-[#0f172a] border border-slate-700/80 p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">
              {itemToEdit ? 'Edit Recurring Schedule' : 'New Recurring Schedule'}
            </h3>
            <p className="text-xs text-slate-400">Automate reminders for rent, bills, or salary</p>
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
            <label className="block text-slate-300 font-medium mb-1.5">Schedule Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Monthly Apartment Rent, Netflix Subscription"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Type</label>
              <select
                value={formData.transaction_type}
                onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value as any, category_id: '' })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Category</label>
              <select
                required
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Amount</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Frequency</label>
              <select
                value={formData.recurrence_frequency}
                onChange={(e) => setFormData({ ...formData, recurrence_frequency: e.target.value as any })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Start Date</label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Next Scheduled Date</label>
              <input
                type="date"
                required
                value={formData.next_scheduled_date}
                onChange={(e) => setFormData({ ...formData, next_scheduled_date: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
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
              <span>Save Schedule</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
