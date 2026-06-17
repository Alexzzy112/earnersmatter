'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';
import Modal from '@/components/shared/Modal';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import StatusBadge from '@/components/shared/StatusBadge';
import toast from 'react-hot-toast';
import {
  FiPlus, FiEdit2, FiTrash2, FiCheckSquare, FiRefreshCw
} from 'react-icons/fi';

const emptyTask = { title: '', description: '', imageUrl: '', linkUrl: '', reward: 500, type: 'ad' };

export default function AdminTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ ...emptyTask });
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getTasks({ page, limit: 20 });
      setTasks(res.data || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const openCreate = () => { setFormData({ ...emptyTask }); setEditing(null); setShowForm(true); };
  const openEdit = (task) => {
    setFormData({
      title: task.title || '',
      description: task.description || '',
      imageUrl: task.imageUrl || '',
      linkUrl: task.linkUrl || '',
      reward: task.reward || 500,
      type: task.type || 'ad',
    });
    setEditing(task._id); setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.title) { toast.error('Title is required'); return; }
    if (!formData.reward || parseFloat(formData.reward) <= 0) { toast.error('Reward must be greater than 0'); return; }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        reward: parseFloat(formData.reward),
      };
      if (editing) { await adminAPI.updateTask(editing, payload); toast.success('Task updated'); }
      else { await adminAPI.createTask(payload); toast.success('Task created'); }
      setShowForm(false); fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await adminAPI.deleteTask(deleteTarget._id);
      toast.success('Task deleted');
      setDeleteTarget(null); fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    } finally { setSaving(false); }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await adminAPI.generateTasks();
      toast.success(res.message || 'Daily tasks generated');
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate tasks');
    } finally { setGenerating(false); }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Task Management</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Create and manage daily ad tasks</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleGenerate} disabled={generating}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 disabled:opacity-50">
              <FiRefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Generating...' : 'Generate Daily'}
            </button>
            <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700">
              <FiPlus className="w-4 h-4" /> Create Task
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-8">
            <LoadingSpinner />
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700">
            <EmptyState icon={FiCheckSquare} title="No tasks yet" description="Create your first task or generate daily tasks automatically."
              action={<button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"><FiPlus className="w-4 h-4" /> Create Task</button>} />
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-900">
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Title</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Date</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Type</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Reward</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Status</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                    {tasks.map((task) => (
                      <tr key={task._id} className="hover:bg-gray-50 dark:hover:bg-dark-700/50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 dark:text-white">{task.title}</div>
                          {task.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{task.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatDate(task.forDate)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 capitalize">
                            {task.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">
                          ₦{(task.reward || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center"><StatusBadge status={task.status} /></td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(task)} className="p-1.5 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20" title="Edit">
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleteTarget(task)} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete">
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 disabled:opacity-50">
                  Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">Page {page} of {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 disabled:opacity-50">
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Create/Edit Modal */}
        <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Task' : 'Create Task'} size="lg">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
              <input className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Task title" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 !min-h-[80px]"
                value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Task description" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                <select className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                  <option value="ad">Ad</option>
                  <option value="click">Click</option>
                  <option value="watch">Watch</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reward (₦)</label>
                <input type="number" step="0.01" className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  value={formData.reward} onChange={(e) => setFormData({ ...formData, reward: e.target.value })} placeholder="500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL</label>
              <input className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} placeholder="https://example.com/ad-image.jpg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link URL</label>
              <input className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                value={formData.linkUrl} onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })} placeholder="https://example.com/ad-destination" />
              <p className="text-xs text-gray-400 mt-1">Users will open this link in a new tab as part of the task flow.</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-700">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700">Cancel</button>
            <button onClick={handleSave} disabled={saving || !formData.title}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {saving ? 'Saving...' : editing ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </Modal>

        {/* Delete Confirmation */}
        <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="" size="sm">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto mb-4 flex items-center justify-center">
              <FiTrash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Task</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete <strong>{deleteTarget?.title}</strong>? This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-700">
            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700">Cancel</button>
            <button onClick={handleDelete} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
              {saving ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}