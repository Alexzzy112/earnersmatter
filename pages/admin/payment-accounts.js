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
  FiCreditCard, FiPlus, FiEdit2, FiPower, FiAlertTriangle, FiClock, FiHash, FiHome, FiType, FiStar
} from 'react-icons/fi';

const emptyAccount = { accountName: '', accountNumber: '', bankName: '', accountType: 'bank', isActive: false, isDefault: false };

export default function AdminPaymentAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [switchHistory, setSwitchHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ ...emptyAccount });
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showWarning, setShowWarning] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [acctRes, histRes] = await Promise.all([adminAPI.getPaymentAccounts(), adminAPI.getSwitchHistory()]);
      setAccounts(acctRes.data || []);
      setSwitchHistory(histRes.data || []);
    } catch (err) { toast.error('Failed to load payment accounts'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setFormData({ ...emptyAccount }); setEditing(null); setShowForm(true); };
  const openEdit = (account) => {
    setFormData({ accountName: account.accountName || '', accountNumber: account.accountNumber || '', bankName: account.bankName || '', accountType: account.accountType || 'bank', isActive: account.isActive || false });
    setEditing(account._id); setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.accountName || !formData.accountNumber) { toast.error('Account name and number are required'); return; }
    setSaving(true);
    try {
      if (editing) { await adminAPI.updatePaymentAccount(editing, formData); toast.success('Account updated'); }
      else { await adminAPI.createPaymentAccount(formData); toast.success('Account created'); }
      setShowForm(false); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save account'); }
    finally { setSaving(false); }
  };

  const handleActivate = async (id) => {
    setSaving(true);
    try { await adminAPI.activateAccount(id); toast.success('Account activated'); setShowWarning(null); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to activate account'); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async (id) => {
    setSaving(true);
    try { await adminAPI.deactivateAccount(id); toast.success('Account deactivated'); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to deactivate account'); }
    finally { setSaving(false); }
  };

  const handleSetDefault = async (id) => {
    setSaving(true);
    try { await adminAPI.setDefaultAccount(id); toast.success('Default account updated'); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to update default account'); }
    finally { setSaving(false); }
  };

  const hasActive = accounts.some((a) => a.isActive);
  const activeAccount = accounts.find((a) => a.isActive);
  const defaultAccount = accounts.find((a) => a.isDefault);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Accounts</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage payment accounts for deposits</p>
          </div>
          {accounts.length < 3 && (
            <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700">
              <FiPlus className="w-4 h-4" /> Add Account
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-5 animate-pulse">
                <div className="h-4 w-2/3 bg-gray-200 dark:bg-dark-700 rounded mb-3" />
                <div className="h-3 w-full bg-gray-200 dark:bg-dark-700 rounded mb-2" />
                <div className="h-3 w-1/2 bg-gray-200 dark:bg-dark-700 rounded" />
              </div>
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700">
            <EmptyState icon={FiCreditCard} title="No payment accounts" description="Add payment accounts for users to deposit funds."
              action={<button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"><FiPlus className="w-4 h-4" /> Add Account</button>} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <div key={account._id}
                className={`bg-white dark:bg-dark-800 rounded-xl border p-5 hover:shadow-md transition-shadow ${
                  account.isActive
                    ? 'border-green-300 dark:border-green-700 ring-2 ring-green-500/20'
                    : 'border-gray-200 dark:border-dark-700 opacity-75'
                }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      account.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-dark-700 text-gray-400'
                    }`}>
                      <FiCreditCard className="w-5 h-5" />
                    </div>
                      <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{account.accountName}</h3>
                      <div className="mt-1 flex items-center gap-2">
                        <StatusBadge status={account.isActive ? 'active' : 'inactive'} />
                        {account.isDefault && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700">
                            <FiStar className="w-3 h-3" /> DEFAULT
                          </span>
                        )}
                        {account.isActive && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            ACCEPTING PAYMENTS
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(account)} className="p-1.5 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20" title="Edit">
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleSetDefault(account._id)}
                      className={`p-1.5 rounded-lg ${account.isDefault ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'}`}
                      title={account.isDefault ? 'Remove Default' : 'Set as Default'}>
                      <FiStar className="w-4 h-4" />
                    </button>
                    {account.isActive ? (
                      <button onClick={() => handleDeactivate(account._id)} className="p-1.5 rounded-lg text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20" title="Deactivate">
                        <FiPower className="w-4 h-4" />
                      </button>
                    ) : (
                      <button onClick={() => hasActive ? setShowWarning(account._id) : handleActivate(account._id)}
                        className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20" title="Activate">
                        <FiPower className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2"><FiHash className="w-3.5 h-3.5" /><span className="font-mono">{account.accountNumber}</span></div>
                  <div className="flex items-center gap-2"><FiHome className="w-3.5 h-3.5" /><span>{account.bankName}</span></div>
                  <div className="flex items-center gap-2"><FiType className="w-3.5 h-3.5" /><span className="capitalize">{(account.accountType || 'bank').replace('_', ' ')}</span></div>
                  {account.isActive && (
                    <div className="pt-1">
                      {account.isDefault ? (
                        <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                          <FiStar className="w-3 h-3" /> No auto-rotate (Default)
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-400">Auto-rotate</span>
                            <span className="font-medium text-gray-600 dark:text-gray-300">{account.assignmentCount || 0}/3</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-1.5">
                            <div className="bg-primary-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(((account.assignmentCount || 0) / 3) * 100, 100)}%` }} />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {switchHistory.length > 0 && (
          <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiClock className="w-5 h-5 text-primary-500" /> Account Switch History
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-900">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Previous Account</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">New Account</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Initiated By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                  {switchHistory.map((entry, idx) => (
                    <tr key={entry._id || idx} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{entry.previousAccountId?.accountName || '—'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-green-600 dark:text-green-400">{entry.newAccountId?.accountName || '—'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          entry.switchType === 'auto'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                            : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                        }`}>
                          {entry.switchType === 'auto' ? 'Auto' : 'Manual'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{entry.switchedAt ? new Date(entry.switchedAt).toLocaleString() : '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{entry.switchedBy?.username || 'System'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Account' : 'Add Payment Account'}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Name *</label>
              <input className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                value={formData.accountName} onChange={(e) => setFormData({ ...formData, accountName: e.target.value })} placeholder="e.g. Bank BCA - John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Number *</label>
              <input className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                value={formData.accountNumber} onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })} placeholder="1234567890" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bank Name</label>
              <input className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                value={formData.bankName} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} placeholder="e.g. Bank BCA" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
              <select className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                value={formData.accountType} onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}>
                <option value="bank">Bank</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="crypto">Crypto</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Accepting Payments</label>
              <label className="relative inline-flex items-center cursor-pointer mt-1">
                <input type="checkbox" className="sr-only peer"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                <span className="ms-3 text-sm text-gray-700 dark:text-gray-300">{formData.isActive ? 'Active' : 'Inactive'}</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-700">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700">Cancel</button>
            <button onClick={handleSave} disabled={saving || !formData.accountName || !formData.accountNumber}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {saving ? 'Saving...' : editing ? 'Update' : 'Add Account'}
            </button>
          </div>
        </Modal>

        <Modal isOpen={!!showWarning} onClose={() => setShowWarning(null)} title="" size="sm">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 mx-auto mb-4 flex items-center justify-center">
              <FiAlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Warning</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This will deactivate the current active account (<strong>{activeAccount?.accountName}</strong>). Are you sure?
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-700">
            <button onClick={() => setShowWarning(null)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700">Cancel</button>
            <button onClick={() => handleActivate(showWarning)} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {saving ? 'Processing...' : 'Yes, Activate'}
            </button>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
