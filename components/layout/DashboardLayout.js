'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { notificationAPI } from '@/lib/api';
import {
  FiGrid, FiDollarSign, FiArrowUpRight, FiPackage, FiTrendingUp,
  FiBarChart2, FiUsers, FiCheckSquare, FiRefreshCw, FiBell, FiUser, FiLogOut, FiMenu, FiX, FiMessageCircle, FiAward, FiHome, FiCalendar
} from 'react-icons/fi';
import { Toaster } from 'react-hot-toast';

const navItems = [
  { href: '/user/dashboard', label: 'Dashboard', icon: FiGrid },
  { href: '/user/wallet', label: 'Wallet', icon: FiDollarSign },
  { href: '/user/withdraw', label: 'Withdraw', icon: FiArrowUpRight },
  { href: '/user/products', label: 'Products', icon: FiPackage },
  { href: '/user/investments', label: 'Investments', icon: FiTrendingUp },
  { href: '/user/earnings', label: 'Earnings', icon: FiBarChart2 },
  { href: '/user/tasks', label: 'Daily Tasks', icon: FiCalendar },
  { href: '/user/transactions', label: 'Transactions', icon: FiRefreshCw },
  { href: '/user/leaderboard', label: 'Leaderboard', icon: FiAward },
  { href: '/user/contact', label: 'Contact', icon: FiMessageCircle },
  { href: '/user/referrals', label: 'Referrals', icon: FiUsers },
  { href: '/user/notifications', label: 'Notifications', icon: FiBell },
  { href: '/user/profile', label: 'Profile', icon: FiUser },
];

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await notificationAPI.getUnreadCount();
        setUnreadCount(res.data?.unreadCount || 0);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-dark-50 dark:bg-dark-950">
      <Toaster position="top-right" toastOptions={{
        duration: 4000,
        style: { borderRadius: '8px', background: '#1e293b', color: '#f1f5f9', fontSize: '0.875rem' },
      }} />

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-dark-900 border-r border-dark-200 dark:border-dark-700 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-dark-200 dark:border-dark-700">
          <Link href="/user/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="font-bold text-lg text-dark-900 dark:text-white">EarnersMatter</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-dark-400 hover:text-dark-600 dark:hover:text-dark-200"
          >
            <FiX size={20} />
          </button>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100%-70px)]">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                    : 'text-dark-500 hover:bg-dark-100 dark:text-dark-400 dark:hover:bg-dark-800'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-dark-200 dark:border-dark-700">
            <div className="px-3 py-2">
              <p className="text-xs text-dark-400 dark:text-dark-500 font-medium">
                Signed in as
              </p>
              <p className="text-sm font-medium text-dark-700 dark:text-dark-300 truncate">
                {user?.username || user?.email || 'User'}
              </p>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-dark-900/80 backdrop-blur-md border-b border-dark-200 dark:border-dark-700">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-dark-500 hover:text-dark-700 dark:hover:text-dark-200"
            >
              <FiMenu size={22} />
            </button>

            <div className="flex items-center gap-3 ml-auto">
              <Link
                href="/user/notifications"
                className="relative p-2 text-dark-400 hover:text-dark-600 dark:hover:text-dark-200 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800"
              >
                <FiBell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-danger-500 rounded-full">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link
                href="/user/profile"
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800"
              >
                <div className="w-7 h-7 gradient-primary rounded-full flex items-center justify-center">
                  <FiUser size={14} className="text-white" />
                </div>
                <span className="text-sm font-medium text-dark-700 dark:text-dark-300 hidden sm:block">
                  {user?.username || user?.email || 'User'}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-dark-400 hover:text-danger-500 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
                title="Sign Out"
              >
                <FiLogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6 lg:p-8 pb-20 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-dark-900 border-t border-dark-200 dark:border-dark-700 lg:hidden">
        <div className="flex items-center justify-around px-2 py-1">
          {[
            { href: '/user/products', label: 'Products', icon: FiPackage },
            { href: '/user/tasks', label: 'Daily Tasks', icon: FiCalendar },
            { href: '/user/wallet', label: 'Wallet', icon: FiDollarSign },
            { href: '/user/dashboard', label: 'Dashboard', icon: FiHome },
            { href: '/user/profile', label: 'Profile', icon: FiUser },
          ].map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-dark-400 dark:text-dark-500'
                }`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
