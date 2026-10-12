import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wallet,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  PiggyBank,
  Receipt,
  ArrowRight,
  CheckCircle2,
  Lock,
  Cpu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  const handleDemoAccess = async () => {
    try {
      await login({ email: 'demo@finwise.ai', password: 'DemoPass123!' });
      navigate('/dashboard');
    } catch {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-white flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Navigation */}
      <header className="h-20 border-b border-slate-800/80 bg-[#070b14]/80 backdrop-blur-md sticky top-0 z-50 px-6 sm:px-12 flex items-center justify-between max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              FinWise AI
            </span>
            <span className="block text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">
              Financial Intelligence
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800/60 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 sm:px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/25 transition-all flex items-center gap-1.5"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 sm:px-12 pt-16 pb-24 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Glow ambient background */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 shadow-inner text-xs text-slate-300 mb-8 animate-in fade-in duration-500">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Next-Generation AI Expense Analytics & Forecasting</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.15] mb-6">
          Master Your Money with <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
            AI-Powered Clarity & Precision
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mb-10 leading-relaxed">
          FinWise AI empowers students, professionals, and families to automatically categorize expenses,
          predict upcoming monthly spending, detect cash flow leaks, and reach savings milestones faster.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            to="/register"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 hover:scale-105"
          >
            <span>Create Free Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={handleDemoAccess}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-semibold bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition-all flex items-center justify-center gap-2 hover:border-slate-600"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Launch Live Demo</span>
          </button>
        </div>

        {/* Feature Highlights Pills */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Deterministic Math Calculations</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Multi-Currency (INR, USD, EUR, GBP)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Zero Real-Money Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>100% User Data Isolation</span>
          </div>
        </div>
      </section>

      {/* Interactive Platform Grid */}
      <section className="px-6 sm:px-12 py-16 bg-[#0a0f1d] border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Engineered for Complete Financial Control
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              From real-time keyword & ML categorization to time-series forecasting, every feature is built with software engineering rigor.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#0f172a]/70 border border-slate-800 hover:border-blue-500/40 transition-all">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 w-fit mb-4">
                <Receipt className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Automated Categorization</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Smart hybrid engine with high-precision keywords and TF-IDF Naive Bayes ML classifier. Instantly recognizes Swiggy, Uber, Netflix, and tuition expenses.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0f172a]/70 border border-slate-800 hover:border-emerald-500/40 transition-all">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit mb-4">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Linear Trend Forecasting</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Aggregates historical monthly expenses to project next month's spending with confidence intervals, early warning alerts, and category risk scoring.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0f172a]/70 border border-slate-800 hover:border-purple-500/40 transition-all">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 w-fit mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">AI Natural Language QA</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ask questions like "How much did I spend on food this month?" or "Am I within budget?" and receive deterministic, verifiable answers from your records.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0f172a]/70 border border-slate-800 hover:border-amber-500/40 transition-all">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 w-fit mb-4">
                <PiggyBank className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Dynamic Budget Guardrails</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Category envelopes with live progress indicators. Visual warnings trigger at configurable thresholds (e.g., 75% capacity) to prevent overspending.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0f172a]/70 border border-slate-800 hover:border-teal-500/40 transition-all">
              <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 w-fit mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Savings Goals & Projection</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Create dedicated funds for emergency buffers or laptops. The system computes your historical saving velocity to project target completion dates.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0f172a]/70 border border-slate-800 hover:border-rose-500/40 transition-all">
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 w-fit mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Strict Security & Export</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Argon2 password hashing, JWT user isolation, and formula-injection-protected CSV exports. No plaintext secrets or bank passwords ever collected.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 px-6 sm:px-12 border-t border-slate-800 bg-[#070b14] text-xs text-slate-500 text-center">
        <p>© 2026 FinWise AI. Built with React, TypeScript, FastAPI, SQLAlchemy, and Scikit-learn.</p>
        <p className="mt-1 text-[11px] text-slate-600">
          Personal Finance Advisor and Expense Analytics Platform.
        </p>
      </footer>
    </div>
  );
};
