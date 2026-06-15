'use client';
import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { FiSend, FiUsers, FiMail, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AdminNotificationsPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    title: '',
    message: '',
    sendTo: 'all',
    selectedUsers: [],
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await adminAPI.getNotificationUsers();
        setUsers(res.data || []);
      } catch {
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const toggleUser = (id) => {
    setForm((prev) => ({
      ...prev,
      selectedUsers: prev.selectedUsers.includes(id)
        ? prev.selectedUsers.filter((u) => u !== id)
        : [...prev.selectedUsers, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Title and message are required');
      return;
    }

    setSending(true);
    try {
      const payload = {
        title: form.title,
        message: form.message,
        allUsers: form.sendTo === 'all',
        userIds: form.sendTo === 'selected' ? form.selectedUsers : [],
      };
      const res = await adminAPI.sendNotification(payload);
      toast.success(res.message || 'Notification sent!');
      setForm({ title: '', message: '', sendTo: 'all', selectedUsers: [] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <AdminLayout><LoadingSpinner text="Loading..." /></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Send Notification</h1>
          <p className="text-dark-400 text-sm mt-1">Compose and send notifications to users</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-dark-900 dark:text-white flex items-center gap-2">
              <FiMail size={18} /> Notification Details
            </h2>

            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. New Investment Opportunity"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Message</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Write your notification message..."
                rows={4}
                className="input-field resize-y"
              />
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-dark-900 dark:text-white flex items-center gap-2">
              <FiUsers size={18} /> Recipients
            </h2>

            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-dark-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700">
                <input
                  type="radio"
                  name="sendTo"
                  value="all"
                  checked={form.sendTo === 'all'}
                  onChange={() => setForm({ ...form, sendTo: 'all', selectedUsers: [] })}
                  className="w-4 h-4 text-primary-600"
                />
                <div>
                  <span className="text-sm font-medium text-dark-900 dark:text-white">All Users</span>
                  <p className="text-xs text-dark-400">Send to all registered users ({users.length} users)</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-dark-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700">
                <input
                  type="radio"
                  name="sendTo"
                  value="selected"
                  checked={form.sendTo === 'selected'}
                  onChange={() => setForm({ ...form, sendTo: 'selected' })}
                  className="w-4 h-4 text-primary-600"
                />
                <div>
                  <span className="text-sm font-medium text-dark-900 dark:text-white">Selected Users</span>
                  <p className="text-xs text-dark-400">{form.selectedUsers.length} user(s) selected</p>
                </div>
              </label>
            </div>

            {form.sendTo === 'selected' && (
              <div className="max-h-60 overflow-y-auto space-y-1 border border-gray-200 dark:border-dark-700 rounded-lg p-2">
                {users.length === 0 ? (
                  <p className="text-sm text-dark-400 text-center py-4">No users found</p>
                ) : (
                  users.map((u) => (
                    <label
                      key={u._id}
                      className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700"
                    >
                      <input
                        type="checkbox"
                        checked={form.selectedUsers.includes(u._id)}
                        onChange={() => toggleUser(u._id)}
                        className="w-4 h-4 text-primary-600 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-dark-900 dark:text-white truncate">
                          {u.username || u.email}
                        </p>
                        <p className="text-xs text-dark-400 truncate">{u.email}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        u.status === 'active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-500 dark:bg-dark-700 dark:text-dark-400'
                      }`}>
                        {u.status}
                      </span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary flex items-center gap-2"
            disabled={sending}
          >
            {sending ? (
              'Sending...'
            ) : (
              <><FiSend size={16} /> Send Notification</>
            )}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}
