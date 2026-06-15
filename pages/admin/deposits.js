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
  FiDollarSign, FiCheck, FiX, FiSearch, FiChevronLeft, FiChevronRight, FiImage, FiEye
} from 'react-icons/fi';

const statusFilters = ['all', 'pending', 'approved', 'rejected'];

export default function AdminDeposits() {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [proofModal, setProofModal] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchDeposits = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, search };
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await adminAPI.getDeposits(params);
      setDeposits(res.data || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      toast.error('Failed to load deposits');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { fetchDeposits(); }, [fetchDeposits]);

  const handleApprove = async (id) => {
    setSaving(true);
    try {
      await adminAPI.approveDeposit(id);
      toast.success('Deposit approved successfully');
      setConfirmAction(null);
      fetchDeposits();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve deposit');
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectNote.trim()) {
      toast.error('Please provide a rejection note');
      return;
    }
    setSaving(true);
    try {
      await adminAPI.rejectDeposit(rejectModal, rejectNote);
      toast.success('Deposit rejected');
      setRejectModal(null);
      setRejectNote('');
      fetchDeposits();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject deposit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Deposit Management</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Review and manage user deposits</p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by user or amount..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
          </div>
          <div className="flex gap-2">
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Account</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Proof</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                {loading ? (
                  <tr><td colSpan={8} className="px-4 py-12"><LoadingSpinner className="mx-auto" /></td></tr>
                ) : deposits.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12"><EmptyState icon={FiDollarSign} title="No deposits found" /></td></tr>
                ) : (
                  deposits.map((dep) => (
                    <tr key={dep._id} className="hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-gray-500 dark:text-gray-400">#{dep._id?.slice(-6)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{dep.user?.username || dep.user?.email || dep.userId || 'Unknown'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-green-600 dark:text-green-400">₦{(dep.amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{dep.paymentAccountId?.accountName || dep.accountName || '—'}</td>
                      <td className="px-4 py-3">
                        {dep.paymentProof ? (
                          <button onClick={() => setProofModal(`/uploads/${dep.paymentProof}`)}
                            className="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20" title="View proof">
                            <FiImage className="w-4 h-4" />
                          </button>
                        ) : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={dep.status} /></td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{dep.createdAt ? new Date(dep.createdAt).toLocaleString() : '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {dep.status === 'pending' ? (
                            <>
                              <button onClick={() => setConfirmAction(dep._id)} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20" title="Approve">
                                <FiCheck className="w-4 h-4" />
                              </button>
                              <button onClick={() => { setRejectModal(dep._id); setRejectNote(''); }} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" title="Reject">
                                <FiX className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">{dep.processedAt ? new Date(dep.processedAt).toLocaleDateString() : 'Processed'}</span>
                          )}
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

        {/* Proof Image Modal */}
        <Modal isOpen={!!proofModal} onClose={() => setProofModal(null)} title="Payment Proof" size="lg">
          <img src={proofModal} alt="Payment proof" className="w-full rounded-lg"
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
          <div className="hidden items-center justify-center h-48 bg-gray-100 dark:bg-dark-700 rounded-lg text-gray-500 dark:text-gray-400">
            Failed to load image
          </div>
          <div className="flex justify-end pt-4">
            <a href={proofModal} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700">
              <FiEye className="w-4 h-4" /> Open in new tab
            </a>
          </div>
        </Modal>

        {/* Approve Confirmation */}
        <Modal isOpen={!!confirmAction} onClose={() => setConfirmAction(null)} title="" size="sm">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 mx-auto mb-4 flex items-center justify-center">
              <FiCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Approve Deposit</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">This will credit the user's account.</p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-700">
            <button onClick={() => setConfirmAction(null)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700">Cancel</button>
            <button onClick={() => handleApprove(confirmAction)} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {saving ? 'Processing...' : 'Approve'}
            </button>
          </div>
        </Modal>

        {/* Reject Modal */}
        <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Deposit">
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Please provide a reason for rejecting this deposit.</p>
            <textarea className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 !min-h-[100px]"
              placeholder="Enter rejection note..." value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-700">
            <button onClick={() => setRejectModal(null)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700">Cancel</button>
            <button onClick={handleReject} disabled={saving || !rejectNote.trim()} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
              {saving ? 'Processing...' : 'Reject'}
            </button>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
