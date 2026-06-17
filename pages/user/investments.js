'use client';
import { useState, useEffect } from 'react';
import { investmentAPI } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { FiTrendingUp, FiRefreshCw, FiX, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';

const statusBadge = (status) => {
  const map = {
    active: 'badge badge-success',
    completed: 'badge badge-primary',
    cancelled: 'badge badge-danger',
    pending: 'badge badge-warning',
  };
  return <span className={map[status] || 'badge badge-neutral'}>{status}</span>;
};

const calcDaysRemaining = (endDate) => {
  if (!endDate) return 0;
  const diff = new Date(endDate) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await investmentAPI.getAll();
        setInvestments(res.data.investments || res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load investments');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const viewDetail = async (inv) => {
    try {
      const res = await investmentAPI.getById(inv._id);
      setSelected(res.data.investment || res.data);
    } catch (err) {
      toast.error('Failed to load investment details');
    }
  };

  if (loading) return <DashboardLayout><LoadingSpinner text="Loading investments..." /></DashboardLayout>;
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
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white">My Investments</h1>
          <p className="text-dark-400 text-sm mt-1">Track your investment portfolio</p>
        </div>

        {investments.length === 0 ? (
          <div className="text-center py-16">
            <FiTrendingUp size={48} className="mx-auto text-dark-300 dark:text-dark-600 mb-4" />
            <h2 className="text-xl font-semibold text-dark-600 dark:text-dark-400">No investments yet</h2>
            <p className="text-dark-400 text-sm mt-1">Browse products and start investing today</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {investments.map((inv) => (
              <div
                key={inv._id}
                onClick={() => viewDetail(inv)}
                className="card-hover p-5 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-dark-900 dark:text-white">{inv.productId?.name || inv.product?.name || 'Investment'}</h3>
                    <p className="text-xs text-dark-400">ID: {inv._id?.slice(-8)}</p>
                  </div>
                  {statusBadge(inv.status)}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-400">Amount Invested</span>
                    <span className="font-semibold text-dark-900 dark:text-white">₦{Number(inv.totalCost || inv.amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-400">Daily Earnings</span>
                    <span className="font-semibold text-success-500">+₦{Number(inv.dailyEarnings || inv.productId?.dailyEarnings || inv.product?.dailyEarnings).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-400">Earnings Received</span>
                    <span className="font-semibold text-success-500">₦{Number(inv.earningsReceived || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-400">Days Remaining</span>
                    <span className="font-semibold text-dark-900 dark:text-white">{calcDaysRemaining(inv.endDate)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-dark-900 dark:text-white">Investment Details</h2>
              <button onClick={() => setSelected(null)} className="text-dark-400 hover:text-dark-600 dark:hover:text-dark-200">
                <FiX size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-dark-50 dark:bg-dark-800 rounded-lg">
                  <p className="text-xs text-dark-400">Product</p>
                  <p className="font-medium text-dark-900 dark:text-white">{selected.productId?.name || selected.product?.name || 'N/A'}</p>
                </div>
                <div className="p-3 bg-dark-50 dark:bg-dark-800 rounded-lg">
                  <p className="text-xs text-dark-400">Status</p>
                  <div>{statusBadge(selected.status)}</div>
                </div>
                <div className="p-3 bg-dark-50 dark:bg-dark-800 rounded-lg">
                  <p className="text-xs text-dark-400">Quantity</p>
                  <p className="font-semibold text-dark-900 dark:text-white">{selected.quantity || 1}</p>
                </div>
                <div className="p-3 bg-dark-50 dark:bg-dark-800 rounded-lg">
                  <p className="text-xs text-dark-400">Unit Price</p>
                  <p className="font-semibold text-dark-900 dark:text-white">₦{Number(
                    selected.totalCost && selected.quantity
                      ? selected.totalCost / selected.quantity
                      : selected.productId?.price || 0
                  ).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-dark-50 dark:bg-dark-800 rounded-lg">
                  <p className="text-xs text-dark-400">Amount Invested</p>
                  <p className="font-semibold text-dark-900 dark:text-white">₦{Number(selected.totalCost || selected.amount).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-dark-50 dark:bg-dark-800 rounded-lg">
                  <p className="text-xs text-dark-400">Daily Earnings</p>
                  <p className="font-semibold text-success-500">+₦{Number(selected.dailyEarnings || 0).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-dark-50 dark:bg-dark-800 rounded-lg">
                  <p className="text-xs text-dark-400">Earnings Received</p>
                  <p className="font-semibold text-success-500">₦{Number(selected.earningsReceived || 0).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-dark-50 dark:bg-dark-800 rounded-lg">
                  <p className="text-xs text-dark-400">Total Expected</p>
                  <p className="font-semibold text-primary-500">₦{Number(
                    (selected.dailyEarnings || 0) * ((selected.productId?.duration || selected.duration) || 30)
                  ).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-dark-50 dark:bg-dark-800 rounded-lg">
                  <p className="text-xs text-dark-400">Days Remaining</p>
                  <p className="font-semibold text-dark-900 dark:text-white">{calcDaysRemaining(selected.endDate)}</p>
                </div>
                <div className="p-3 bg-dark-50 dark:bg-dark-800 rounded-lg">
                  <p className="text-xs text-dark-400">Start Date</p>
                  <p className="font-semibold text-dark-900 dark:text-white text-sm">{selected.startDate ? new Date(selected.startDate).toLocaleDateString() : '-'}</p>
                </div>
                <div className="p-3 bg-dark-50 dark:bg-dark-800 rounded-lg">
                  <p className="text-xs text-dark-400">End Date</p>
                  <p className="font-semibold text-dark-900 dark:text-white text-sm">{selected.endDate ? new Date(selected.endDate).toLocaleDateString() : '-'}</p>
                </div>
              </div>

              {/* Earnings Schedule */}
              {selected.earningsSchedule && selected.earningsSchedule.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-dark-900 dark:text-white mb-2 flex items-center gap-2">
                    <FiCalendar size={14} /> Earnings Schedule
                  </h3>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Day</th>
                          <th>Amount</th>
                          <th>Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selected.earningsSchedule.map((entry, i) => (
                          <tr key={i}>
                            <td className="text-xs text-dark-400">Day {entry.day || i + 1}</td>
                            <td className="text-success-500 font-medium">+₦{Number(entry.amount).toLocaleString()}</td>
                            <td className="text-xs text-dark-400">
                              {entry.date ? new Date(entry.date).toLocaleDateString() : '-'}
                            </td>
                            <td>{statusBadge(entry.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
