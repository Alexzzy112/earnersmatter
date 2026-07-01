'use client';
import { useState, useEffect } from 'react';
import { notificationAPI } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { FiBell, FiCheck, FiCheckCircle, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await notificationAPI.getAll();
      setNotifications(res.data.notifications || res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const markAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  if (loading) return <DashboardLayout><LoadingSpinner text="Loading notifications..." /></DashboardLayout>;
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Notifications</h1>
            <p className="text-dark-400 text-sm mt-1">
              {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'No unread notifications'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="btn-secondary text-sm">
              <FiCheckCircle size={16} /> Mark All Read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <FiBell size={48} className="mx-auto text-dark-300 dark:text-dark-600 mb-4" />
            <h2 className="text-xl font-semibold text-dark-600 dark:text-dark-400">No notifications</h2>
            <p className="text-dark-400 text-sm mt-1">You&apos;re all caught up!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => !n.isRead && markAsRead(n._id)}
                className={`card p-4 cursor-pointer transition-all ${
                  !n.isRead
                    ? 'border-primary-300 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-900/10'
                    : 'opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                      !n.isRead ? 'bg-primary-500' : 'bg-transparent'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3
                          className={`text-sm ${
                            !n.isRead
                              ? 'font-semibold text-dark-900 dark:text-white'
                              : 'font-medium text-dark-600 dark:text-dark-300'
                          }`}
                        >
                          {n.title || n.message?.substring(0, 60)}
                        </h3>
                        <p className="text-xs text-dark-400 mt-1">
                          {n.message || n.body || ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-dark-400 whitespace-nowrap">
                          {timeAgo(n.createdAt || n.date)}
                        </span>
                        {!n.isRead && (
                          <button
                            onClick={(e) => { e.stopPropagation(); markAsRead(n._id); }}
                            className="text-primary-500 hover:text-primary-600"
                            title="Mark as read"
                          >
                            <FiCheck size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
