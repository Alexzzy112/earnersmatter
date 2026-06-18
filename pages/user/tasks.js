'use client';
import { useState, useEffect, useCallback } from 'react';
import { taskAPI } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import StatsCard from '@/components/shared/StatsCard';
import EmptyState from '@/components/shared/EmptyState';
import {
  FiCheckCircle, FiClock, FiPlay, FiLock, FiDollarSign, FiAward, FiStar, FiExternalLink
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const TASKS_PER_DAY = 5;

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [meta, setMeta] = useState({
    total: 0, completed: 0, started: 0, perTaskReward: 0,
    totalDailyEarnings: 0, canEarn: 0, locked: false, allCompleted: false,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await taskAPI.getToday();
      setTasks(res.data || []);
      setMeta(res.meta || {});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleStartEarns = async (task) => {
    let linkUrl = task.linkUrl;
    if (linkUrl && linkUrl !== '#') {
      if (!linkUrl.startsWith('http://') && !linkUrl.startsWith('https://')) {
        linkUrl = 'https://' + linkUrl;
      }
      window.open(linkUrl, '_blank', 'noopener,noreferrer');
    }
    setActionLoading(task._id);
    try {
      const res = await taskAPI.start(task._id);
      setTasks((prev) =>
        prev.map((t) =>
          t._id === task._id ? { ...t, status: 'started' } : t
        )
      );
      setMeta((prev) => ({ ...prev, started: prev.started + 1 }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start task');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReceiveReward = async (taskId) => {
    setActionLoading(taskId);
    try {
      const res = await taskAPI.receiveReward(taskId);
      toast.success(res.message || 'Reward credited!');
      setTasks((prev) =>
        prev.map((t) =>
          t._id === taskId ? { ...t, status: 'completed' } : t
        )
      );
      const completedCount = (tasks.filter((t) => t.status === 'completed').length) + 1;
      setMeta((prev) => ({
        ...prev,
        completed: completedCount,
        started: Math.max(0, prev.started - 1),
        allCompleted: completedCount >= TASKS_PER_DAY,
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to claim reward');
    } finally {
      setActionLoading(null);
    }
  };

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const progressPercent = meta.total > 0 ? Math.round((completedCount / TASKS_PER_DAY) * 100) : 0;

  if (loading) return <DashboardLayout><LoadingSpinner /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Daily Tasks</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Complete {TASKS_PER_DAY} tasks daily to claim your investment earnings
          </p>
        </div>

        {meta.locked ? (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-8 text-center">
            <FiLock size={48} className="mx-auto text-amber-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Active Investment</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
              Purchase an investment product to unlock daily tasks and start earning rewards.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Daily Earnings"
                value={`₦${(meta.totalDailyEarnings || 0).toLocaleString()}`}
                icon={FiDollarSign}
                color="blue"
              />
              <StatsCard
                title="Tasks Completed"
                value={`${completedCount}/${TASKS_PER_DAY}`}
                icon={FiCheckCircle}
                color="green"
              />
              <StatsCard
                title="Per Task Reward"
                value={`₦${(meta.perTaskReward || 0).toLocaleString()}`}
                icon={FiStar}
                color="yellow"
              />
              <StatsCard
                title="Today Earned"
                value={`₦${((meta.perTaskReward || 0) * completedCount).toLocaleString()}`}
                icon={FiAward}
                color="purple"
              />
            </div>

            {meta.allCompleted && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-5 text-center">
                <FiAward size={36} className="mx-auto text-emerald-500 mb-2" />
                <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                  All Tasks Completed!
                </h3>
                <p className="text-emerald-600 dark:text-emerald-400 text-sm mt-1">
                  You&apos;ve earned ₦{((meta.perTaskReward || 0) * TASKS_PER_DAY).toLocaleString()} today. Come back tomorrow for more tasks.
                </p>
              </div>
            )}

            <div className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Daily Progress
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {completedCount}/{TASKS_PER_DAY}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(progressPercent, 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.map((task, index) => {
                const isNotStarted = task.status === 'not_started' || !task.status;
                const isStarted = task.status === 'started';
                const isCompleted = task.status === 'completed';

                return (
                  <div
                    key={task._id}
                    className={`card p-5 transition-all duration-200 ${
                      isCompleted
                        ? 'opacity-60 border-emerald-300 dark:border-emerald-700'
                        : isStarted
                          ? 'border-blue-300 dark:border-blue-700 ring-1 ring-blue-200 dark:ring-blue-800'
                          : 'hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400 font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{task.title}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 line-clamp-2">{task.description}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-0.5 rounded-full">
                            +₦{(task.reward || 0).toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 capitalize flex items-center gap-1">
                            <FiClock size={10} />
                            {task.type}
                          </span>
                        </div>
                        {isStarted && (
                          <div className="mt-2">
                            <span className="text-xs text-blue-500 flex items-center gap-1">
                              <FiPlay size={10} />
                              Ad opened — click &quot;Receive Reward&quot; to claim
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full">
                            <FiCheckCircle size={14} /> Done
                          </span>
                        ) : isStarted ? (
                          <button
                            onClick={() => handleReceiveReward(task._id)}
                            disabled={actionLoading === task._id}
                            className="btn-primary text-xs px-3 py-2"
                          >
                            {actionLoading === task._id ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <><FiExternalLink size={12} className="inline mr-1" /> Receive Reward</>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartEarns(task)}
                            disabled={actionLoading === task._id}
                            className="btn-primary text-xs px-3 py-2"
                          >
                            {actionLoading === task._id ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <><FiPlay size={12} className="inline mr-1" /> Start Earns</>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {tasks.length === 0 && (
                <div className="col-span-full">
                  <EmptyState
                    icon={FiClock}
                    title="No tasks available"
                    description="Daily tasks will appear here once generated. Check back later."
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}