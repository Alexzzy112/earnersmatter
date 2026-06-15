'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import toast from 'react-hot-toast';
import {
  FiShield, FiChevronLeft, FiChevronRight, FiSearch
} from 'react-icons/fi';

const actionFilters = ['all', 'user_created', 'deposit_approved', 'deposit_rejected', 'withdrawal_approved', 'withdrawal_rejected', 'payment_account_activated', 'payment_account_deactivated'];

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (actionFilter !== 'all') params.action = actionFilter;
      const res = await adminAPI.getAuditLogs(params);
      setLogs(res.data || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const formatAction = (action) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Track all administrative actions and system events</p>
        </div>

        <div className="flex gap-3 flex-wrap">
          {actionFilters.map((af) => (
            <button key={af} onClick={() => { setActionFilter(af); setPage(1); }}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                actionFilter === af
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700'
              }`}>
              {af === 'all' ? 'All' : formatAction(af)}
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-900">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Admin</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Entity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12">
                      <LoadingSpinner className="mx-auto" />
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12">
                      <EmptyState icon={FiShield} title="No audit logs found" description={actionFilter !== 'all' ? 'No logs with this action type yet' : 'Audit logs will appear here as actions are performed'} />
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {log.userId?.username || 'Unknown'}
                        <span className="text-gray-500 dark:text-gray-400 text-xs ml-1">({log.userId?.email || '—'})</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                          {formatAction(log.action)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {log.entityType || '—'}
                        {log.entityId ? ` #${log.entityId.toString().slice(-6)}` : ''}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">
                        {log.details ? JSON.stringify(log.details).slice(0, 60) + (JSON.stringify(log.details).length > 60 ? '...' : '') : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-500 dark:text-gray-400">{log.ipAddress || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-dark-700">
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
      </div>
    </AdminLayout>
  );
}
