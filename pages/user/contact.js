'use client';
import { useState, useEffect } from 'react';
import { contactAPI } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { FiMessageCircle, FiMail, FiRefreshCw, FiSend, FiUsers } from 'react-icons/fi';

export default function ContactPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await contactAPI.get();
        setData(res.data);
      } catch (err) {
        setError('Failed to load contact information');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  const telegramChannel = data?.contactTelegramChannel || 'https://t.me/earnersmatter';
  const telegramAdmin = data?.contactTelegramAdmin || 'https://t.me/earnersmatter_admin';

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Contact Admin</h1>
          <p className="text-dark-400 text-sm mt-1">Get in touch with the support team</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
              <FiUsers size={28} className="text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-dark-900 dark:text-white">Telegram Channel</h2>
              <p className="text-sm text-dark-400">Join our channel for updates</p>
            </div>
          </div>
          <a
            href={telegramChannel}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <FiSend size={16} />
            Join Telegram Channel
          </a>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <FiMessageCircle size={28} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-dark-900 dark:text-white">Admin Account</h2>
              <p className="text-sm text-dark-400">Message the admin directly</p>
            </div>
          </div>
          <a
            href={telegramAdmin}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <FiSend size={16} />
            Message Admin on Telegram
          </a>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <FiMail size={28} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-dark-900 dark:text-white">Email</h2>
              <p className="text-sm text-dark-400">Send us an email</p>
            </div>
          </div>
          <a
            href="mailto:support@earnersmatter.com"
            className="text-primary-500 hover:text-primary-600 font-medium"
          >
            support@earnersmatter.com
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
}
