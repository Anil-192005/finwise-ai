import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Financial Overview',
  '/transactions': 'Income & Expense Transactions',
  '/budgets': 'Monthly Budget Management',
  '/savings': 'Savings Goals & Envelopes',
  '/insights': 'AI Financial Insights & QA',
  '/forecasting': 'Expense Forecasting & Trends',
  '/recurring': 'Recurring Transaction Schedules',
  '/reports': 'Financial Reports & Statements',
  '/settings': 'Account & Preferences',
};

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const title = pageTitles[location.pathname] || 'FinWise AI Dashboard';

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex">
      {/* Desktop & Mobile Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} title={title} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
