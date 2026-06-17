'use client';
import { useState, useEffect } from 'react';
import { userAPI, authAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { FiUser, FiMail, FiPhone, FiShield, FiRefreshCw, FiCheckCircle, FiXCircle, FiSend, FiMessageCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) return;
    setLoading(true);
    (async () => {
      try {
        const res = await authAPI.getMe();
        updateUser(res.data.user || res.data);
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, [user, updateUser]);

  const validatePassword = () => {
    const errors = {};
    if (!passwordData.currentPassword) errors.currentPassword = 'Current password is required';
    if (!passwordData.newPassword || passwordData.newPassword.length < 6) errors.newPassword = 'Password must be at least 6 characters';
    if (passwordData.newPassword !== passwordData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setSavingPassword(true);
    try {
      await userAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) return <DashboardLayout><LoadingSpinner text="Loading profile..." /></DashboardLayout>;
  if (error) return (
    <DashboardLayout>
      <div className="text-center py-16">
        <FiRefreshCw size={48} className="mx-auto text-danger-400 mb-4" />
        <h2 className="text-xl font-semibold text-dark-800 dark:text-dark-200 mb-2">{error}</h2>
        <button onClick={() => window.location.reload()} className="btn-primary">Try Again</button>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Profile</h1>
          <p className="text-dark-400 text-sm mt-1">Manage your account settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Info Card */}
          <div className="card p-6 lg:col-span-1">
            <div className="text-center">
              <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUser size={32} className="text-white" />
              </div>
              <h2 className="text-lg font-semibold text-dark-900 dark:text-white">{user?.username || 'User'}</h2>
              <p className="text-sm text-dark-400">{user?.email}</p>
            </div>

            <div className="divider" />

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <FiMail size={16} className="text-dark-400" />
                <span className="text-dark-600 dark:text-dark-300">{user?.email || '-'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <FiPhone size={16} className="text-dark-400" />
                <span className="text-dark-600 dark:text-dark-300">{user?.phone || 'Not set'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                {user?.isActive || user?.status === 'active' ? (
                  <FiCheckCircle size={16} className="text-success-500" />
                ) : (
                  <FiXCircle size={16} className="text-danger-500" />
                )}
                <span className="text-dark-600 dark:text-dark-300">
                  {user?.isActive || user?.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Contact & Password */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
                <FiMessageCircle size={18} /> Contact
              </h2>
              <div className="space-y-4">
                <a
                  href="https://t.me/earnersmatter"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                    <FiSend size={18} className="text-sky-600 dark:text-sky-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark-900 dark:text-white">Telegram Channel</p>
                    <p className="text-xs text-dark-400 truncate">Join our channel for updates</p>
                  </div>
                </a>
                <a
                  href="https://t.me/earnersmatter_admin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <FiMessageCircle size={18} className="text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark-900 dark:text-white">Admin Account</p>
                    <p className="text-xs text-dark-400 truncate">Message the admin directly</p>
                  </div>
                </a>
                <a
                  href="mailto:support@earnersmatter.com"
                  className="flex items-center gap-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <FiMail size={18} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark-900 dark:text-white">Email</p>
                    <p className="text-xs text-dark-400 truncate">support@earnersmatter.com</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Change Password */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
                <FiShield size={18} /> Change Password
              </h2>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => { setPasswordData({ ...passwordData, currentPassword: e.target.value }); setPasswordErrors({}); }}
                    className="input-field"
                  />
                  {passwordErrors.currentPassword && <p className="text-xs text-danger-500 mt-1">{passwordErrors.currentPassword}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => { setPasswordData({ ...passwordData, newPassword: e.target.value }); setPasswordErrors({}); }}
                    className="input-field"
                  />
                  {passwordErrors.newPassword && <p className="text-xs text-danger-500 mt-1">{passwordErrors.newPassword}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => { setPasswordData({ ...passwordData, confirmPassword: e.target.value }); setPasswordErrors({}); }}
                    className="input-field"
                  />
                  {passwordErrors.confirmPassword && <p className="text-xs text-danger-500 mt-1">{passwordErrors.confirmPassword}</p>}
                </div>
                <button type="submit" className="btn-primary" disabled={savingPassword}>
                  {savingPassword ? 'Updating...' : <><FiShield size={16} /> Change Password</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
