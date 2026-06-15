export async function getServerSideProps() {
  return { props: {} };
}

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { dashboardAPI, investmentAPI, walletAPI } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/shared/StatsCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { FiDollarSign, FiTrendingUp, FiPackage, FiArrowUpRight, FiRefreshCw, FiBriefcase, FiCheckCircle } from 'react-icons/fi';
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

export default function UserDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [balance, setBalance] = useState(0);
  const [countdown, setCountdown] = useState('');

  const d = data || {};
  const recentTransactions = d.recentTransactions || [];
  const recentInvestments = d.recentInvestments || d.investments || [];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, balanceRes, invRes] = await Promise.all([
          dashboardAPI.get(),
          walletAPI.getBalance(),
          investmentAPI.getAll({ limit: 5, status: 'active' }),
        ]);
        const dashData = dashRes.data || dashRes;
        dashData.recentInvestments = invRes?.data ?? invRes ?? [];
        setData(dashData);
        setBalance(balanceRes.data?.walletBalance || balanceRes?.walletBalance || 0);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!recentInvestments?.length) return;
    const nextEarning = new Date(recentInvestments[0].nextEarningAt);
    if (isNaN(nextEarning.getTime())) return;

    const timer = setInterval(() => {
      const now = new Date();
      const diff = nextEarning - now;
      if (diff <= 0) {
        setCountdown('Processing...');
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, [recentInvestments]);

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

  const stats = [
    { title: 'Wallet Balance', value: `₦${Number(balance).toLocaleString()}`, icon: FiDollarSign, color: 'blue' },
    { title: 'Total Deposits', value: `₦${Number(d.totalDeposits).toLocaleString()}`, icon: FiArrowUpRight, color: 'green' },
    { title: 'Total Withdrawals', value: `₦${Number(d.totalWithdrawals).toLocaleString()}`, icon: FiRefreshCw, color: 'red' },
    { title: 'Total Investments', value: `₦${Number(d.totalInvestments).toLocaleString()}`, icon: FiBriefcase, color: 'yellow' },
    { title: 'Total Earnings', value: `₦${Number(d.totalEarnings).toLocaleString()}`, icon: FiTrendingUp, color: 'green' },
    { title: 'Active Products', value: d.activeInvestments ?? 0, icon: FiPackage, color: 'purple' },
    { title: 'Completed Products', value: d.completedInvestments ?? 0, icon: FiCheckCircle, color: 'green' },
  ];

  return (
    <DashboardLayout>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track {
          overflow: hidden;
          white-space: nowrap;
          position: relative;
          width: 100%;
        }
        .marquee-content {
          display: inline-block;
          white-space: nowrap;
          animation: marquee 60s linear infinite;
          padding-left: 100%;
        }
      `}</style>

      <div className="space-y-6">
        {/* Fake Withdrawal Marquee */}
        <div className="marquee-track bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg py-2 px-4 text-sm text-success-700 dark:text-success-300">
          <div className="marquee-content">
            {(() => {
              const items = [
                'Chisom O. withdrew ₦15,000',
                'Emeka N. withdrew ₦25,500',
                'Aisha B. withdrew ₦10,000',
                'David A. withdrew ₦50,000',
                'Grace E. withdrew ₦8,500',
                'Samuel K. withdrew ₦35,000',
                'Blessing W. withdrew ₦20,000',
                'Michael T. withdrew ₦45,000',
                'Jennifer D. withdrew ₦12,000',
                'Patrick O. withdrew ₦60,000',
                'Ngozi F. withdrew ₦18,500',
                'Ibrahim S. withdrew ₦30,000',
                'Funke A. withdrew ₦22,000',
                'Tunde R. withdrew ₦40,000',
                'Esther M. withdrew ₦16,000',
                'Kehinde J. withdrew ₦55,000',
              ];
              const text = items.join('      •      ');
              return text + '      •      ' + text;
            })()}
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Dashboard</h1>
          <p className="text-dark-400 text-sm mt-1">Welcome back, {data?.user?.username || 'Investor'}!</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {stats.map((s, i) => (
            <StatsCard key={i} {...s} />
          ))}
        </div>

        {/* Next Earnings Countdown */}
        {recentInvestments?.length > 0 && (
          <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-xl p-6 text-white mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Next Earnings</h3>
                <p className="text-primary-100 text-sm">Your next earnings will be credited in:</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{countdown}</div>
                <p className="text-primary-100 text-sm mt-1">{recentInvestments.length} active investment{recentInvestments.length > 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Link href="/user/wallet" className="btn-primary">
            <FiDollarSign size={16} /> Fund Wallet
          </Link>
          <Link href="/user/products" className="btn-primary">
            <FiPackage size={16} /> Buy Product
          </Link>
          <Link href="/user/withdraw" className="btn-danger">
            <FiArrowUpRight size={16} /> Withdraw
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-dark-900 dark:text-white">Recent Transactions</h2>
              <Link href="/user/transactions" className="text-sm text-primary-500 hover:text-primary-600 font-medium">View All</Link>
            </div>
            {recentTransactions.length === 0 ? (
              <p className="text-dark-400 text-sm py-8 text-center">No transactions yet</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.slice(0, 5).map((tx) => (
                      <tr key={tx._id}>
                        <td className="text-xs text-dark-400 whitespace-nowrap">
                          {new Date(tx.createdAt ?? tx.date).toLocaleDateString()}
                        </td>
                        <td className="capitalize">{tx.type}</td>
                        <td className={tx.type === 'withdrawal' ? 'text-danger-500' : 'text-success-500'}>
                          {tx.type === 'withdrawal' ? '-' : '+'}₦{Number(tx.amount).toLocaleString()}
                        </td>
                        <td>{statusBadge(tx.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Active Investments */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-dark-900 dark:text-white">Active Investments</h2>
              <Link href="/user/investments" className="text-sm text-primary-500 hover:text-primary-600 font-medium">View All</Link>
            </div>
            {recentInvestments.length === 0 ? (
              <p className="text-dark-400 text-sm py-8 text-center">No active investments</p>
            ) : (
              <div className="space-y-3">
                {recentInvestments.slice(0, 5).map((inv) => (
                  <div key={inv._id} className="flex items-center justify-between p-3 bg-dark-50 dark:bg-dark-800 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-dark-900 dark:text-white">{inv.productId?.name || inv.product?.name || 'Investment'}</p>
                      <p className="text-xs text-dark-400">Invested: ₦{Number(inv.totalCost).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-success-500">+₦{Number(inv.dailyEarnings || 0).toLocaleString()}/day</p>
                      <p className="text-xs text-dark-400">{inv.daysRemaining || 0} days left</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
