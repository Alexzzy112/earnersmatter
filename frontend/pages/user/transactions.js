'use client';
import { useState, useEffect } from 'react';
import { walletAPI } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { FiRefreshCw, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const typeConfig = {
  deposit: { color: 'badge badge-success', label: 'Deposit' },
  withdrawal: { color: 'badge badge-danger', label: 'Withdrawal' },
  investment: { color: 'badge badge-primary', label: 'Investment' },
  earning: { color: 'badge badge-success', label: 'Earning' },
  referral: { color: 'badge badge-warning', label: 'Referral' },
  transfer: { color: 'badge badge-neutral', label: 'Transfer' },
};

const statusBadge = (status) => {
  const map = {
    completed: 'badge badge-success',
    approved: 'badge badge-success',
    pending: 'badge badge-warning',
    failed: 'badge badge-danger',
    rejected: 'badge badge-danger',
    processing: 'badge badge-primary',
  };
  return <span className={map[status] || 'badge badge-neutral'}>{status}</span>;
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 15;

  const fetchData = async (p) => {
    setLoading(true);
    try {
      const res = await walletAPI.getTransactions({ page: p, limit });
      const data = res.data;
      setTransactions(data.transactions || data);
      setTotalPages(data.totalPages || Math.ceil((data.total || 0) / limit) || 1);
      setPage(p);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
  }, []);

  if (loading && transactions.length === 0) return <DashboardLayout><LoadingSpinner text="Loading transactions..." /></DashboardLayout>;
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
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Transactions</h1>
          <p className="text-dark-400 text-sm mt-1">Your complete transaction history</p>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-16">
            <FiRefreshCw size={48} className="mx-auto text-dark-300 dark:text-dark-600 mb-4" />
            <h2 className="text-xl font-semibold text-dark-600 dark:text-dark-400">No transactions yet</h2>
            <p className="text-dark-400 text-sm mt-1">Your transactions will appear here</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Balance</th>
                    <th>Description</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const config = typeConfig[tx.type] || { color: 'badge badge-neutral', label: tx.type };
                    const isCredit = ['deposit', 'earning', 'referral'].includes(tx.type) || tx.type === 'credit';
                    const isDebit = ['withdrawal', 'investment'].includes(tx.type) || tx.type === 'debit';
                    return (
                      <tr key={tx._id}>
                        <td className="text-xs text-dark-400 whitespace-nowrap">
                          {new Date(tx.createdAt || tx.date).toLocaleDateString()}
                        </td>
                        <td>
                          <span className={config.color}>{config.label}</span>
                        </td>
                        <td className={isDebit ? 'text-danger-500 font-medium' : 'text-success-500 font-medium'}>
                          {isDebit ? '-' : '+'}₦{Number(tx.amount).toLocaleString()}
                        </td>
                        <td className="font-medium">₦{Number(tx.balance || 0).toLocaleString()}</td>
                        <td className="text-dark-500 text-sm max-w-[200px] truncate">{tx.description || tx.note || '-'}</td>
                        <td>{statusBadge(tx.status)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => fetchData(page - 1)}
                  disabled={page <= 1}
                  className="btn-secondary px-3 py-2 disabled:opacity-40"
                >
                  <FiChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .map((p, idx, arr) => (
                    <span key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-dark-400 px-1">...</span>}
                      <button
                        onClick={() => fetchData(p)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                          p === page
                            ? 'bg-primary-500 text-white'
                            : 'text-dark-500 hover:bg-dark-100 dark:hover:bg-dark-800'
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                <button
                  onClick={() => fetchData(page + 1)}
                  disabled={page >= totalPages}
                  className="btn-secondary px-3 py-2 disabled:opacity-40"
                >
                  <FiChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
