'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import toast from 'react-hot-toast';
import {
  FiSettings, FiSave, FiGlobe, FiDollarSign, FiPercent, FiUsers,
  FiToggleLeft, FiToggleRight, FiRefreshCw, FiInfo
} from 'react-icons/fi';

const settingFields = [
  { key: 'siteName', label: 'Site Name', type: 'text', icon: FiGlobe, section: 'General' },
  { key: 'siteDescription', label: 'Site Description', type: 'textarea', icon: FiInfo, section: 'General' },
  { key: 'minDeposit', label: 'Min Deposit', type: 'number', icon: FiDollarSign, section: 'Deposits', step: '0.01' },
  { key: 'maxDeposit', label: 'Max Deposit', type: 'number', icon: FiDollarSign, section: 'Deposits', step: '0.01' },
  { key: 'minWithdrawal', label: 'Min Withdrawal', type: 'number', icon: FiDollarSign, section: 'Withdrawals', step: '0.01' },
  { key: 'maxWithdrawal', label: 'Max Withdrawal', type: 'number', icon: FiDollarSign, section: 'Withdrawals', step: '0.01' },
  { key: 'withdrawalCharge', label: 'Withdrawal Charge %', type: 'number', icon: FiPercent, section: 'Withdrawals', step: '0.1' },
  { key: 'referralBonus', label: 'Referral Bonus Amount', type: 'number', icon: FiUsers, section: 'Referrals', step: '0.01' },
  { key: 'bonusType', label: 'Bonus Type', type: 'select', icon: FiUsers, section: 'Referrals', options: ['fixed', 'percentage'] },
  { key: 'currencySymbol', label: 'Currency Symbol', type: 'text', icon: FiDollarSign, section: 'General' },
  { key: 'maintenanceMode', label: 'Maintenance Mode', type: 'toggle', icon: FiSettings, section: 'System' },
];

const sections = [...new Set(settingFields.map((f) => f.section))];

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getSettings();
      setSettings(res.data || {});
    } catch (err) { toast.error('Failed to load settings'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async (key, value) => {
    setSaving((prev) => ({ ...prev, [key]: true }));
    try {
      await adminAPI.updateSetting(key, value);
      toast.success(`${settingFields.find((f) => f.key === key)?.label || key} updated`);
      setSettings((prev) => ({ ...prev, [key]: value }));
    } catch (err) { toast.error(err.response?.data?.message || `Failed to update ${key}`); }
    finally { setSaving((prev) => ({ ...prev, [key]: false })); }
  };

  const handleChange = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Site Settings</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage platform configuration</p>
          </div>
          <button onClick={fetchSettings} disabled={loading} className="p-2.5 rounded-lg border border-gray-200 dark:border-dark-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700">
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-8">
            <LoadingSpinner className="mx-auto" />
          </div>
        ) : Object.keys(settings).length === 0 ? (
          <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700">
            <EmptyState icon={FiSettings} title="No settings found" description="Settings will appear here once configured." />
          </div>
        ) : (
          <div className="space-y-6">
            {sections.map((section) => (
              <div key={section} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-5">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-3 border-b border-gray-200 dark:border-dark-700">{section}</h2>
                <div className="space-y-5">
                  {settingFields.filter((f) => f.section === section).map(({ key, label, type, icon: Icon, step, options }) => {
                    const value = settings[key];

                    if (type === 'toggle') {
                      return (
                        <div key={key} className="flex items-center justify-between py-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-dark-700 flex items-center justify-center">
                              <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </div>
                            <p className="font-medium text-sm text-gray-900 dark:text-white">{label}</p>
                          </div>
                          <button onClick={() => handleSave(key, !value)}
                            className={`text-2xl transition-colors ${value ? 'text-green-500' : 'text-gray-300 dark:text-gray-600'}`}
                            title={value ? 'Turn off' : 'Turn on'}>
                            {value ? <FiToggleRight /> : <FiToggleLeft />}
                          </button>
                        </div>
                      );
                    }

                    if (type === 'select') {
                      return (
                        <div key={key}>
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" /> {label}
                          </label>
                          <div className="flex gap-2">
                            <select className="flex-1 px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                              value={value || options?.[0] || ''} onChange={(e) => handleChange(key, e.target.value)}>
                              {options?.map((opt) => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}
                            </select>
                            <button onClick={() => handleSave(key, settings[key])} disabled={saving[key]}
                              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50">
                              <FiSave className="w-3.5 h-3.5" /> {saving[key] ? '...' : 'Save'}
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={key}>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" /> {label}
                        </label>
                        <div className="flex gap-2">
                          {type === 'textarea' ? (
                            <textarea className="flex-1 px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 !min-h-[80px]"
                              value={value || ''} onChange={(e) => handleChange(key, e.target.value)} />
                          ) : (
                            <input type={type} step={step}
                              className="flex-1 px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                              value={value ?? ''} onChange={(e) => handleChange(key, type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)} />
                          )}
                          <button onClick={() => handleSave(key, settings[key])} disabled={saving[key]}
                            className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex-shrink-0">
                            <FiSave className="w-3.5 h-3.5" /> {saving[key] ? '...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
