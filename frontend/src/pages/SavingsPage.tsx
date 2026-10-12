import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SavingsGoal } from '../types';
import { SavingsGoalModal } from '../components/savings/SavingsGoalModal';
import { ContributionModal } from '../components/savings/ContributionModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import {
  Target,
  Plus,
  PiggyBank,
  CheckCircle2,
  Clock,
  Calendar,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const SavingsPage: React.FC = () => {
  const { formatCurrency } = useAuth();
  const { success, error } = useToast();

  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedGoalId, setExpandedGoalId] = useState<number | null>(null);

  // Modals
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [isContribModalOpen, setIsContribModalOpen] = useState(false);
  const [selectedGoalForContrib, setSelectedGoalForContrib] = useState<SavingsGoal | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchGoals = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getSavingsGoals();
      setGoals(data);
    } catch (err: any) {
      error(err.message || 'Failed to load savings goals');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await api.deleteSavingsGoal(deletingId);
      success('Savings goal deleted');
      setDeletingId(null);
      fetchGoals();
    } catch (err: any) {
      error(err.message || 'Failed to delete goal');
    }
  };

  const totalSavedAcrossGoals = goals.reduce((acc, g) => acc + g.current_saved, 0);
  const totalTargetAcrossGoals = goals.reduce((acc, g) => acc + g.target_amount, 0);
  const aggregateProgress = totalTargetAcrossGoals > 0 ? Math.round((totalSavedAcrossGoals / totalTargetAcrossGoals) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Savings Goals & Envelopes</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Set milestone targets, record dedicated contributions, and track projected completion dates
          </p>
        </div>

        <button
          onClick={() => {
            setEditingGoal(null);
            setIsGoalModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Savings Goal</span>
        </button>
      </div>

      {/* Aggregate Overview Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0c1f1f] via-[#0f2420] to-[#0a1816] border border-emerald-500/20 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
            Total Accumulated Savings
          </span>
          <h3 className="text-2xl font-black text-white mt-1">
            {formatCurrency(totalSavedAcrossGoals)}{' '}
            <span className="text-sm font-normal text-slate-400">of {formatCurrency(totalTargetAcrossGoals)}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            You have {goals.filter((g) => g.status === 'completed').length} completed goals and {goals.filter((g) => g.status === 'active').length} active targets.
          </p>
        </div>

        <div className="w-full md:w-64 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-300">Overall Progress</span>
            <span className="text-emerald-400">{aggregateProgress}%</span>
          </div>
          <div className="h-3 rounded-full bg-slate-900 border border-slate-700/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${Math.min(100, aggregateProgress)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      {isLoading ? (
        <LoadingSpinner message="Loading savings milestones..." />
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No savings goals established yet"
          description="Create savings targets for an emergency fund, tuition, a new laptop, or travel to begin tracking."
          actionText="Create Savings Goal"
          onAction={() => {
            setEditingGoal(null);
            setIsGoalModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {goals.map((goal) => {
            const isCompleted = goal.status === 'completed';
            const isExpanded = expandedGoalId === goal.id;

            return (
              <div
                key={goal.id}
                className="p-6 rounded-2xl bg-[#0e1526]/80 backdrop-blur-sm border border-slate-800/80 shadow-lg hover:border-emerald-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-white">{goal.name}</h4>
                        {isCompleted && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Completed
                          </span>
                        )}
                      </div>
                      {goal.target_date && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>Target date: {goal.target_date}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingGoal(goal);
                          setIsGoalModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Edit Goal"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(goal.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Saved vs Target */}
                  <div className="mt-4 flex items-baseline justify-between text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400">Saved: </span>
                      <span className="font-bold text-emerald-400 text-lg">{formatCurrency(goal.current_saved)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400">Target: </span>
                      <span className="font-semibold text-white">{formatCurrency(goal.target_amount)}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-2.5 h-3 w-full rounded-full bg-slate-800/80 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                      style={{ width: `${Math.min(100, goal.progress_percentage)}%` }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{goal.progress_percentage}% achieved</span>
                    <span>{formatCurrency(goal.remaining_target)} remaining</span>
                  </div>

                  {/* Estimated completion pacing */}
                  {goal.estimated_completion_date && !isCompleted && (
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>
                        Projected completion by <strong className="text-white">{goal.estimated_completion_date}</strong> based on historical contribution velocity.
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Actions & Expand Contributions */}
                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => setExpandedGoalId(isExpanded ? null : goal.id)}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5"
                  >
                    <span>{goal.contributions.length} Contributions</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {!isCompleted && (
                    <button
                      onClick={() => {
                        setSelectedGoalForContrib(goal);
                        setIsContribModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 transition-all flex items-center gap-1.5"
                    >
                      <PiggyBank className="w-3.5 h-3.5" />
                      <span>Add Contribution</span>
                    </button>
                  )}
                </div>

                {/* Expanded Contribution History */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-800 space-y-2 animate-in fade-in duration-200">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Deposit History
                    </p>
                    {goal.contributions.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No contributions logged yet.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {goal.contributions.map((c) => (
                          <div
                            key={c.id}
                            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                          >
                            <div>
                              <p className="font-semibold text-white">{formatCurrency(c.amount)}</p>
                              <p className="text-[10px] text-slate-400">{c.description || 'Manual contribution'}</p>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">{c.contribution_date}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <SavingsGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setEditingGoal(null);
        }}
        onSuccess={fetchGoals}
        goalToEdit={editingGoal}
      />

      <ContributionModal
        isOpen={isContribModalOpen}
        onClose={() => {
          setIsContribModalOpen(false);
          setSelectedGoalForContrib(null);
        }}
        onSuccess={fetchGoals}
        goal={selectedGoalForContrib}
      />

      <ConfirmModal
        isOpen={deletingId !== null}
        title="Delete Savings Goal"
        message="Are you sure you want to remove this goal and its recorded contribution history?"
        confirmText="Delete Goal"
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};
