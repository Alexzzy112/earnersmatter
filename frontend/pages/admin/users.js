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
  FiSearch, FiEye, FiEdit2, FiUserX, FiUserCheck, FiUsers, FiChevronLeft, FiChevronRight,
  FiTrendingUp, FiDollarSign, FiArrowUpRight
} from 'react-icons/fi';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewUser, setViewUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers({ page, search, limit: 15 });
      setUsers((res.data || []).filter(u => u.role !== 'admin'));
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleView = async (user) => {
    setViewUser(user);
    setDetailsLoading(true);
    setUserDetails(null);
    try {
      const res = await adminAPI.getUserById(user._id);
      setUserDetails(res.data.user || res.data);
    } catch (err) {
      toast.error('Failed to load user details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!suspendTarget) return;
    setSaving(true);
    try {
      if (suspendTarget.status === 'suspended') {
        await adminAPI.activateUser(suspendTarget._id);
        toast.success('User activated successfully');
      } else {
        await adminAPI.suspendUser(suspendTarget._id);
        toast.success('User suspended successfully');
      }
      setSuspendTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      await adminAPI.updateUser(editUser._id, {
        username: editUser.username,
        email: editUser.email,
        phone: editUser.phone,
        balance: editUser.balance,
      });
      toast.success('User updated successfully');
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">View and manage all registered users</p>
        </div>

        <div className="relative max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by username or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-900">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Username</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Balance</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12">
                      <LoadingSpinner className="mx-auto" />
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12">
                      <EmptyState icon={FiUsers} title="No users found" description={search ? 'Try a different search term' : undefined} />
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-gray-500 dark:text-gray-400">#{user._id?.slice(-6)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{user.username}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{user.phone || '—'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-green-600 dark:text-green-400">₦{(user.balance || 0).toLocaleString()}</td>
                      <td className="px-4 py-3"><StatusBadge status={user.status || 'active'} /></td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleView(user)} className="p-1.5 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20" title="View">
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditUser({ ...user })} className="p-1.5 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20" title="Edit">
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSuspendTarget(user)}
                            className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 ${
                              user.status === 'suspended' ? 'text-green-600 hover:text-green-700' : 'text-red-600 hover:text-red-700'
                            }`}
                            title={user.status === 'suspended' ? 'Activate' : 'Suspend'}
                          >
                            {user.status === 'suspended' ? <FiUserCheck className="w-4 h-4" /> : <FiUserX className="w-4 h-4" />}
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

        {/* View User Modal */}
        <Modal isOpen={!!viewUser} onClose={() => setViewUser(null)} title="User Details" size="2xl">
          {detailsLoading ? (
            <LoadingSpinner className="py-8" />
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Username</p>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">{viewUser?.username}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Email</p>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">{viewUser?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Phone</p>
                  <p className="text-gray-700 dark:text-gray-300 mt-1">{viewUser?.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Balance</p>
                  <p className="font-bold text-lg mt-1 text-green-600 dark:text-green-400">₦{(viewUser?.balance || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Status</p>
                  <div className="mt-1"><StatusBadge status={viewUser?.status || 'active'} /></div>
                </div>
              </div>

              {userDetails && (
                <div className="space-y-5 pt-4 border-t border-gray-200 dark:border-dark-700">
                  {userDetails.investments?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                        <FiTrendingUp className="w-4 h-4 text-purple-500" /> Investments ({userDetails.investments.length})
                      </h3>
                      <div className="space-y-1">
                        {userDetails.investments.map((inv) => (
                          <div key={inv._id} className="flex justify-between items-center text-sm p-2 rounded bg-gray-50 dark:bg-dark-700">
                            <span className="text-gray-700 dark:text-gray-300">{inv.product?.name || 'Product'}</span>
                            <span className="font-medium text-gray-900 dark:text-white">₦{inv.amount?.toLocaleString()}</span>
                            <StatusBadge status={inv.status} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {userDetails.deposits?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                        <FiDollarSign className="w-4 h-4 text-green-500" /> Deposits ({userDetails.deposits.length})
                      </h3>
                      <div className="space-y-1">
                        {userDetails.deposits.map((dep) => (
                          <div key={dep._id} className="flex justify-between items-center text-sm p-2 rounded bg-gray-50 dark:bg-dark-700">
                            <span className="font-medium text-gray-900 dark:text-white">₦{dep.amount?.toLocaleString()}</span>
                            <StatusBadge status={dep.status} />
                            <span className="text-gray-500 dark:text-gray-400 text-xs">{new Date(dep.createdAt).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {userDetails.withdrawals?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                        <FiArrowUpRight className="w-4 h-4 text-red-500" /> Withdrawals ({userDetails.withdrawals.length})
                      </h3>
                      <div className="space-y-1">
                        {userDetails.withdrawals.map((wd) => (
                          <div key={wd._id} className="flex justify-between items-center text-sm p-2 rounded bg-gray-50 dark:bg-dark-700">
                            <span className="font-medium text-gray-900 dark:text-white">₦{wd.amount?.toLocaleString()}</span>
                            <StatusBadge status={wd.status} />
                            <span className="text-gray-500 dark:text-gray-400 text-xs">{new Date(wd.createdAt).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(!userDetails.investments?.length && !userDetails.deposits?.length && !userDetails.withdrawals?.length) && (
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">No investments, deposits, or withdrawals yet.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Edit User Modal */}
        <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Edit User">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
              <input className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                value={editUser?.username || ''} onChange={(e) => setEditUser({ ...editUser, username: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input type="email" className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                value={editUser?.email || ''} onChange={(e) => setEditUser({ ...editUser, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
              <input className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                value={editUser?.phone || ''} onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Balance</label>
              <input type="number" step="0.01" className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                value={editUser?.balance || 0} onChange={(e) => setEditUser({ ...editUser, balance: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setEditUser(null)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700">Cancel</button>
              <button onClick={handleEditSave} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Suspend/Activate Confirmation */}
        <Modal isOpen={!!suspendTarget} onClose={() => setSuspendTarget(null)} title="" size="sm">
          <div className="text-center">
            <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center ${
              suspendTarget?.status === 'suspended' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}>
              {suspendTarget?.status === 'suspended' ? <FiUserCheck className="w-6 h-6" /> : <FiUserX className="w-6 h-6" />}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {suspendTarget?.status === 'suspended' ? 'Activate User' : 'Suspend User'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Are you sure you want to {suspendTarget?.status === 'suspended' ? 'activate' : 'suspend'}?
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{suspendTarget?.username}</p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-700">
            <button onClick={() => setSuspendTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700">Cancel</button>
            <button onClick={handleSuspend} disabled={saving}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 ${
                suspendTarget?.status === 'suspended' ? 'bg-primary-600 hover:bg-primary-700' : 'bg-red-600 hover:bg-red-700'
              }`}>
              {saving ? 'Processing...' : suspendTarget?.status === 'suspended' ? 'Activate' : 'Suspend'}
            </button>
          </div>
        </Modal>

      </div>
    </AdminLayout>
  );
}
