import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading financial records...' }) => {
  return (
    <div className="py-20 flex flex-col items-center justify-center gap-3">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-blue-500/20 animate-pulse" />
        </div>
      </div>
      <p className="text-xs font-medium text-slate-400 animate-pulse">{message}</p>
    </div>
  );
};
