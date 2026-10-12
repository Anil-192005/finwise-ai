import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MonthlyForecastResponse, CategoryForecastResponse } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import {
  TrendingUp,
  AlertCircle,
  ShieldAlert,
  HelpCircle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Area
} from 'recharts';

export const ForecastingPage: React.FC = () => {
  const { formatCurrency } = useAuth();
  const { error } = useToast();

  const [monthlyForecast, setMonthlyForecast] = useState<MonthlyForecastResponse | null>(null);
  const [categoryForecast, setCategoryForecast] = useState<CategoryForecastResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchForecasts = useCallback(async () => {
    setIsLoading(true);
    try {
      const [mRes, cRes] = await Promise.all([
        api.getMonthlyForecast(),
        api.getCategoryForecast(),
      ]);
      setMonthlyForecast(mRes);
      setCategoryForecast(cRes);
    } catch (err: any) {
      error(err.message || 'Failed to load expense forecast');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchForecasts();
  }, [fetchForecasts]);

  if (isLoading) {
    return <LoadingSpinner message="Calculating time-series regression & category trends..." />;
  }

  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f172a] border border-slate-700/80 p-3 rounded-xl shadow-xl text-xs space-y-1">
          <p className="font-bold text-white mb-1.5">{label}</p>
          {payload.map((entry: any, index: number) => {
            if (entry.value === null || entry.value === undefined) return null;
            return (
              <p key={index} style={{ color: entry.color }} className="font-medium">
                {entry.name}: {formatCurrency(entry.value)}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-white">Expense Forecasting & Budget Risk</h2>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Machine Learning
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Hybrid rolling-average and linear regression projection for upcoming monthly expenses
        </p>
      </div>

      {/* Methodology & Assumption Notice */}
      <div className="p-4 rounded-2xl bg-[#0d1527] border border-blue-500/30 flex items-start gap-3 text-xs">
        <HelpCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-slate-300 leading-relaxed">
          <p>
            <strong>Statistical Modeling:</strong> Predictions combine a 3-month rolling mean with ordinary least squares (OLS) linear trend regression.
          </p>
          <p className="text-[11px] text-slate-400">
            <em>Disclaimer:</em> Estimates are data-driven projections and do not constitute a spending guarantee. Actual expenses may vary based on discretionary lifestyle choices or unexpected events.
          </p>
        </div>
      </div>

      {!monthlyForecast?.has_sufficient_data ? (
        <EmptyState
          icon={TrendingUp}
          title="Insufficient transaction history for forecasting"
          description={monthlyForecast?.explanation || "At least 2 distinct months of expense records are required to calculate trend lines."}
        />
      ) : (
        <>
          {/* Main Forecast Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0c1834] via-[#0f1d3e] to-[#0a1224] border border-blue-500/30 shadow-xl flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                  Next Month Projected Outflow
                </span>
                <h3 className="text-3xl font-black text-white mt-1">
                  {formatCurrency(monthlyForecast.forecasted_next_month || 0)}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  80% Confidence Interval: <br />
                  <span className="text-slate-200 font-semibold">
                    {formatCurrency(monthlyForecast.lower_bound || 0)} – {formatCurrency(monthlyForecast.upper_bound || 0)}
                  </span>
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Model Confidence:</span>
                <span className="font-bold text-emerald-400">
                  {Math.round((monthlyForecast.confidence_score || 0.8) * 100)}%
                </span>
              </div>
            </div>

            {/* Budget Risk Card */}
            {monthlyForecast.budget_comparison ? (
              <div
                className={`p-6 rounded-2xl border shadow-xl flex flex-col justify-between ${
                  monthlyForecast.budget_comparison.projected_over_budget
                    ? 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                    : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                }`}
              >
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Budget Health Projection
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    {monthlyForecast.budget_comparison.projected_over_budget ? (
                      <ShieldAlert className="w-6 h-6 text-rose-400" />
                    ) : (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    )}
                    <h3 className="text-xl font-bold text-white">
                      {monthlyForecast.budget_comparison.projected_over_budget
                        ? 'Projected Over-Budget'
                        : 'Within Projected Cap'}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    Forecasted spending is {monthlyForecast.budget_comparison.projected_utilization}% of your assigned {formatCurrency(monthlyForecast.budget_comparison.total_budget)} budget.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 text-xs">
                  {monthlyForecast.budget_comparison.projected_over_budget ? (
                    <span className="text-rose-400 font-semibold">
                      +{formatCurrency(monthlyForecast.budget_comparison.projected_variance)} estimated deficit
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-semibold">
                      {formatCurrency(Math.abs(monthlyForecast.budget_comparison.projected_variance))} estimated surplus
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-[#0e1526]/80 border border-slate-800 shadow-xl flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Budget Health Projection
                  </span>
                  <h3 className="text-base font-bold text-white mt-2">No Active Budget Cap</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Set a monthly budget on the Budgets page to evaluate future spending risk.
                  </p>
                </div>
              </div>
            )}

            {/* Model Summary Narrative */}
            <div className="p-6 rounded-2xl bg-[#0e1526]/80 border border-slate-800 shadow-xl flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Data Synthesis
                </span>
                <p className="text-xs text-slate-300 leading-relaxed mt-2">
                  {monthlyForecast.explanation}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Data points analyzed:</span>
                <span className="font-semibold text-white">{monthlyForecast.data_points_count} Months</span>
              </div>
            </div>
          </div>

          {/* Time Series Forecast Chart */}
          <div className="p-6 rounded-2xl bg-[#0e1526]/80 border border-slate-800 shadow-xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">Historical Spending & Forecast Trajectory</h3>
              <p className="text-[11px] text-slate-400">Actual expenses plotted against statistical projection</p>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyForecast.history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 15, fontSize: '11px' }} />
                  <Bar dataKey="actual" name="Historical Actual" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Line type="monotone" dataKey="forecast" name="Projected Forecast" stroke="#f43f5e" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 6, fill: '#f43f5e' }} />
                  <Line type="monotone" dataKey="upper_bound" name="Upper 80% Bound" stroke="#fb7185" strokeWidth={1} strokeDasharray="2 2" dot={false} />
                  <Line type="monotone" dataKey="lower_bound" name="Lower 80% Bound" stroke="#fb7185" strokeWidth={1} strokeDasharray="2 2" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category-Level Risk Analysis Table */}
          {categoryForecast && categoryForecast.categories.length > 0 && (
            <div className="rounded-2xl bg-[#0e1526]/80 border border-slate-800 shadow-xl overflow-hidden">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Category-Wise Spending Projections & Risk</h3>
                  <p className="text-[11px] text-slate-400">Estimated outflow based on momentum and historical averages</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-right">Historical Average</th>
                      <th className="py-3 px-4 text-right">Projected Outflow</th>
                      <th className="py-3 px-4 text-right">Assigned Budget</th>
                      <th className="py-3 px-4 text-right">Projected Utilization</th>
                      <th className="py-3 px-4 text-right">Risk Assessment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {categoryForecast.categories.map((c, i) => {
                      const isHigh = c.risk_level === 'high';
                      const isMod = c.risk_level === 'moderate';

                      return (
                        <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 font-semibold text-white">{c.category_name}</td>
                          <td className="py-3 px-4 text-right text-slate-300">{formatCurrency(c.historical_average)}</td>
                          <td className="py-3 px-4 text-right font-bold text-white">{formatCurrency(c.forecasted_amount)}</td>
                          <td className="py-3 px-4 text-right text-slate-400">
                            {c.current_budget ? formatCurrency(c.current_budget) : 'None'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {c.projected_utilization ? `${c.projected_utilization}%` : 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isHigh
                                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                  : isMod
                                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {c.risk_level.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
