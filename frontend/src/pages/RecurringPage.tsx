import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { RecurringTransaction, Category } from '../types';
import { RecurringModal } from '../components/recurring/RecurringModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import {
  Repeat,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  Play,
  Edit2,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';

export const RecurringPage: React.FC = () => {
  const { formatCurrency } = useAuth();
  const { success, error } = useToast();

  const [items, setItems] = useState<RecurringTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [recs, cats] = await Promise.all([
        api.getRecurringTransactions(),
        api.getCategories(),
      ]);
      setItems(recs);
      setCategories(cats);
    } catch (err: any) {
      error(err.message || 'Failed to load recurring schedules');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await api.deleteRecurringTransaction(deletingId);
      success('Schedule removed');
      setDeletingId(null);
      fetchData();
    } catch (err: any) {
      error(err.message || 'Failed to delete schedule');
    }
  };

  const handleProcess = async (id: number, title: string) => {
    try {
      await api.processRecurringTransaction(id);
      success(`Transaction recorded for "${title}" & next date advanced.`);
      fetchData();
    } catch (err: any) {
      error(err.message || 'Failed to process recurring transaction');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Recurring Schedules & Subscriptions</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage templates for rent, salaries, utilities, and subscriptions with one-click processing
          </p>
        </div>

        <button
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Schedule</span>
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Loading recurring schedules..." />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No recurring templates created"
          description="Schedule rent, salary credits, internet bills, or Netflix subscriptions to avoid manual entry each cycle."
          actionText="Create Recurring Template"
          onAction={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => {
            const isIncome = item.transaction_type === 'income';

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-[#0e1526]/80 backdrop-blur-sm border border-slate-800/80 shadow-lg hover:border-blue-500/30 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                          isIncome
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        }`}
                      >
                        {isIncome ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{item.title}</h4>
                        <p className="text-[11px] text-slate-400">{item.category_name || 'General'}</p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                      {item.recurrence_frequency}
                    </span>
                  </div>

                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Amount</span>
                      <p className={`text-xl font-black ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatCurrency(item.amount)}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Next Due Date</span>
                      <p className="text-xs font-mono font-semibold text-white flex items-center gap-1 justify-end mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-400" />
                        {item.next_scheduled_date}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => handleProcess(item.id, item.title)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/30 transition-all flex items-center gap-1.5"
                  >
                    <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                    <span>Confirm & Record</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Edit Schedule"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingId(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Schedule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recurring Modal */}
      <RecurringModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSuccess={fetchData}
        itemToEdit={editingItem}
        categories={categories}
      />

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={deletingId !== null}
        title="Delete Recurring Schedule"
        message="Are you sure you want to delete this schedule? Previously confirmed transactions will remain unaffected."
        confirmText="Delete Schedule"
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};
