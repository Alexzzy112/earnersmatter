'use client';
import { useState, useEffect } from 'react';
import { leaderboardAPI } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import {
  FiAward, FiTrendingUp, FiUsers, FiDollarSign, FiBarChart2
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const medals = ['🥇', '🥈', '🥉'];

const fakeTopInvestors = [
  { username: 'Adewale O.', totalInvestments: 25000000, totalEarnings: 8500000, referredCount: 412, dailyEarnings: 350000 },
  { username: 'Chinwe M.', totalInvestments: 18500000, totalEarnings: 6200000, referredCount: 289, dailyEarnings: 245000 },
  { username: 'Ibrahim D.', totalInvestments: 12000000, totalEarnings: 4100000, referredCount: 198, dailyEarnings: 180000 },
  { username: 'Folake A.', totalInvestments: 8500000, totalEarnings: 2900000, referredCount: 156, dailyEarnings: 125000 },
  { username: 'Nnamdi K.', totalInvestments: 5200000, totalEarnings: 1800000, referredCount: 94, dailyEarnings: 85000 },
];

const fakeWeeklyGrowing = [
  { username: 'Tunde B.', totalEarnings: 2100000, growth: 320, joinedAt: new Date('2025-08-15').toISOString() },
  { username: 'Amara S.', totalEarnings: 1500000, growth: 280, joinedAt: new Date('2025-09-01').toISOString() },
  { username: 'Kayode R.', totalEarnings: 980000, growth: 245, joinedAt: new Date('2025-07-20').toISOString() },
  { username: 'Funmi L.', totalEarnings: 750000, growth: 210, joinedAt: new Date('2025-10-05').toISOString() },
  { username: 'Chuka E.', totalEarnings: 520000, growth: 185, joinedAt: new Date('2025-06-10').toISOString() },
];

const mergeTop = (apiData) => {
  const combined = fakeTopInvestors.map((f, i) => ({ ...f, rank: i + 1 }));
  const startRank = combined.length + 1;
  (apiData || []).forEach((item, i) => {
    combined.push({ ...item, rank: startRank + i });
  });
  return combined;
};

const mergeGrowing = (apiData) => {
  const combined = fakeWeeklyGrowing.map((f, i) => ({ ...f, rank: i + 1 }));
  const startRank = combined.length + 1;
  (apiData || []).forEach((item, i) => {
    combined.push({ ...item, rank: startRank + i });
  });
  return combined;
};

export default function LeaderboardPage() {
  const [topInvestors, setTopInvestors] = useState(mergeTop([]));
  const [weeklyGrowing, setWeeklyGrowing] = useState(mergeGrowing([]));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invRes, growRes] = await Promise.all([
          leaderboardAPI.getTopInvestors(),
          leaderboardAPI.getWeeklyGrowing(),
        ]);
        setTopInvestors(mergeTop(invRes.data || []));
        setWeeklyGrowing(mergeGrowing(growRes.data || []));
      } catch (err) {
        toast.error('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <DashboardLayout><LoadingSpinner /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leaderboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Top investors and weekly top earners on EarnersMatter
          </p>
        </div>

        {/* Top Investors */}
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <FiAward size={24} className="text-white" />
              <div>
                <h2 className="text-lg font-bold text-white">Top Investors</h2>
                <p className="text-amber-100 text-sm">Highest investment totals</p>
              </div>
            </div>
          </div>
          {topInvestors.length === 0 ? (
            <div className="p-8">
              <EmptyState icon={FiUsers} title="No investors yet" description="Be the first to invest and claim the top spot!" />
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-dark-700">
              {topInvestors.map((inv, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors">
                  <div className="w-8 text-center text-lg">
                    {i < 3 ? medals[i] : <span className="text-sm font-bold text-gray-400 dark:text-gray-500">#{inv.rank}</span>}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                    {inv.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{inv.username}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {inv.referredCount || 0} referral{inv.referredCount !== 1 ? 's' : ''} • ₦{inv.dailyEarnings?.toLocaleString() || '0'}/day
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white text-sm">₦{inv.totalInvestments.toLocaleString()}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">Earned ₦{inv.totalEarnings.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weekly Growing */}
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <FiTrendingUp size={24} className="text-white" />
              <div>
                <h2 className="text-lg font-bold text-white">Weekly Growing</h2>
                <p className="text-emerald-100 text-sm">Top performers this period</p>
              </div>
            </div>
          </div>
          {weeklyGrowing.length === 0 ? (
            <div className="p-8">
              <EmptyState icon={FiBarChart2} title="No data yet" description="Weekly stats appear as users invest and earn." />
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-dark-700">
              {weeklyGrowing.map((g, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors">
                  <div className="w-8 text-center">
                    <span className="text-sm font-bold text-gray-400 dark:text-gray-500">#{g.rank}</span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                    {g.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{g.username}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Joined {new Date(g.joinedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white text-sm">₦{g.totalEarnings.toLocaleString()}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      {g.growth}% growth
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}