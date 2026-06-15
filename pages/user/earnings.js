'use client';
import { useState, useEffect } from 'react';
import { earningAPI } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import StatsCard from '@/components/shared/StatsCard';
import { FiBarChart2, FiDollarSign, FiRefreshCw, FiSearch } from 'react-icons/fi';

export default function EarningsPage() {
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = async (start, end) => {
    setLoading(true);
    try {
      const params = {};
      if (start) params.startDate = start;
      if (end) params.endDate = end;
      const res = await earningAPI.getAll(params);
      setEarnings(res.data.earnings || res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load earnings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchData(startDate, endDate);
  };

  const totalEarnings = earnings.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  if (loading) return <DashboardLayout><LoadingSpinner /></DashboardLayout>;
  if (error) return (
    <DashboardLayout>
      <div className="text-center py-16">
        <FiRefreshCw size={48} className="mx-auto text-danger-400 mb-4" />
        <h2 className="text-xl font-semibold text-dark-800 dark:text-dark-200 mb-2">Something went wrong</h2>
        <p className="text-dark-400 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary">Try Again</button>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Earnings History</h1>
          <p className="text-dark-400 text-sm mt-1">Track all your earnings</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            icon={FiDollarSign}
            title="Total Earnings"
            value={`₦${totalEarnings.toLocaleString()}`}
            color="green"
          />
          <StatsCard
            icon={FiBarChart2}
            title="This Period"
            value={`₦${totalEarnings.toLocaleString()}`}
            color="blue"
          />
        </div>

        {/* Date Filter */}
        <form onSubmit={handleFilter} className="card p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-dark-500 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-500 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field"
              />
            </div>
            <button type="submit" className="btn-primary">
              <FiSearch size={14} /> Filter
            </button>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => { setStartDate(''); setEndDate(''); fetchData(); }}
                className="btn-secondary"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        {/* Earnings Table */}
        {earnings.length === 0 ? (
          <div className="text-center py-16">
            <FiBarChart2 size={48} className="mx-auto text-dark-300 dark:text-dark-600 mb-4" />
            <h2 className="text-xl font-semibold text-dark-600 dark:text-dark-400">No earnings yet</h2>
            <p className="text-dark-400 text-sm mt-1">Your earnings will appear here once you have active investments</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Description</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {earnings.map((earn) => (
                  <tr key={earn._id}>
                    <td className="text-xs text-dark-400 whitespace-nowrap">
                      {new Date(earn.createdAt || earn.date).toLocaleDateString()}
                    </td>
                    <td className="text-success-500 font-semibold">+₦{Number(earn.amount).toLocaleString()}</td>
                    <td className="text-dark-600 dark:text-dark-300">{earn.description || earn.note || '-'}</td>
                    <td className="font-medium">₦{Number(earn.balance || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
