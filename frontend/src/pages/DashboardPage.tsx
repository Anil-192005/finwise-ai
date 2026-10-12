import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  DashboardSummary,
  IncomeExpenseTrend,
  CategoryBreakdown,
  Transaction,
  Budget,
  SavingsGoal,
  Category,
  InsightItem
} from '../types';
import { StatCard } from '../components/common/StatCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { IncomeExpenseChart } from '../components/dashboard/IncomeExpenseChart';
import { ExpenseDonutChart } from '../components/dashboard/ExpenseDonutChart';
import { RecentTransactionsList } from '../components/dashboard/RecentTransactionsList';
import { BudgetProgressWidget } from '../components/dashboard/BudgetProgressWidget';
import { AIInsightsWidget } from '../components/dashboard/AIInsightsWidget';
import { GoalsProgressWidget } from '../components/dashboard/GoalsProgressWidget';
import { TransactionModal } from '../components/transactions/TransactionModal';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  PiggyBank,
  Percent,
  Plus,
  Calendar,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { formatCurrency } = useAuth();
  const currentMonthStr = new Date().toISOString().substring(0, 7);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [trendView, setTrendView] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<IncomeExpenseTrend[]>([]);
  const [breakdown, setBreakdown] = useState<CategoryBreakdown[]>([]);
  const [recentTx, setRecentTx] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [aiSummary, setAiSummary] = useState<string>('');

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        summaryRes,
        trendsRes,
        breakdownRes,
        recentTxRes,
        budgetsRes,
        goalsRes,
        catsRes,
        insightsRes,
      ] = await Promise.all([
        api.getDashboardSummary(selectedMonth),
        api.getIncomeExpenseTrends(trendView, 6),
        api.getCategoryBreakdown(selectedMonth, 'expense'),
        api.getRecentTransactions(5),
        api.getBudgets(selectedMonth),
        api.getSavingsGoals(),
        api.getCategories(),
        api.getInsights(selectedMonth),
      ]);

      setSummary(summaryRes);
      setTrends(trendsRes);
      setBreakdown(breakdownRes);
      setRecentTx(recentTxRes);
      setBudgets(budgetsRes);
      setGoals(goalsRes);
      setCategories(catsRes);
      setInsights(insightsRes.insights);
      setAiSummary(insightsRes.monthly_summary);
    } catch (err) {
      console.error('Error fetching dashboard records:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, trendView]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (isLoading && !summary) {
    return <LoadingSpinner message="Calculating financial metrics & insights..." />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Month Filter & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0d1322] p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Selected Statement Period</span>
            <div className="flex items-center gap-2 mt-0.5">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-semibold focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={loadDashboardData}
                title="Refresh metrics"
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2 hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Record Transaction</span>
          </button>
        </div>
      </div>

      {/* Cash Flow Balance Notice */}
      <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center gap-2.5 text-[11px] text-slate-400">
        <AlertCircle className="w-4 h-4 text-blue-400 shrink-0" />
        <span>
          <strong>Cash Flow Accounting:</strong> The remaining balance represents calculated net cash flow (Total Income minus Expenses) for {selectedMonth}. Manually recorded savings contributions are isolated to prevent double-counting.
        </span>
      </div>

      {/* 6 Summary Stat Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="Total Income"
            value={formatCurrency(summary.total_income)}
            icon={ArrowDownLeft}
            accentColor="emerald"
            badge={{ text: 'Credits', variant: 'positive' }}
            subtitle={`Inflow for ${selectedMonth}`}
          />
          <StatCard
            title="Total Expenses"
            value={formatCurrency(summary.total_expenses)}
            icon={ArrowUpRight}
            accentColor="rose"
            badge={{ text: 'Debits', variant: 'negative' }}
            subtitle={`Outflow for ${selectedMonth}`}
          />
          <StatCard
            title="Net Cash Flow"
            value={formatCurrency(summary.remaining_balance)}
            icon={Wallet}
            accentColor={summary.remaining_balance >= 0 ? 'blue' : 'rose'}
            badge={{
              text: summary.remaining_balance >= 0 ? 'Surplus' : 'Deficit',
              variant: summary.remaining_balance >= 0 ? 'positive' : 'negative',
            }}
            subtitle="Income minus expenses"
          />
          <StatCard
            title="Total Savings"
            value={formatCurrency(summary.total_savings)}
            icon={PiggyBank}
            accentColor="indigo"
            badge={{ text: 'Allocated', variant: 'neutral' }}
            subtitle="Goal contributions"
          />
          <StatCard
            title="Budget Usage"
            value={`${summary.budget_utilization}%`}
            icon={Percent}
            accentColor={summary.budget_utilization >= 100 ? 'rose' : summary.budget_utilization >= 75 ? 'amber' : 'emerald'}
            badge={{
              text: summary.budget_utilization >= 100 ? 'Exceeded' : summary.budget_utilization >= 75 ? 'Warning' : 'Healthy',
              variant: summary.budget_utilization >= 100 ? 'negative' : summary.budget_utilization >= 75 ? 'warning' : 'positive',
            }}
            subtitle={summary.total_budget > 0 ? `of ${formatCurrency(summary.total_budget)}` : 'No limits set'}
          />
          <StatCard
            title="Savings Rate"
            value={`${summary.savings_rate}%`}
            icon={Percent}
            accentColor={summary.savings_rate >= 20 ? 'emerald' : summary.savings_rate > 0 ? 'blue' : 'amber'}
            badge={{
              text: summary.savings_rate >= 20 ? 'Strong' : 'Moderate',
              variant: summary.savings_rate >= 20 ? 'positive' : 'neutral',
            }}
            subtitle="Of positive income"
          />
        </div>
      )}

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <IncomeExpenseChart
            trends={trends}
            view={trendView}
            onViewChange={(v) => setTrendView(v)}
          />
        </div>
        <div className="lg:col-span-1">
          <ExpenseDonutChart breakdown={breakdown} month={selectedMonth} />
        </div>
      </div>

      {/* Intelligence & Widgets Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AIInsightsWidget insights={insights} summary={aiSummary} />
        <BudgetProgressWidget budgets={budgets} month={selectedMonth} />
        <GoalsProgressWidget goals={goals} />
      </div>

      {/* Recent Transactions Section */}
      <RecentTransactionsList transactions={recentTx} />

      {/* Add Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadDashboardData}
        categories={categories}
      />
    </div>
  );
};
