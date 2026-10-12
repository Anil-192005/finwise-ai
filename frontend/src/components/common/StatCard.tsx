import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    variant: 'positive' | 'negative' | 'neutral' | 'warning';
  };
  accentColor?: 'emerald' | 'rose' | 'blue' | 'indigo' | 'amber';
  tooltip?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  accentColor = 'blue',
  tooltip
}) => {
  const colorStyles = {
    emerald: {
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      borderHover: 'hover:border-emerald-500/40',
      glow: 'shadow-emerald-950/20',
    },
    rose: {
      iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      borderHover: 'hover:border-rose-500/40',
      glow: 'shadow-rose-950/20',
    },
    blue: {
      iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      borderHover: 'hover:border-blue-500/40',
      glow: 'shadow-blue-950/20',
    },
    indigo: {
      iconBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      borderHover: 'hover:border-indigo-500/40',
      glow: 'shadow-indigo-950/20',
    },
    amber: {
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      borderHover: 'hover:border-amber-500/40',
      glow: 'shadow-amber-950/20',
    },
  }[accentColor];

  const badgeStyles = {
    positive: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    negative: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    neutral: 'bg-slate-800 text-slate-300 border-slate-700',
  }[badge?.variant || 'neutral'];

  return (
    <div
      title={tooltip}
      className={`p-5 rounded-2xl bg-[#0e1526]/80 backdrop-blur-sm border border-slate-800/80 transition-all duration-300 hover:shadow-xl ${colorStyles.borderHover} ${colorStyles.glow} group`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl border ${colorStyles.iconBg} transition-transform group-hover:scale-105`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-2xl font-bold tracking-tight text-white group-hover:text-blue-50 transition-colors">
          {value}
        </h3>
        {badge && (
          <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${badgeStyles}`}>
            {badge.text}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-400">
          {subtitle}
        </p>
      )}
    </div>
  );
};
