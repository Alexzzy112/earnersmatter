'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  FiPieChart, FiBarChart2, FiDownload, FiCalendar, FiDollarSign,
  FiArrowUpRight, FiTrendingUp, FiRefreshCw
} from 'react-icons/fi';

const tabs = [
  { key: 'transactions', label: 'Transactions Stats', icon: FiPieChart },
  { key: 'deposits', label: 'Deposit Report', icon: FiDollarSign },
  { key: 'withdrawals', label: 'Withdrawal Report', icon: FiArrowUpRight },
  { key: 'earnings', label: 'Earnings Report', icon: FiTrendingUp },
];

const dateRanges = ['daily', 'weekly', 'monthly'];

function SimpleBarChart({ data, color = '#3b82f6', height = 200 }) {
  if (!data?.length) return null;
  const maxVal = Math.max(...data.map((d) => d.value || 0), 1);
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((item, idx) => {
        const pct = (item.value / maxVal) * 100;
        return (
          <div key={idx} className="flex flex-col items-center flex-1" title={`${item.label}: ${item.value}`}>
            <span className="text-xs font-medium mb-1 text-gray-500 dark:text-gray-400">{item.value}</span>
            <div className="w-full rounded-t transition-all hover:opacity-80"
              style={{ height: `${Math.max(pct, 2)}%`, backgroundColor: color, minWidth: 20, maxWidth: 60 }} />
            <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate w-full text-center">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function SimplePieChart({ data, size = 200 }) {
  if (!data?.length) return null;
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const colors = ['#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
  let cumulativePercent = 0;
  const slices = data.map((d, idx) => {
    const percent = d.value / total;
    const startAngle = cumulativePercent * 360;
    cumulativePercent += percent;
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = ((startAngle + percent * 360) - 90) * (Math.PI / 180);
    const x1 = size / 2 + (size / 2) * Math.cos(startRad);
    const y1 = size / 2 + (size / 2) * Math.sin(startRad);
    const x2 = size / 2 + (size / 2) * Math.cos(endRad);
    const y2 = size / 2 + (size / 2) * Math.sin(endRad);
    const largeArc = percent > 0.5 ? 1 : 0;
    const pathData = `M ${size / 2} ${size / 2} L ${x1} ${y1} A ${size / 2} ${size / 2} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return { pathData, color: colors[idx % colors.length], label: d.label, percent, value: d.value };
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((slice, idx) => (
          <path key={idx} d={slice.pathData} fill={slice.color} stroke="white" strokeWidth="2" />
        ))}
        <circle cx={size / 2} cy={size / 2} r={size / 4} fill="var(--tw-bg-opacity, #fff)" className="fill-white dark:fill-dark-800" />
      </svg>
      <div className="flex flex-wrap gap-3 justify-center">
        {slices.map((slice, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: slice.color }} />
            <span className="text-gray-500 dark:text-gray-400">{slice.label}</span>
            <span className="font-medium text-gray-900 dark:text-white">{(slice.percent * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminReports() {
  const [activeTab, setActiveTab] = useState('transactions');
  const [dateRange, setDateRange] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [txStats, setTxStats] = useState(null);
  const [depositReport, setDepositReport] = useState([]);
  const [withdrawalReport, setWithdrawalReport] = useState([]);
  const [earningsReport, setEarningsReport] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [txRes, depRes, wdRes, earnRes] = await Promise.all([
        adminAPI.getTransactionStats(),
        adminAPI.getDepositReport({ range: dateRange }),
        adminAPI.getWithdrawalReport({ range: dateRange }),
        adminAPI.getEarningsReport({ range: dateRange }),
      ]);
      setTxStats(txRes.data);
      setDepositReport(depRes.data || []);
      setWithdrawalReport(wdRes.data || []);
      setEarningsReport(earnRes.data || []);
    } catch (err) { toast.error('Failed to load report data'); }
    finally { setLoading(false); }
  }, [dateRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await adminAPI.exportReport();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `report-${activeTab}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('Report exported');
    } catch (err) { toast.error('Failed to export report'); }
    finally { setExporting(false); }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">View platform reports and analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchData} disabled={loading} className="p-2.5 rounded-lg border border-gray-200 dark:border-dark-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700">
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={handleExport} disabled={exporting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50">
              <FiDownload className="w-4 h-4" /> {exporting ? 'Exporting...' : 'Export Data'}
            </button>
          </div>
        </div>

        <div className="flex gap-1 border-b border-gray-200 dark:border-dark-700 pb-2 overflow-x-auto">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === key ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700'
              }`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {dateRanges.map((range) => (
            <button key={range} onClick={() => setDateRange(range)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                dateRange === range ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700'
              }`}>
              <FiCalendar className="w-3.5 h-3.5" /> {range}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-12">
            <LoadingSpinner className="mx-auto" />
          </div>
        ) : activeTab === 'transactions' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Transaction Distribution</h2>
              {txStats ? (
                <SimplePieChart data={[
                  { label: 'Deposits', value: txStats.totalDeposits || txStats.deposits || 0 },
                  { label: 'Withdrawals', value: txStats.totalWithdrawals || txStats.withdrawals || 0 },
                  { label: 'Earnings', value: txStats.totalEarnings || txStats.earnings || 0 },
                  { label: 'Investments', value: txStats.totalInvestments || txStats.investments || 0 },
                ]} />
              ) : <p className="text-center text-gray-400 py-8">No data available</p>}
            </div>
            <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Summary</h2>
              {txStats ? (
                <div className="space-y-3">
                  {[
                    { label: 'Total Deposits', value: txStats.totalDeposits || txStats.deposits || 0, color: 'text-green-600 dark:text-green-400' },
                    { label: 'Total Withdrawals', value: txStats.totalWithdrawals || txStats.withdrawals || 0, color: 'text-red-600 dark:text-red-400' },
                    { label: 'Total Earnings', value: txStats.totalEarnings || txStats.earnings || 0, color: 'text-purple-600 dark:text-purple-400' },
                    { label: 'Total Investments', value: txStats.totalInvestments || txStats.investments || 0, color: 'text-blue-600 dark:text-blue-400' },
                    { label: 'Pending', value: txStats.pendingCount || txStats.pending || 0, color: 'text-amber-600 dark:text-amber-400' },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-dark-700 last:border-0">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{item.label}</span>
                      <span className={`font-semibold ${item.color}`}>
                        {typeof item.value === 'number' ? `₦${item.value.toLocaleString()}` : item.value}
                      </span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-center text-gray-400 py-8">No data available</p>}
            </div>
          </div>
        )}

        {!loading && activeTab === 'deposits' && (
          <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 capitalize">Deposit Report ({dateRange})</h2>
            {depositReport.length > 0 ? <SimpleBarChart data={depositReport} color="#22c55e" />
              : <p className="text-center text-gray-400 py-12"><FiDollarSign className="w-10 h-10 mx-auto mb-3 opacity-50" />No deposit data for this period</p>}
          </div>
        )}

        {!loading && activeTab === 'withdrawals' && (
          <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 capitalize">Withdrawal Report ({dateRange})</h2>
            {withdrawalReport.length > 0 ? <SimpleBarChart data={withdrawalReport} color="#ef4444" />
              : <p className="text-center text-gray-400 py-12"><FiArrowUpRight className="w-10 h-10 mx-auto mb-3 opacity-50" />No withdrawal data for this period</p>}
          </div>
        )}

        {!loading && activeTab === 'earnings' && (
          <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 capitalize">Earnings Report ({dateRange})</h2>
            {earningsReport.length > 0 ? <SimpleBarChart data={earningsReport} color="#8b5cf6" />
              : <p className="text-center text-gray-400 py-12"><FiTrendingUp className="w-10 h-10 mx-auto mb-3 opacity-50" />No earnings data for this period</p>}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
