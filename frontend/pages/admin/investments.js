'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';
import Modal from '@/components/shared/Modal';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import StatusBadge from '@/components/shared/StatusBadge';
import toast from 'react-hot-toast';
import {
  FiTrendingUp, FiChevronLeft, FiChevronRight, FiSearch, FiEye
} from 'react-icons/fi';

const statusFilters = ['all', 'active', 'completed', 'cancelled'];

export default function AdminInvestments() {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const fetchInvestments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, search };
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await adminAPI.getAllInvestments(params);
      setInvestments(res.data?.investments || []);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      toast.error('Failed to load investments');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { fetchInvestments(); }, [fetchInvestments]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Investment Management</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">View and manage all user investments</p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by user or product..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {statusFilters.map((s) => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                  statusFilter === s
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700'
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-900">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Daily Return</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                {loading ? (
                  <tr><td colSpan={9} className="px-4 py-12"><LoadingSpinner className="mx-auto" /></td></tr>
                ) : investments.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-12"><EmptyState icon={FiTrendingUp} title="No investments found" /></td></tr>
                ) : (
                  investments.map((inv) => (
                    <tr key={inv._id} className="hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-gray-500 dark:text-gray-400">#{inv._id?.slice(-6)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{inv.user?.username || inv.user?.email || 'Unknown'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{inv.product?.name || '—'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">₦{(inv.amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400">₦{(inv.dailyEarnings || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{inv.duration || inv.product?.duration || 0} days</td>
                      <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{inv.createdAt ? new Date(inv.createdAt).toLocaleString() : '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setSelected(inv)} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" title="View Details">
                            <FiEye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
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

        {/* Details Modal */}
        <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Investment Details">
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Investment ID</label>
                  <p className="text-sm font-mono text-gray-900 dark:text-white mt-1">#{selected._id}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</label>
                  <div className="mt-1"><StatusBadge status={selected.status} /></div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">User</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{selected.user?.username || selected.user?.email || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Product</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{selected.product?.name || '—'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">₦{(selected.amount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Daily Return</label>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">₦{(selected.dailyEarnings || 0).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Duration</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{selected.duration || selected.product?.duration || 0} days</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Return</label>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400 mt-1">₦{((selected.dailyEarnings || 0) * (selected.duration || selected.product?.duration || 0)).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Start Date</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{selected.startDate ? new Date(selected.startDate).toLocaleDateString() : '—'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">End Date</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{selected.endDate ? new Date(selected.endDate).toLocaleDateString() : '—'}</p>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
