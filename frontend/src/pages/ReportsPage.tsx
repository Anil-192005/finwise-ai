import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  FileBarChart2,
  Printer,
  Download,
  Calendar,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const ReportsPage: React.FC = () => {
  const { formatCurrency } = useAuth();
  const { error } = useToast();

  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const currentYear = new Date().getFullYear();

  const [activeTab, setActiveTab] = useState<'monthly' | 'yearly' | 'category'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [yearlyData, setYearlyData] = useState<any>(null);
  const [categoryData, setCategoryData] = useState<any>(null);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'monthly') {
        const res = await api.getMonthlyReport(selectedMonth);
        setMonthlyData(res);
      } else if (activeTab === 'yearly') {
        const res = await api.getYearlyReport(selectedYear);
        setYearlyData(res);
      } else {
        const res = await api.getCategoryReport();
        setCategoryData(res);
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch report');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const params: Record<string, any> = {};
    if (activeTab === 'monthly') {
      const [y, m] = selectedMonth.split('-');
      const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate();
      params.start_date = `${selectedMonth}-01`;
      params.end_date = `${selectedMonth}-${lastDay}`;
    } else if (activeTab === 'yearly') {
      params.start_date = `${selectedYear}-01-01`;
      params.end_date = `${selectedYear}-12-31`;
    }
    const url = api.getExportTransactionsUrl(params);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Financial Reporting & Statements</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit-grade periodic summaries, category allocations, and exportable statements
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs & Period Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0d1322] p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'monthly' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Monthly Summary
          </button>
          <button
            onClick={() => setActiveTab('yearly')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'yearly' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Yearly Trend
          </button>
          <button
            onClick={() => setActiveTab('category')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'category' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Category Totals
          </button>
        </div>

        {activeTab === 'monthly' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Statement Month:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-semibold focus:outline-none"
            />
          </div>
        )}

        {activeTab === 'yearly' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Statement Year:</span>
            <input
              type="number"
              min="2000"
              max="2100"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-semibold focus:outline-none w-24"
            />
          </div>
        )}
      </div>

      {isLoading ? (
        <LoadingSpinner message="Calculating financial statement..." />
      ) : activeTab === 'monthly' && monthlyData ? (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#0e1526]/80 border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Income</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">{formatCurrency(monthlyData.total_income)}</p>
            </div>
            <div className="p-5 rounded-2xl bg-[#0e1526]/80 border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Expenses</span>
              <p className="text-2xl font-black text-rose-400 mt-1">{formatCurrency(monthlyData.total_expenses)}</p>
            </div>
            <div className="p-5 rounded-2xl bg-[#0e1526]/80 border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Net Cash Flow</span>
              <p className={`text-2xl font-black mt-1 ${monthlyData.net_cash_flow >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                {formatCurrency(monthlyData.net_cash_flow)}
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#0e1526]/80 border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Savings Rate</span>
              <p className="text-2xl font-black text-indigo-400 mt-1">{monthlyData.savings_rate}%</p>
            </div>
          </div>

          {/* Category Table */}
          <div className="rounded-2xl bg-[#0e1526]/80 border border-slate-800 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Itemized Category Breakdown for {selectedMonth}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-800 text-[10px] uppercase font-semibold text-slate-400">
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-right">Share of Outflow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {monthlyData.categories.map((c: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-white">{c.category}</td>
                      <td className="py-3 px-4 text-right text-rose-400 font-bold">{formatCurrency(c.amount)}</td>
                      <td className="py-3 px-4 text-right text-slate-300">{c.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'yearly' && yearlyData ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#0e1526]/80 border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Annual Income</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">{formatCurrency(yearlyData.total_income)}</p>
            </div>
            <div className="p-5 rounded-2xl bg-[#0e1526]/80 border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Annual Expenses</span>
              <p className="text-2xl font-black text-rose-400 mt-1">{formatCurrency(yearlyData.total_expenses)}</p>
            </div>
            <div className="p-5 rounded-2xl bg-[#0e1526]/80 border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Annual Net Savings</span>
              <p className="text-2xl font-black text-blue-400 mt-1">{formatCurrency(yearlyData.net_savings)}</p>
            </div>
          </div>

          {/* Yearly Chart */}
          <div className="p-6 rounded-2xl bg-[#0e1526]/80 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white">{selectedYear} Monthly Trajectory</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlyData.months} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : activeTab === 'category' && categoryData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-[#0e1526]/80 border border-slate-800 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-rose-950/20">
              <h3 className="text-sm font-bold text-rose-400">Expense Totals by Category</h3>
            </div>
            <table className="w-full text-left text-xs">
              <tbody className="divide-y divide-slate-800/60">
                {categoryData.expenses.map((e: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-semibold text-white">{e.category}</td>
                    <td className="py-3 px-4 text-slate-400">{e.count} transactions</td>
                    <td className="py-3 px-4 text-right text-rose-400 font-bold">{formatCurrency(e.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl bg-[#0e1526]/80 border border-slate-800 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-emerald-950/20">
              <h3 className="text-sm font-bold text-emerald-400">Income Totals by Category</h3>
            </div>
            <table className="w-full text-left text-xs">
              <tbody className="divide-y divide-slate-800/60">
                {categoryData.income.map((inc: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-semibold text-white">{inc.category}</td>
                    <td className="py-3 px-4 text-slate-400">{inc.count} transactions</td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-bold">{formatCurrency(inc.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
};
