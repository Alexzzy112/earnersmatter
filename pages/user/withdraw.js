'use client';
import { useState, useEffect, useMemo } from 'react';
import { withdrawalAPI } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { FiArrowUpRight, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const CHARGE_RATE = 0.05;
const MIN_WITHDRAWAL = 2500;

const WITHDRAWAL_DAYS = [1, 5];
const DAY_NAMES = { 1: 'Monday', 5: 'Friday' };

const statusBadge = (status) => {
  const map = {
    approved: 'badge badge-success',
    pending: 'badge badge-warning',
    rejected: 'badge badge-danger',
    completed: 'badge badge-success',
    processing: 'badge badge-primary',
  };
  return <span className={map[status] || 'badge badge-neutral'}>{status}</span>;
};

const paymentMethods = [
  { value: 'bank', label: 'Bank Transfer' },
];

export default function WithdrawPage() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [accountDetails, setAccountDetails] = useState('');
  const [validation, setValidation] = useState({});

  const today = new Date().getDay();
  const isAllowedDay = WITHDRAWAL_DAYS.includes(today);

  const numericAmount = parseFloat(amount) || 0;
  const charge = numericAmount * CHARGE_RATE;
  const netAmount = numericAmount - charge;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await withdrawalAPI.getAll();
        setWithdrawals(res.data.withdrawals || res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load withdrawal data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const validate = () => {
    const errors = {};
    if (!isAllowedDay) errors.day = 'Withdrawals are only available on Monday and Friday';
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) errors.amount = 'Please enter a valid amount';
    else if (numericAmount < MIN_WITHDRAWAL) errors.amount = `Minimum withdrawal is ₦${MIN_WITHDRAWAL.toLocaleString()}`;
    if (!accountDetails.trim()) errors.accountDetails = 'Please enter your account details';
    setValidation(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await withdrawalAPI.create({ amount: numericAmount, paymentMethod, accountDetails });
      toast.success('Withdrawal request submitted successfully!');
      setAmount('');
      setPaymentMethod('bank');
      setAccountDetails('');

      const res = await withdrawalAPI.getAll();
      setWithdrawals(res.data.withdrawals || res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit withdrawal');
    } finally {
      setSubmitting(false);
    }
  };

  const nextWithdrawalDay = useMemo(() => {
    const days = [1, 5];
    const today = new Date().getDay();
    for (const d of days) {
      if (d > today) return DAY_NAMES[d];
    }
    return DAY_NAMES[days[0]];
  }, []);

  if (loading) return <DashboardLayout><LoadingSpinner text="Loading withdrawals..." /></DashboardLayout>;
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
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Withdraw Funds</h1>
          <p className="text-dark-400 text-sm mt-1">Request a withdrawal from your wallet</p>
        </div>

        {!isAllowedDay && (
          <div className="flex items-start gap-3 p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-xl">
            <FiAlertCircle size={20} className="text-warning-500 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-warning-700 dark:text-warning-400 text-sm">Withdrawals Unavailable Today</h3>
              <p className="text-sm text-warning-600 dark:text-warning-300 mt-1">
                Withdrawals can only be processed on Monday and Friday. Next available day: {nextWithdrawalDay}.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Withdrawal Form */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-dark-900 dark:text-white mb-4">Withdrawal Request</h2>

            {/* Schedule info */}
            <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
              <p className="text-xs text-primary-700 dark:text-primary-400 font-medium">
                Withdrawal Days: Monday, Friday
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 font-medium">₦</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); setValidation({}); }}
                    placeholder="0.00"
                    className="input-field pl-8"
                  />
                </div>
                {validation.day && <p className="text-xs text-danger-500 mt-1">{validation.day}</p>}
                {validation.amount && <p className="text-xs text-danger-500 mt-1">{validation.amount}</p>}
              </div>

              {numericAmount > 0 && (
                <div className="p-3 bg-dark-50 dark:bg-dark-800 rounded-lg space-y-1 text-sm">
                  <div className="flex justify-between text-dark-500">
                    <span>Charge (5%)</span>
                    <span className="text-danger-500">-₦{charge.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-dark-900 dark:text-white border-t border-dark-200 dark:border-dark-700 pt-1">
                    <span>Net Amount</span>
                    <span className="text-success-500">₦{netAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="input-field"
                >
                  {paymentMethods.map((pm) => (
                    <option key={pm.value} value={pm.value}>{pm.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Account Details
                </label>
                <textarea
                  value={accountDetails}
                  onChange={(e) => { setAccountDetails(e.target.value); setValidation({}); }}
                  placeholder="Enter your bank account details..."
                  rows={3}
                  className="input-field resize-none"
                />
                {validation.accountDetails && <p className="text-xs text-danger-500 mt-1">{validation.accountDetails}</p>}
                <p className="text-xs text-dark-400 mt-1">
                  Provide the details where funds should be sent
                </p>
              </div>

              <button type="submit" className="btn-danger w-full" disabled={submitting || !isAllowedDay}>
                {submitting ? 'Processing...' : <><FiArrowUpRight size={16} /> Submit Withdrawal</>}
              </button>
            </form>
          </div>

          {/* Withdrawal History */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-dark-900 dark:text-white mb-4">Withdrawal History</h2>
            {withdrawals.length === 0 ? (
              <p className="text-dark-400 text-sm py-8 text-center">No withdrawals yet</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Charge</th>
                      <th>Net</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((wd) => (
                      <tr key={wd._id}>
                        <td className="text-xs text-dark-400 whitespace-nowrap">
                          {new Date(wd.createdAt || wd.date).toLocaleDateString()}
                        </td>
                        <td className="font-medium">₦{Number(wd.amount).toLocaleString()}</td>
                        <td className="text-danger-500 text-sm">-₦{Number(wd.charge || wd.amount * CHARGE_RATE).toFixed(2)}</td>
                        <td className="text-success-500 font-medium">₦{Number(wd.netAmount || wd.amount * (1 - CHARGE_RATE)).toFixed(2)}</td>
                        <td>{statusBadge(wd.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
