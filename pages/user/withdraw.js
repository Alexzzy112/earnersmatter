'use client';
import { useState, useEffect } from 'react';
import { withdrawalAPI, authAPI, settingsAPI } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import Modal from '@/components/shared/Modal';
import { FiArrowUpRight, FiRefreshCw, FiAlertCircle, FiCheckCircle, FiInfo, FiClock, FiCalendar, FiXCircle, FiClock as FiHourglass } from 'react-icons/fi';
import toast from 'react-hot-toast';

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

const BANKS = [
  'Opay',
  'Moniepoint',
  'Palmpay',
  'Kuda',
  'UBA',
  'Access Bank',
  'First Bank',
  'Unity Bank',
  'GT Bank',
  'Smartcash',
];

const WITHDRAWAL_DAYS = [1, 5];
const DAY_NAMES = { 1: 'Monday', 5: 'Friday' };

export default function WithdrawPage() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [error, setError] = useState(null);
  const [amount, setAmount] = useState('');
  const [accountDetails, setAccountDetails] = useState('');

  const [chargeRate, setChargeRate] = useState(0.05);

  const [withdrawalType, setWithdrawalType] = useState('daily_task');
  const [walletBalance, setWalletBalance] = useState(0);
  const [referralBalance, setReferralBalance] = useState(0);
  const [errorModal, setErrorModal] = useState(null);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const today = new Date().getDay();
  const currentHour = new Date().getHours();
  const isAllowedDay = WITHDRAWAL_DAYS.includes(today);
  const isReferralTime = currentHour >= 8 && currentHour < 15;

  const numericAmount = parseFloat(amount) || 0;
  const charge = numericAmount * chargeRate;
  const netAmount = numericAmount - charge;

  const isDailyTask = withdrawalType === 'daily_task';
  const minWithdrawal = isDailyTask ? 5000 : 2000;

  const canSubmit = isDailyTask ? isAllowedDay : isReferralTime;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [wdRes, userRes, settingsRes] = await Promise.all([
          withdrawalAPI.getAll(),
          authAPI.getMe(),
          settingsAPI.getWithdrawal(),
        ]);
        setWithdrawals(wdRes.data.withdrawals || wdRes.data);
        const u = userRes.data || userRes.user || userRes;
        setWalletBalance(u.walletBalance || 0);
        setReferralBalance(u.referralBalance || 0);
        if (u.bankName || u.accountNumber || u.accountName) {
          setBankName(u.bankName || '');
          setAccountNumber(u.accountNumber || '');
          setAccountName(u.accountName || '');
          setAccountDetails(formatAccountDetails(u.bankName, u.accountNumber, u.accountName));
        }
        const s = settingsRes.data || {};
        if (s.chargeRate) setChargeRate(Number(s.chargeRate));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load withdrawal data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatAccountDetails = (bank, acctNum, acctName) =>
    `Bank: ${bank}\nAccount: ${acctNum}\nName: ${acctName}`;

  const handleSaveBankAccount = async (e) => {
    e.preventDefault();
    if (!bankName || !accountNumber || !accountName) {
      toast.error('Please fill in all bank account fields');
      return;
    }
    setSavingAccount(true);
    try {
      await authAPI.updateBankAccount({ bankName, accountNumber, accountName });
      setAccountDetails(formatAccountDetails(bankName, accountNumber, accountName));
      toast.success('Bank account saved successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save bank account');
    } finally {
      setSavingAccount(false);
    }
  };

  const checkWithdrawalConditions = () => {
    if (!canSubmit) {
      if (isDailyTask) {
        setErrorModal({
          icon: FiCalendar,
          color: 'amber',
          title: 'Withdrawal Not Available Today',
          message: `Daily Task withdrawals are restricted to <strong>Mondays</strong> and <strong>Fridays</strong>. Since today is <strong>${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][today]}</strong>, you will be able to withdraw on the next available day: <strong>${nextWithdrawalDay()}</strong>. Please check back then.`,
        });
      } else {
        setErrorModal({
          icon: FiClock,
          color: 'amber',
          title: 'Withdrawal Window Currently Closed',
          message: 'Referral Bonus withdrawals can only be processed between <strong>8:00 AM</strong> and <strong>3:00 PM</strong> daily. The withdrawal window is currently closed. Please try again during operating hours.',
        });
      }
      return false;
    }
    if (!amount || !amount.trim()) {
      setErrorModal({
        icon: FiAlertCircle,
        color: 'red',
        title: 'Withdrawal Amount Required',
        message: 'Please enter the amount you wish to withdraw. This field cannot be left empty.',
      });
      return false;
    }
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorModal({
        icon: FiAlertCircle,
        color: 'red',
        title: 'Invalid Withdrawal Amount',
        message: 'The amount you entered is not valid. Please enter a numeric value greater than zero.',
      });
      return false;
    }
    if (numericAmount < minWithdrawal) {
      setErrorModal({
        icon: FiAlertCircle,
        color: 'red',
        title: 'Below Minimum Withdrawal Amount',
        message: `The minimum withdrawal amount for <strong>${isDailyTask ? 'Daily Task Earnings' : 'Referral Bonus'}</strong> is <strong>₦${minWithdrawal.toLocaleString()}</strong>. Please increase your withdrawal amount to at least <strong>₦${minWithdrawal.toLocaleString()}</strong>.`,
      });
      return false;
    }
    const balanceLabel = isDailyTask ? 'Wallet' : 'Referral';
    const availableBalance = isDailyTask ? walletBalance : referralBalance;
    if (numericAmount > availableBalance) {
      setErrorModal({
        icon: FiXCircle,
        color: 'red',
        title: `Insufficient ${balanceLabel} Balance`,
        message: `Your current <strong>${balanceLabel.toLowerCase()} balance</strong> is <strong>₦${availableBalance.toLocaleString()}</strong>, which is less than the <strong>₦${numericAmount.toLocaleString()}</strong> you requested. Please enter a lower amount or earn more before withdrawing.`,
      });
      return false;
    }
    if (!accountDetails.trim()) {
      setErrorModal({
        icon: FiAlertCircle,
        color: 'red',
        title: 'Bank Account Not Configured',
        message: 'You need to save your bank account details before you can make a withdrawal. Please fill in your <strong>Bank Name</strong>, <strong>Account Number</strong>, and <strong>Account Name</strong> in the "Withdrawal Account" section above, then click <strong>Save Bank Account</strong>.',
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!checkWithdrawalConditions()) return;

    setSubmitting(true);
    try {
      await withdrawalAPI.create({
        amount: numericAmount,
        paymentMethod: 'bank',
        accountDetails,
        withdrawalType,
      });
      toast.success('Withdrawal request submitted successfully!');
      setAmount('');

      const [wdRes, userRes] = await Promise.all([
        withdrawalAPI.getAll(),
        authAPI.getMe(),
      ]);
      setWithdrawals(wdRes.data.withdrawals || wdRes.data);
      const u = userRes.data || userRes.user || userRes;
      setWalletBalance(u.walletBalance || 0);
      setReferralBalance(u.referralBalance || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit withdrawal');
    } finally {
      setSubmitting(false);
    }
  };

  const nextWithdrawalDay = () => {
    const days = [1, 5];
    for (const d of days) {
      if (d > today) return DAY_NAMES[d];
    }
    return DAY_NAMES[days[0]];
  };

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

        {/* Withdrawal Type Info */}
        {withdrawalType === 'daily_task' && !isAllowedDay && (
          <div className="flex items-start gap-3 p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-xl">
            <FiAlertCircle size={20} className="text-warning-500 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-warning-700 dark:text-warning-400 text-sm">Daily Task Withdrawal Unavailable Today</h3>
              <p className="text-sm text-warning-600 dark:text-warning-300 mt-1">
                Daily Task withdrawals can only be processed on Monday and Friday. Next available day: {nextWithdrawalDay()}.
              </p>
            </div>
          </div>
        )}
        {withdrawalType === 'referral_bonus' && !isReferralTime && (
          <div className="flex items-start gap-3 p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-xl">
            <FiAlertCircle size={20} className="text-warning-500 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-warning-700 dark:text-warning-400 text-sm">Referral Bonus Withdrawal Window Closed</h3>
              <p className="text-sm text-warning-600 dark:text-warning-300 mt-1">
                Referral Bonus withdrawals are only available from 8:00 AM to 3:00 PM daily. Please come back during these hours.
              </p>
            </div>
          </div>
        )}

        {/* Bank Account Management */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <FiCheckCircle size={20} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-dark-900 dark:text-white">Withdrawal Account</h2>
              <p className="text-xs text-dark-400">Select your bank and enter your account details (saved for future withdrawals)</p>
            </div>
          </div>

          <form onSubmit={handleSaveBankAccount} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-dark-500 dark:text-dark-400 mb-1">Bank Name</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select a bank</option>
                  {BANKS.map((bank) => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-dark-500 dark:text-dark-400 mb-1">Account Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 0123456789"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-dark-500 dark:text-dark-400 mb-1">Account Name</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="input-field"
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={savingAccount}>
              {savingAccount ? 'Saving...' : 'Save Bank Account'}
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Withdrawal Form */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-dark-900 dark:text-white mb-4">Request Withdrawal</h2>

            {/* Withdrawal Type Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => { setWithdrawalType('daily_task'); setErrorModal(null); }}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                  withdrawalType === 'daily_task'
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-100 dark:bg-dark-700 text-dark-600 dark:text-dark-300'
                }`}
              >
                Daily Task Earnings
              </button>
              <button
                type="button"
                onClick={() => { setWithdrawalType('referral_bonus'); setErrorModal(null); }}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                  withdrawalType === 'referral_bonus'
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-100 dark:bg-dark-700 text-dark-600 dark:text-dark-300'
                }`}
              >
                Referral Bonus
              </button>
            </div>

            {/* Balance Display */}
            <div className="mb-4 p-3 bg-dark-50 dark:bg-dark-800 rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium text-dark-600 dark:text-dark-300">
                Available {isDailyTask ? 'Wallet' : 'Referral'} Balance
              </span>
              <span className="text-lg font-bold text-dark-900 dark:text-white">
                ₦{Number(isDailyTask ? walletBalance : referralBalance).toLocaleString()}
              </span>
            </div>

            {/* Write-up for current withdrawal type */}
            {withdrawalType === 'daily_task' ? (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-400">
                  <FiInfo size={16} />
                  Daily Task Earnings — Withdrawal Rules
                </div>
                <ul className="text-xs text-blue-600 dark:text-blue-300 space-y-1 ml-5 list-disc">
                  <li>Minimum withdrawal: <strong>₦5,000</strong></li>
                  <li>Available on: <strong>Monday</strong> and <strong>Friday</strong> only</li>
                  <li>Withdraw the earnings you have accumulated from completing daily tasks</li>
                  <li>Your wallet balance must be at least the withdrawal amount</li>
                </ul>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-400">
                  <FiInfo size={16} />
                  Referral Bonus — Withdrawal Rules
                </div>
                <ul className="text-xs text-green-600 dark:text-green-300 space-y-1 ml-5 list-disc">
                  <li>Minimum withdrawal: <strong>₦2,000</strong></li>
                  <li>Available <strong>every day</strong> from <strong>8:00 AM to 3:00 PM</strong></li>
                  <li>Withdraw commissions earned from referring new members</li>
                  <li>You can only withdraw up to your available referral bonus balance</li>
                </ul>
              </div>
            )}

            {/* Schedule indicator */}
            <div className="mb-4 p-2.5 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg flex items-center gap-2">
              {withdrawalType === 'daily_task' ? (
                <>
                  <FiCalendar size={14} className="text-primary-600 dark:text-primary-400" />
                  <p className="text-xs text-primary-700 dark:text-primary-400 font-medium">
                    Withdrawal Days: <strong>Monday &amp; Friday</strong>
                    {isAllowedDay && <span className="text-success-500 ml-1">— Available Today</span>}
                  </p>
                </>
              ) : (
                <>
                  <FiClock size={14} className="text-primary-600 dark:text-primary-400" />
                  <p className="text-xs text-primary-700 dark:text-primary-400 font-medium">
                    Withdrawal Hours: <strong>8:00 AM — 3:00 PM</strong> (Daily)
                    {isReferralTime && <span className="text-success-500 ml-1">— Open Now</span>}
                  </p>
                </>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Amount (Min: ₦{minWithdrawal.toLocaleString()})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 font-medium">₦</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); setErrorModal(null); }}
                    placeholder="0.00"
                    className="input-field pl-8"
                  />
                </div>

              </div>

              {numericAmount > 0 && (
                <div className="p-3 bg-dark-50 dark:bg-dark-800 rounded-lg space-y-1 text-sm">
                  <div className="flex justify-between text-dark-500">
                    <span>Charge ({(chargeRate * 100).toFixed(0)}%)</span>
                    <span className="text-danger-500">-₦{charge.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-dark-900 dark:text-white border-t border-dark-200 dark:border-dark-700 pt-1">
                    <span>Net Amount</span>
                    <span className="text-success-500">₦{netAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Account Details
                </label>
                <textarea
                  value={accountDetails}
                  readOnly
                  placeholder="Save your bank account above first..."
                  rows={3}
                  className="input-field resize-none bg-dark-50 dark:bg-dark-800 cursor-not-allowed"
                />

                <p className="text-xs text-dark-400 mt-1">
                  Your saved bank account will be used for this withdrawal
                </p>
              </div>

              <button type="submit" className="btn-danger w-full" disabled={submitting}>
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
                      <th>Type</th>
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
                        <td className="text-xs">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            wd.withdrawalType === 'referral_bonus'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          }`}>
                            {wd.withdrawalType === 'referral_bonus' ? 'Referral' : 'Daily Task'}
                          </span>
                        </td>
                        <td className="font-medium">₦{Number(wd.amount).toLocaleString()}</td>
                        <td className="text-danger-500 text-sm">-₦{Number(wd.charge || wd.amount * chargeRate).toFixed(2)}</td>
                        <td className="text-success-500 font-medium">₦{Number(wd.netAmount || wd.amount * (1 - chargeRate)).toFixed(2)}</td>
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

      {errorModal && (
        <Modal isOpen={true} onClose={() => setErrorModal(null)} title={errorModal.title}>
          <div className="text-center">
            <div className={`mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center ${
              errorModal.color === 'amber'
                ? 'bg-amber-100 dark:bg-amber-900/30'
                : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              <errorModal.icon className={`w-6 h-6 ${
                errorModal.color === 'amber'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-red-600 dark:text-red-400'
              }`} />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: errorModal.message }} />
            <button
              onClick={() => setErrorModal(null)}
              className="mt-6 w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Got it
            </button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
