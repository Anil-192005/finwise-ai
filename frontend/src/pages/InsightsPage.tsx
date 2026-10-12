import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { InsightsResponse, InsightItem, QuestionResponse } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Send,
  MessageSquare,
  Bot,
  User,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Loader2
} from 'lucide-react';

export const InsightsPage: React.FC = () => {
  const { formatCurrency } = useAuth();
  const { error } = useToast();

  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [insightsData, setInsightsData] = useState<InsightsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // QA Assistant State
  const [question, setQuestion] = useState<string>('');
  const [isAsking, setIsAsking] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'bot'; text: string; data?: any }>>([
    {
      sender: 'bot',
      text: "Hello! I am your FinWise AI financial assistant. You can ask me questions about your recorded income, expenses, category spending, or budget status for any month.",
    },
  ]);

  const fetchInsights = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getInsights(selectedMonth);
      setInsightsData(data);
    } catch (err: any) {
      error(err.message || 'Failed to load financial insights');
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const handleAsk = async (queryText?: string) => {
    const q = (queryText || question).trim();
    if (!q) return;

    setChatHistory((prev) => [...prev, { sender: 'user', text: q }]);
    setQuestion('');
    setIsAsking(true);

    try {
      const res: QuestionResponse = await api.askFinancialQuestion(q, selectedMonth);
      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: res.answer,
          data: res.data_points,
        },
      ]);
    } catch (err: any) {
      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: "I encountered an issue analyzing your records. Please ensure your query refers to existing transactions or budgets.",
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  const sampleQuestions = [
    "How much did I spend on food this month?",
    "Which category increased the most?",
    "Am I within my monthly budget?",
    "How much could I save if I reduce shopping expenses?",
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">AI Financial Insights & Advisor</h2>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-xs">
              Deterministic AI
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated spending diagnostics, anomaly detection, and natural language question answering
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#0d1322] border border-slate-800 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent text-xs text-white font-semibold focus:outline-none"
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Generating personalized financial insights..." />
      ) : (
        <>
          {/* Executive Summary Card */}
          {insightsData && (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0c1834] via-[#0f1d3e] to-[#0a1224] border border-blue-500/30 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Sparkles className="w-32 h-32 text-blue-400" />
              </div>

              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Monthly Financial Executive Summary</h3>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-3xl">
                {insightsData.monthly_summary}
              </p>

              <div className="mt-4 pt-4 border-t border-blue-500/20 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Calculated from verified user transactions</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Rule-based fallback active</span>
                </div>
              </div>
            </div>
          )}

          {/* Observations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {insightsData?.insights.map((item, idx) => {
              const isWarning = item.impact_level === 'warning';
              const isPositive = item.impact_level === 'positive';

              let borderColor = 'border-slate-800';
              let iconBg = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
              let Icon = TrendingUp;

              if (isWarning) {
                borderColor = 'border-amber-500/30 shadow-amber-950/20';
                iconBg = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                Icon = AlertTriangle;
              } else if (isPositive) {
                borderColor = 'border-emerald-500/30 shadow-emerald-950/20';
                iconBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                Icon = Lightbulb;
              }

              return (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl bg-[#0e1526]/80 backdrop-blur-sm border ${borderColor} shadow-lg space-y-2`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl border ${iconBg}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold text-white">{item.title}</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-300">
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pt-1">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Interactive AI QA Assistant */}
          <div className="rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Ask FinWise AI</h3>
                  <p className="text-[11px] text-slate-400">Ask natural questions about your database records</p>
                </div>
              </div>
              <span className="text-[11px] text-slate-400">Period: {selectedMonth}</span>
            </div>

            {/* Chat Messages */}
            <div className="p-5 space-y-4 max-h-80 overflow-y-auto">
              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 text-xs leading-relaxed ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.sender === 'bot' && (
                    <div className="w-7 h-7 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-lg p-3.5 rounded-2xl ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none shadow-md'
                        : 'bg-[#131c33] border border-slate-700/80 text-slate-200 rounded-bl-none shadow-md'
                    }`}
                  >
                    <p>{msg.text}</p>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {isAsking && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  <span>Querying database records deterministically...</span>
                </div>
              )}
            </div>

            {/* Quick Prompts Chips */}
            <div className="px-5 py-2.5 border-t border-slate-800/80 bg-slate-900/40 flex flex-wrap items-center gap-2">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Try:</span>
              {sampleQuestions.map((sq, i) => (
                <button
                  key={i}
                  onClick={() => handleAsk(sq)}
                  disabled={isAsking}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-[11px] text-slate-300 hover:text-white transition-colors disabled:opacity-50"
                >
                  {sq}
                </button>
              ))}
            </div>

            {/* Question Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAsk();
              }}
              className="p-4 border-t border-slate-800 flex items-center gap-3 bg-slate-900/60"
            >
              <input
                type="text"
                placeholder="Ask e.g. How much did I spend on food this month? Am I within budget?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={isAsking}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={isAsking || !question.trim()}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};
