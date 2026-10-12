import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  Settings,
  User,
  Shield,
  KeyRound,
  AlertTriangle,
  Save,
  Trash2,
  Loader2,
  DollarSign
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSavingPref, setIsSavingPref] = useState<boolean>(false);
  const [isChangingPwd, setIsChangingPwd] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);

  // Preference Form
  const [currency, setCurrency] = useState('INR');
  const [threshold, setThreshold] = useState(75);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const pref = await api.getPreferences();
        setCurrency(pref.preferred_currency || 'INR');
        setThreshold(pref.budget_warning_threshold || 75);
      } catch {
        // Fallback
      } finally {
        setIsLoading(false);
      }
    };
    loadPreferences();
  }, []);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPref(true);
    try {
      await api.updatePreferences({
        preferred_currency: currency,
        budget_warning_threshold: threshold,
      });
      await refreshUser();
      success('Financial preferences updated');
    } catch (err: any) {
      error(err.message || 'Failed to update preferences');
    } finally {
      setIsSavingPref(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      error('New password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      error('New passwords do not match');
      return;
    }

    setIsChangingPwd(true);
    try {
      await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      error(err.message || 'Failed to change password');
    } finally {
      setIsChangingPwd(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.deleteAccount();
      await logout();
      navigate('/login');
    } catch (err: any) {
      error(err.message || 'Failed to delete account');
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading account settings..." />;
  }

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold text-white">Account Settings & Preferences</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure currencies, alert thresholds, credentials, and data privacy
        </p>
      </div>

      {/* Profile Overview */}
      <div className="p-6 rounded-2xl bg-[#0e1526]/80 border border-slate-800 shadow-lg space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">User Profile</h3>
            <p className="text-xs text-slate-400">Authenticated user details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-1">Full Name</span>
            <p className="font-semibold text-white bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
              {user?.full_name}
            </p>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">Email Address</span>
            <p className="font-semibold text-white bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 truncate">
              {user?.email}
            </p>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">Member Since</span>
            <p className="font-semibold text-slate-300 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 font-mono">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Currency & Alert Preferences Form */}
      <form
        onSubmit={handleSavePreferences}
        className="p-6 rounded-2xl bg-[#0e1526]/80 border border-slate-800 shadow-lg space-y-5"
      >
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Financial Display Preferences</h3>
            <p className="text-xs text-slate-400">Currency symbol and budget early warning thresholds</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Preferred Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="INR">INR (₹) - Indian Rupee</option>
              <option value="USD">USD ($) - US Dollar</option>
              <option value="EUR">EUR (€) - Euro</option>
              <option value="GBP">GBP (£) - British Pound</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 font-medium">Budget Warning Threshold</label>
              <span className="font-bold text-amber-400">{threshold}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-2"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              Visual amber warning badge will trigger when category spending hits {threshold}% of limit.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-800">
          <button
            type="submit"
            disabled={isSavingPref}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSavingPref ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Preferences</span>
          </button>
        </div>
      </form>

      {/* Password Management */}
      <form
        onSubmit={handleChangePassword}
        className="p-6 rounded-2xl bg-[#0e1526]/80 border border-slate-800 shadow-lg space-y-4"
      >
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Security & Password</h3>
            <p className="text-xs text-slate-400">Update your Argon2-hashed password credentials</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 chars"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-800">
          <button
            type="submit"
            disabled={isChangingPwd}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isChangingPwd ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Update Password</span>
          </button>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30 shadow-lg space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-rose-500/20">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Danger Zone</h3>
            <p className="text-xs text-rose-300/80">Permanent account and financial records deletion</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <p className="text-slate-400 max-w-lg leading-relaxed">
            Deleting your account will permanently wipe all transactions, custom categories, monthly budgets, savings goals, and recurring templates from the database. This action is irreversible.
          </p>
          <button
            onClick={() => setIsDeleteDialogOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2 shrink-0 self-start sm:self-auto"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={isDeleteDialogOpen}
        title="Permanently Delete Account"
        message="Are you completely sure you want to permanently delete your account and all associated personal financial records? This action cannot be undone."
        confirmText="Yes, Permanently Delete"
        isDestructive={true}
        onConfirm={handleDeleteAccount}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
};
