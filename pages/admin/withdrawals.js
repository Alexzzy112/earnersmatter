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
  FiArrowUpRight, FiCheck, FiX, FiSearch, FiChevronLeft, FiChevronRight, FiSend, FiTrash2
} from 'react-icons/fi';

const statusFilters = ['all', 'pending', 'approved', 'rejected', 'completed'];

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchWithdrawals = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, search };
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await adminAPI.getWithdrawals(params);
      setWithdrawals(res.data || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      toast.error('Failed to load withdrawals');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { fetchWithdrawals(); }, [fetchWithdrawals]);

  const handleAction = async (id, action) => {
    setSaving(true);
    try {
      if (action === 'approve') { await adminAPI.approveWithdrawal(id); toast.success('Withdrawal approved'); }
      else if (action === 'complete') { await adminAPI.completeWithdrawal(id); toast.success('Withdrawal completed'); }
      else if (action === 'reject') {
        if (!rejectNote.trim()) { toast.error('Please provide a rejection note'); setSaving(false); return; }
        await adminAPI.rejectWithdrawal(id, rejectNote);
        toast.success('Withdrawal rejected');
        setRejectModal(null); setRejectNote('');
      }
      setConfirmAction(null);
      fetchWithdrawals();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} withdrawal`);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await adminAPI.deleteWithdrawal(deleteTarget._id);
      toast.success('Withdrawal deleted');
      setDeleteTarget(null);
      fetchWithdrawals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete withdrawal');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Withdrawal Management</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Review and manage withdrawal requests</p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by user or amount..." value={search}
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Charge</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Net</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                {loading ? (
                  <tr><td colSpan={9} className="px-4 py-12"><LoadingSpinner className="mx-auto" /></td></tr>
                ) : withdrawals.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-12"><EmptyState icon={FiArrowUpRight} title="No withdrawals found" /></td></tr>
                ) : (
                  withdrawals.map((wd) => (
                    <tr key={wd._id} className="hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-gray-500 dark:text-gray-400">#{wd._id?.slice(-6)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{wd.userId?.username || wd.userId?.email || 'Unknown'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">₦{(wd.amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">₦{(wd.charge || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm font-medium text-green-600 dark:text-green-400">₦{(wd.netAmount || wd.amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{wd.method || wd.paymentMethod || '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={wd.status} /></td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{wd.createdAt ? new Date(wd.createdAt).toLocaleString() : '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {wd.status === 'pending' && (
                            <>
                              <button onClick={() => setConfirmAction({ id: wd._id, action: 'approve' })} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20" title="Approve">
                                <FiCheck className="w-4 h-4" />
                              </button>
                              <button onClick={() => { setRejectModal(wd._id); setRejectNote(''); }} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" title="Reject">
                                <FiX className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {wd.status === 'approved' && (
                            <button onClick={() => setConfirmAction({ id: wd._id, action: 'complete' })} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Complete">
                              <FiSend className="w-4 h-4" />
                            </button>
                          )}
                          {['completed', 'rejected'].includes(wd.status) && (
                            <span className="text-xs text-gray-400">{wd.processedAt ? new Date(wd.processedAt).toLocaleDateString() : 'Done'}</span>
                          )}
                          <button onClick={() => setDeleteTarget(wd)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete">
                            <FiTrash2 className="w-4 h-4" />
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

        {/* Approve/Complete Confirmation */}
        <Modal isOpen={!!confirmAction} onClose={() => setConfirmAction(null)} title="" size="sm">
          <div className="text-center">
            <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center ${
              confirmAction?.action === 'approve' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {confirmAction?.action === 'approve' ? <FiCheck className="w-6 h-6" /> : <FiSend className="w-6 h-6" />}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 capitalize">{confirmAction?.action} Withdrawal</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {confirmAction?.action === 'approve' ? 'Are you sure you want to approve this withdrawal?' : 'Mark this withdrawal as completed?'}
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-700">
            <button onClick={() => setConfirmAction(null)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700">Cancel</button>
            <button onClick={() => handleAction(confirmAction.id, confirmAction.action)} disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {saving ? 'Processing...' : `Yes, ${confirmAction?.action}`}
            </button>
          </div>
        </Modal>

        {/* Delete Confirmation */}
        <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="" size="sm">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto mb-4 flex items-center justify-center">
              <FiTrash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Withdrawal</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Are you sure you want to delete this withdrawal record?</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">₦{(deleteTarget?.amount || 0).toLocaleString()} — {deleteTarget?.userId?.username || 'Unknown'}</p>
            <p className="text-xs text-red-500 mt-2">This action cannot be undone.</p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-700">
            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700">Cancel</button>
            <button onClick={handleDelete} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
              {saving ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </Modal>

        {/* Reject Modal */}
        <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Withdrawal">
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Please provide a reason for rejecting this withdrawal.</p>
            <textarea className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 !min-h-[100px]"
              placeholder="Enter rejection note..." value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-700">
            <button onClick={() => setRejectModal(null)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700">Cancel</button>
            <button onClick={() => handleAction(rejectModal, 'reject')} disabled={saving || !rejectNote.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
              {saving ? 'Processing...' : 'Reject'}
            </button>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
