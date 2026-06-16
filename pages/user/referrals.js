'use client';
import { useState, useEffect } from 'react';
import { referralAPI } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import StatsCard from '@/components/shared/StatsCard';
import { FiUsers, FiLink, FiCopy, FiRefreshCw, FiInfo } from 'react-icons/fi';
import toast from 'react-hot-toast';

const statusBadge = (status) => {
  const map = {
    active: 'badge badge-success',
    registered: 'badge badge-primary',
    invested: 'badge badge-success',
    pending: 'badge badge-warning',
    inactive: 'badge badge-neutral',
  };
  return <span className={map[status] || 'badge badge-neutral'}>{status}</span>;
};

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState([]);
  const [stats, setStats] = useState({ totalReferrals: 0, totalEarnings: 0, referralLink: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [refRes, statsRes] = await Promise.all([
          referralAPI.getAll(),
          referralAPI.getStats(),
        ]);
        setReferrals(refRes.data.referrals || refRes.data);
        setStats(statsRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load referral data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const [originReady, setOriginReady] = useState(origin);
  useEffect(() => { setOriginReady(window.location.origin); }, []);
  const referralLink = stats.referralLink ||
    `${originReady}/auth/register?ref=${stats.referralCode || ''}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success('Referral link copied to clipboard!');
    } catch {
      toast.error('Failed to copy');
    }
  };

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
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Referral Program</h1>
          <p className="text-dark-400 text-sm mt-1">Invite friends and earn bonuses</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatsCard
            icon={FiUsers}
            title="Total Referrals"
            value={stats.totalReferrals}
            color="blue"
          />
          <StatsCard
            icon={FiLink}
            title="Total Earnings"
            value={`₦${Number(stats.totalEarnings || 0).toLocaleString()}`}
            color="green"
          />
        </div>

        {/* Referral Link */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-dark-900 dark:text-white mb-3">Your Referral Link</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center gap-2 p-3 bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-lg">
              <FiLink size={16} className="text-primary-500 shrink-0" />
              <span className="text-sm text-dark-600 dark:text-dark-300 truncate">{referralLink}</span>
            </div>
            <button onClick={copyToClipboard} className="btn-primary whitespace-nowrap">
              <FiCopy size={16} /> Copy Link
            </button>
          </div>
        </div>

        {/* Info Card */}
        <div className="p-5 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl">
          <div className="flex items-start gap-3">
            <FiInfo size={20} className="text-primary-500 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-primary-700 dark:text-primary-400 mb-1">How It Works</h3>
              <ul className="text-sm text-primary-600 dark:text-primary-300 space-y-1">
                <li>• Share your unique referral link with friends</li>
                <li>• When they sign up using your link, they&apos;re added to your referrals</li>
                <li>• Earn a bonus when they make their first investment</li>
                <li>• No limit on the number of referrals you can make</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Referral Table */}
        {referrals.length === 0 ? (
          <div className="text-center py-16">
            <FiUsers size={48} className="mx-auto text-dark-300 dark:text-dark-600 mb-4" />
            <h2 className="text-xl font-semibold text-dark-600 dark:text-dark-400">No referrals yet</h2>
            <p className="text-dark-400 text-sm mt-1">Share your referral link to start earning</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Referred User</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Bonus</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((ref) => (
                  <tr key={ref._id}>
                    <td className="font-medium text-dark-900 dark:text-white">
                      {ref.referredUser?.username || ref.referredUser?.email || ref.email || 'Unknown'}
                    </td>
                    <td className="text-xs text-dark-400 whitespace-nowrap">
                      {new Date(ref.createdAt || ref.date).toLocaleDateString()}
                    </td>
                    <td>{statusBadge(ref.status)}</td>
                    <td className={ref.bonus ? 'text-success-500 font-medium' : 'text-dark-400'}>
                      {ref.bonus ? `₦${Number(ref.bonus).toLocaleString()}` : '-'}
                    </td>
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
