'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowRight, FiTrendingUp, FiShield, FiDollarSign, FiUsers, FiBarChart2 } from 'react-icons/fi';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push(user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg">
      <nav className="bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <FiTrendingUp className="text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">EarnersMatter</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium">
                Login
              </Link>
              <Link
                href="/auth/register"
                className="bg-gradient-to-r from-primary-500 to-primary-700 text-white px-5 py-2 rounded-lg font-medium hover:from-primary-600 hover:to-primary-800 transition-all"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Invest Smart,{' '}
            <span className="bg-gradient-to-r from-primary-400 to-primary-600 text-transparent bg-clip-text">
              Earn Daily
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-3xl mx-auto">
            Start your investment journey with EarnersMatter. Enjoy automated daily returns, secure transactions, and a seamless investment experience.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/auth/register"
              className="bg-gradient-to-r from-primary-500 to-primary-700 text-white px-8 py-3 rounded-lg font-medium text-lg hover:from-primary-600 hover:to-primary-800 transition-all inline-flex items-center space-x-2"
            >
              <span>Start Investing</span>
              <FiArrowRight />
            </Link>
            <Link
              href="/auth/login"
              className="border-2 border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 px-8 py-3 rounded-lg font-medium text-lg hover:border-primary-500 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">Why Choose EarnersMatter</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: FiTrendingUp, title: 'Daily Returns', desc: 'Earn automated daily returns on your investments without any manual intervention.' },
            { icon: FiShield, title: 'Secure Platform', desc: 'State-of-the-art security with encrypted data, secure authentication, and audit trails.' },
            { icon: FiDollarSign, title: 'Easy Withdrawals', desc: 'Request withdrawals anytime with a simple process and quick approval system.' },
            { icon: FiUsers, title: 'Referral Program', desc: 'Earn bonuses by referring friends and family to our investment platform.' },
            { icon: FiBarChart2, title: 'Real-time Tracking', desc: 'Monitor your investments, earnings, and transactions in real-time.' },
          ].map((item, i) => (
            <div key={i} className="bg-white dark:bg-dark-card p-6 rounded-xl border border-gray-200 dark:border-dark-border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mb-4">
                <item.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-gray-50 dark:bg-dark-card border-t border-gray-200 dark:border-dark-border py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} EarnersMatter. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
