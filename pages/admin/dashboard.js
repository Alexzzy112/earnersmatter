'use client';
import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';
import StatsCard from '@/components/shared/StatsCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  FiUsers, FiUserCheck, FiDollarSign, FiArrowUpRight, FiTrendingUp,
  FiBarChart2, FiPieChart, FiClock, FiRefreshCw, FiActivity, FiChevronRight, FiAlertTriangle, FiDatabase,
  FiCreditCard, FiHash, FiHome, FiType, FiExternalLink, FiStar
} from 'react-icons/fi';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, activityRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getRecentActivity(),
      ]);
      setData(dashRes.data);
      setActivity(activityRes.data || []);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const statsConfig = [
    { key: 'totalUsers', label: 'Total Users', icon: FiUsers, color: 'blue' },
    { key: 'activeUsers', label: 'Active Users', icon: FiUserCheck, color: 'green' },
    { key: 'totalDeposits', label: 'Total Deposits', icon: FiDollarSign, color: 'green', prefix: '₦' },
    { key: 'totalWithdrawals', label: 'Total Withdrawals', icon: FiArrowUpRight, color: 'red', prefix: '₦' },
    { key: 'totalInvestments', label: 'Total Investments', icon: FiTrendingUp, color: 'purple', prefix: '₦' },
    { key: 'totalEarningsDistributed', label: 'Total Earnings', icon: FiBarChart2, color: 'yellow', prefix: '₦' },
    { key: 'totalRevenue', label: 'Total Revenue', icon: FiPieChart, color: 'blue', prefix: '₦' },
    { key: 'pendingDeposits', label: 'Pending Deposits', icon: FiClock, color: 'yellow' },
    { key: 'pendingWithdrawals', label: 'Pending Withdrawals', icon: FiClock, color: 'red' },
  ];

  const [reseeding, setReseeding] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleResetFinancials = async () => {
    const confirmed = window.confirm(
      'This will DELETE all financial records (deposits, withdrawals, investments, transactions, earnings, referrals). User account balances will NOT be affected. Continue?'
    );
    if (!confirmed) return;
    setResetting(true);
    try {
      const res = await adminAPI.resetFinancials();
      toast.success(res.message || 'Financial records cleared');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset financial records');
    } finally {
      setResetting(false);
    }
  };

  const handleReseed = async () => {
    const confirmed = window.confirm(
      'WARNING: This will DELETE ALL DATA (users, investments, transactions, etc.) and reset to factory defaults. Are you sure?'
    );
    if (!confirmed) return;
    const doubleConfirm = window.confirm('This is irreversible! All data will be lost. Proceed?');
    if (!doubleConfirm) return;

    const securityKey = window.prompt('Enter reseed security key:');
    if (!securityKey) return;

    setReseeding(true);
    try {
      await adminAPI.reseed(securityKey);
      toast.success('Database reseeded successfully!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reseed failed');
    } finally {
      setReseeding(false);
    }
  };

  const quickActions = [
    { label: 'Approve Deposits', href: '/admin/deposits', description: 'Review pending deposits', color: 'green' },
    { label: 'Manage Users', href: '/admin/users', description: 'View all registered users', color: 'blue' },
    { label: 'Create Product', href: '/admin/products', description: 'Add a new investment product', color: 'purple' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Overview of your platform</p>
          </div>
          <button onClick={fetchData} disabled={loading} className="p-2.5 rounded-lg border border-gray-200 dark:border-dark-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700">
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading && !data ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-5 animate-pulse">
                <div className="h-12 w-12 rounded-lg bg-gray-200 dark:bg-dark-700 mb-3" />
                <div className="h-3 w-24 bg-gray-200 dark:bg-dark-700 rounded mb-2" />
                <div className="h-7 w-20 bg-gray-200 dark:bg-dark-700 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {statsConfig.map(({ key, label, icon, color, prefix = '' }) => {
              const val = data?.[key];
              const displayVal = val != null ? (typeof val === 'number' ? `${prefix}${val.toLocaleString()}` : val) : '—';
              return <StatsCard key={key} title={label} value={displayVal} icon={icon} color={color} />;
            })}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FiActivity className="w-5 h-5 text-primary-500" />
                Recent Activity
              </h2>
              <button onClick={fetchData} disabled={loading} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1">
                <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            {activity.length === 0 ? (
              <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                <FiActivity className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activity.slice(0, 10).map((act, idx) => (
                  <div key={act._id || idx} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-dark-700 hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                      <FiChevronRight className="w-4 h-4 text-primary-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {act.description || act.message || act.action || 'Action performed'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {act.admin || act.user?.username || act.user?.email || ''}
                        {act.createdAt && ` • ${new Date(act.createdAt).toLocaleString()}`}
                      </p>
                    </div>
                    {act.type && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        ['deposit', 'credit'].includes(act.type)
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : ['withdrawal', 'debit'].includes(act.type)
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {act.type}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {quickActions.map(({ label, href, description, color }) => {
                const colors = {
                  green: 'from-green-500/10 to-green-600/5 border-green-200 dark:border-green-800 hover:border-green-400',
                  blue: 'from-blue-500/10 to-blue-600/5 border-blue-200 dark:border-blue-800 hover:border-blue-400',
                  purple: 'from-purple-500/10 to-purple-600/5 border-purple-200 dark:border-purple-800 hover:border-purple-400',
                };
                return (
                  <Link key={label} href={href}
                    className={`block p-4 rounded-xl bg-gradient-to-br ${colors[color]} border transition-all hover:shadow-md`}>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{label}</p>
                    <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">{description}</p>
                  </Link>
                );
              })}
            </div>
            {data?.activePaymentAccount && (
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-dark-700">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-1.5">
                  <FiCreditCard className="w-3.5 h-3.5" /> Active Payment Account
                </h3>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border border-green-200 dark:border-green-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <FiCreditCard className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">{data.activePaymentAccount.accountName}</p>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Accepting Payments
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <FiHash className="w-3 h-3 text-gray-400" />
                      <span className="font-mono font-medium">{data.activePaymentAccount.accountNumber}</span>
                    </div>
                    {data.activePaymentAccount.bankName && (
                      <div className="flex items-center gap-1.5">
                        <FiHome className="w-3 h-3 text-gray-400" />
                        <span>{data.activePaymentAccount.bankName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <FiType className="w-3 h-3 text-gray-400" />
                      <span className="capitalize">{(data.activePaymentAccount.accountType || 'bank').replace('_', ' ')}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                    {data.activePaymentAccount.isDefault ? (
                      <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                        <FiStar className="w-3.5 h-3.5" /> Default Account — No auto-rotate
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-500 dark:text-gray-400">Auto-rotate Progress</span>
                          <span className="font-semibold text-gray-700 dark:text-gray-300">{data.activePaymentAccount.assignmentCount || 0}/3</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(((data.activePaymentAccount.assignmentCount || 0) / 3) * 100, 100)}%` }} />
                        </div>
                      </>
                    )}
                  </div>
                  <Link href="/admin/payment-accounts"
                    className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors">
                    <FiExternalLink className="w-3 h-3" /> Manage Payment Accounts
                  </Link>
                </div>
              </div>
            )}
            {data && (
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-dark-700">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">System Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Total Users</span>
                    <span className="font-medium text-gray-900 dark:text-white">{data.totalUsers || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Active Investments</span>
                    <span className="font-medium text-gray-900 dark:text-white">{data.totalInvestments || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Pending</span>
                    <span className="font-medium text-gray-900 dark:text-white">{(data.pendingDeposits || 0) + (data.pendingWithdrawals || 0)}</span>
                  </div>
                </div>
                <button
                  onClick={handleResetFinancials}
                  disabled={resetting}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors disabled:opacity-50"
                >
                  <FiDollarSign className="w-4 h-4" />
                  {resetting ? 'Clearing...' : 'Reset Financial Records'}
                  <FiAlertTriangle className="w-4 h-4" />
                </button>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 text-center">Clears all money records, keeps users &amp; products</p>

                <button
                  onClick={handleReseed}
                  disabled={reseeding}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
                >
                  <FiDatabase className="w-4 h-4" />
                  {reseeding ? 'Reseeding...' : 'Reseed Database'}
                  <FiAlertTriangle className="w-4 h-4" />
                </button>
                <p className="mt-2 text-xs text-gray-400 dark:text-gray-500 text-center">Resets all data to factory defaults</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
