'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  FiHome, FiDollarSign, FiArrowUpRight, FiPackage, FiTrendingUp,
  FiBarChart2, FiUsers, FiList, FiBell, FiUser, FiCreditCard,
  FiPieChart, FiSettings, FiShield, FiX, FiMessageCircle
} from 'react-icons/fi';

const userLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: FiHome },
  { href: '/deposits', label: 'Deposit / Fund Wallet', icon: FiDollarSign },
  { href: '/withdrawals', label: 'Withdraw', icon: FiArrowUpRight },
  { href: '/products', label: 'Products', icon: FiPackage },
  { href: '/investments', label: 'My Investments', icon: FiTrendingUp },
  { href: '/earnings', label: 'Earnings', icon: FiBarChart2 },
  { href: '/referrals', label: 'Referrals', icon: FiUsers },
  { href: '/transactions', label: 'Transactions', icon: FiList },
  { href: '/notifications', label: 'Notifications', icon: FiBell },
  { href: '/contact', label: 'Contact', icon: FiMessageCircle },
  { href: '/profile', label: 'Profile', icon: FiUser },
];

const adminLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: FiHome },
  { href: '/admin/users', label: 'Users', icon: FiUsers },
  { href: '/admin/deposits', label: 'Deposits', icon: FiDollarSign },
  { href: '/admin/withdrawals', label: 'Withdrawals', icon: FiArrowUpRight },
  { href: '/admin/products', label: 'Products', icon: FiPackage },
  { href: '/admin/investments', label: 'Investments', icon: FiTrendingUp },
  { href: '/admin/earnings', label: 'Earnings', icon: FiBarChart2 },
  { href: '/admin/payment-accounts', label: 'Payment Accounts', icon: FiCreditCard },
  { href: '/admin/reports', label: 'Reports', icon: FiPieChart },
  { href: '/admin/notifications', label: 'Send Notification', icon: FiBell },
  { href: '/admin/profile', label: 'Profile', icon: FiUser },
  { href: '/user/contact', label: 'Contact', icon: FiMessageCircle },
  { href: '/admin/settings', label: 'Settings', icon: FiSettings },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: FiShield },
];

export default function Sidebar({ open, onClose }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const links = user?.role === 'admin' ? adminLinks : userLinks;

  const isActive = (href) => {
    if (href === '/dashboard' || href === '/admin/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-dark-800 border-r border-gray-200 dark:border-dark-700 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-dark-700 lg:hidden">
          <span className="text-lg font-bold text-primary-600 dark:text-primary-400">EarnersMatter</span>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-700">
            <FiX size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100%-4rem)]">
          {links.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700'
                }`}
              >
                <Icon size={18} className={active ? 'text-primary-600' : ''} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
