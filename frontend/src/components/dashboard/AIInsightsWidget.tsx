import React from 'react';
import { InsightItem } from '../../types';
import { Sparkles, ArrowRight, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  insights: InsightItem[];
  summary: string;
}

export const AIInsightsWidget: React.FC<Props> = ({ insights, summary }) => {
  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#0e172e] via-[#0d1426] to-[#0a1020] border border-blue-500/30 shadow-xl shadow-blue-950/20 flex flex-col justify-between">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-white">FinWise AI Insights</h3>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                Live
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Automated spending intelligence</p>
          </div>
        </div>

        <Link
          to="/insights"
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
        >
          <span>Ask Advisor</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-3 mb-4">
        {summary && (
          <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-800/30 text-xs text-slate-300 leading-relaxed">
            {summary}
          </div>
        )}

        <div className="space-y-2">
          {insights.slice(0, 2).map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3 text-xs"
            >
              {item.impact_level === 'warning' ? (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              ) : item.impact_level === 'positive' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <TrendingUp className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <p className="font-semibold text-white truncate">{item.title}</p>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 shrink-0">
                    {item.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
