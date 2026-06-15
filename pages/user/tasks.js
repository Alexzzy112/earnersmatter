'use client';
import { useState, useEffect } from 'react';
import { taskAPI } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import StatsCard from '@/components/shared/StatsCard';
import { FiCheckCircle, FiClock, FiPlay, FiLock, FiRefreshCw, FiExternalLink } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [meta, setMeta] = useState({ total: 0, completed: 0, canEarn: 0, locked: false });
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(null);
  const [showAd, setShowAd] = useState(null);

  const fetchTasks = async () => {
    try {
      const res = await taskAPI.getToday();
      setTasks(res.data || []);
      setMeta(res.meta || {});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleComplete = async (taskId) => {
    setCompleting(taskId);
    try {
      const res = await taskAPI.complete(taskId);
      toast.success(res.message || 'Task completed!');
      setShowAd(null);
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete task');
    } finally {
      setCompleting(null);
    }
  };

  const handleViewAd = (task) => {
    setShowAd(task);
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  if (loading) return <DashboardLayout><LoadingSpinner /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Daily Tasks</h1>
          <p className="text-dark-400 text-sm mt-1">Complete tasks daily to earn rewards</p>
        </div>

        {meta.locked ? (
          <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-xl p-6 text-center">
            <FiLock size={40} className="mx-auto text-warning-400 mb-3" />
            <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-1">Tasks Locked</h3>
            <p className="text-dark-400 text-sm">Purchase a product to unlock daily earning tasks.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatsCard title="Available Tasks" value={meta.total} icon={FiClock} color="blue" />
              <StatsCard title="Completed" value={`${completedCount}/${meta.total}`} icon={FiCheckCircle} color="green" />
              <StatsCard title="Potential Earnings" value={`₦${(meta.canEarn || 0).toLocaleString()}`} icon={FiRefreshCw} color="yellow" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.map((task) => (
                <div key={task._id} className={`card p-5 ${task.completed ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-dark-900 dark:text-white text-sm">{task.title}</h3>
                      <p className="text-dark-400 text-xs mt-1">{task.description}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-xs font-medium text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-900/20 px-2 py-0.5 rounded">
                          +₦{task.reward.toLocaleString()}
                        </span>
                        <span className="text-xs text-dark-400 capitalize">{task.type}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {task.completed ? (
                        <span className="flex items-center gap-1 text-xs text-success-500 font-medium">
                          <FiCheckCircle /> Done
                        </span>
                      ) : (
                        <button
                          onClick={() => handleViewAd(task)}
                          className="btn-primary text-xs px-3 py-1.5"
                        >
                          <FiPlay size={12} className="inline mr-1" /> Start
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {tasks.length === 0 && (
                <div className="col-span-full text-center py-12 text-dark-400">
                  No tasks available today. Check back tomorrow!
                </div>
              )}
            </div>
          </>
        )}

        {/* Ad View Modal */}
        {showAd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowAd(null)}>
            <div className="bg-white dark:bg-dark-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="relative">
                <img
                  src={showAd.imageUrl || 'https://placehold.co/600x200/1a1a2e/e94560?text=Ad'}
                  alt={showAd.title}
                  className="w-full h-48 object-cover"
                />
                <button
                  onClick={() => setShowAd(null)}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
                >
                  ✕
                </button>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-dark-900 dark:text-white">{showAd.title}</h3>
                <p className="text-sm text-dark-400 mt-1">{showAd.description}</p>
                {showAd.linkUrl && showAd.linkUrl !== '#' && (
                  <a href={showAd.linkUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 mt-2">
                    <FiExternalLink size={14} /> Learn More
                  </a>
                )}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-dark-200 dark:border-dark-700">
                  <span className="text-sm font-medium text-success-600 dark:text-success-400">
                    Reward: +₦{showAd.reward.toLocaleString()}
                  </span>
                  <button
                    onClick={() => handleComplete(showAd._id)}
                    disabled={completing === showAd._id}
                    className="btn-primary text-sm px-4 py-2"
                  >
                    {completing === showAd._id ? 'Processing...' : 'Complete & Earn'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
