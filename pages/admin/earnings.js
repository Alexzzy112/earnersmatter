'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';
import StatsCard from '@/components/shared/StatsCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import StatusBadge from '@/components/shared/StatusBadge';
import toast from 'react-hot-toast';
import {
  FiTrendingUp, FiBarChart2, FiClock, FiPlay, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';

const statusFilters = ['all', 'pending', 'paid', 'failed'];

export default function AdminEarnings() {
  const [schedules, setSchedules] = useState([]);
  const [allEarnings, setAllEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('schedules');
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter !== 'all') params.status = statusFilter;
      const [schedRes, earnRes, dashRes] = await Promise.all([
        adminAPI.getEarningSchedules(params),
        adminAPI.getAllEarnings(params),
        adminAPI.getDashboard(),
      ]);
      setSchedules(schedRes.data || []);
      setTotalPages(schedRes.totalPages || 1);
      setAllEarnings(earnRes.data || []);
      setStats(dashRes.data);
    } catch (err) { toast.error('Failed to load earnings data'); }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRunManual = async () => {
    setRunning(true);
    try { await adminAPI.runManualEarning(); toast.success('Earning cron executed successfully'); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to run earnings'); }
    finally { setRunning(false); }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Earnings Management</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Monitor and manage earnings distribution</p>
          </div>
          <button onClick={handleRunManual} disabled={running}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50">
            <FiPlay className={`w-4 h-4 ${running ? 'animate-pulse' : ''}`} />
            {running ? 'Running...' : 'Run Manual Earning'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard title="Total Earnings Distributed" value={`₦${(stats?.totalEarnings || 0).toLocaleString()}`} icon={FiBarChart2} color="green" />
          <StatsCard title="Active Investments" value={stats?.totalInvestments || 0} icon={FiTrendingUp} color="purple" />
          <StatsCard title="Pending Earnings" value={schedules.filter((s) => s.status === 'pending').length} icon={FiClock} color="yellow" />
        </div>

        <div className="flex gap-2 border-b border-gray-200 dark:border-dark-700 pb-2">
          <button onClick={() => setActiveTab('schedules')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'schedules' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700'
            }`}>Earning Schedules</button>
          <button onClick={() => setActiveTab('transactions')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'transactions' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700'
            }`}>All Transactions</button>
        </div>

        <div className="flex gap-2">
          {statusFilters.map((s) => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                statusFilter === s ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700'
              }`}>{s}</button>
          ))}
        </div>

        {activeTab === 'schedules' && (
          <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-900">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Investment ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Day</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                  {loading ? (
                    <tr><td colSpan={6} className="px-4 py-12"><LoadingSpinner className="mx-auto" /></td></tr>
                  ) : schedules.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-12"><EmptyState icon={FiClock} title="No earning schedules found" /></td></tr>
                  ) : (
                    schedules.map((sched, idx) => (
                      <tr key={sched._id || idx} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                        <td className="px-4 py-3 text-sm font-mono text-gray-500 dark:text-gray-400">#{sched.investment?._id?.slice(-6) || sched.investmentId?.slice(-6) || '—'}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{sched.user?.username || sched.investment?.user?.username || 'Unknown'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">Day {sched.day || sched.days || 0}</td>
                        <td className="px-4 py-3 text-sm font-medium text-green-600 dark:text-green-400">${(sched.amount || 0).toLocaleString()}</td>
                        <td className="px-4 py-3"><StatusBadge status={sched.status} /></td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{sched.createdAt ? new Date(sched.createdAt).toLocaleString() : '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-900">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Investment</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                  {loading ? (
                    <tr><td colSpan={7} className="px-4 py-12"><LoadingSpinner className="mx-auto" /></td></tr>
                  ) : allEarnings.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-12"><EmptyState icon={FiBarChart2} title="No earnings found" /></td></tr>
                  ) : (
                    allEarnings.map((earn, idx) => (
                      <tr key={earn._id || idx} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                        <td className="px-4 py-3 text-sm font-mono text-gray-500 dark:text-gray-400">#{earn._id?.slice(-6) || idx + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{earn.user?.username || 'Unknown'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{earn.investment?.product?.name || earn.investmentId?.slice(-6) || '—'}</td>
                        <td className="px-4 py-3 text-sm font-medium text-green-600 dark:text-green-400">${(earn.amount || 0).toLocaleString()}</td>
                        <td className="px-4 py-3"><StatusBadge status={earn.type || 'earning'} /></td>
                        <td className="px-4 py-3"><StatusBadge status={earn.status} /></td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{earn.createdAt ? new Date(earn.createdAt).toLocaleString() : '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
                <FiChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
                Next <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
