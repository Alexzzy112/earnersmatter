'use client';
import { useState, useEffect, useRef } from 'react';
import { depositAPI, paymentAccountAPI, settingsAPI } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { FiDollarSign, FiUpload, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

const statusBadge = (status) => {
  const map = {
    approved: 'badge badge-success',
    pending: 'badge badge-warning',
    rejected: 'badge badge-danger',
    completed: 'badge badge-success',
  };
  return <span className={map[status] || 'badge badge-neutral'}>{status}</span>;
};

export default function WalletPage() {
  const [deposits, setDeposits] = useState([]);
  const [paymentAccount, setPaymentAccount] = useState(null);
  const [settings, setSettings] = useState({ minDeposit: 10, maxDeposit: 100000 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [amount, setAmount] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [validation, setValidation] = useState({});
  const fileRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [depositRes, accountRes, settingsRes] = await Promise.all([
          depositAPI.getAll(),
          paymentAccountAPI.getActive(),
          settingsAPI.getDeposit(),
        ]);
        setDeposits(depositRes.data.deposits || depositRes.data);
        setPaymentAccount(accountRes.data.account || accountRes.data);
        if (settingsRes.data) setSettings(settingsRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load wallet data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const validate = () => {
    const errors = {};
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt)) errors.amount = 'Please enter a valid amount';
    else if (amt < settings.minDeposit) errors.amount = `Minimum deposit is ₦${settings.minDeposit}`;
    else if (amt > settings.maxDeposit) errors.amount = `Maximum deposit is ₦${settings.maxDeposit}`;
    if (!proofFile) errors.proof = 'Please upload payment proof';
    setValidation(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('proof', proofFile);
      if (paymentAccount?._id) formData.append('paymentAccount', paymentAccount._id);

      await depositAPI.create(formData);
      toast.success('Deposit request submitted successfully!');
      setAmount('');
      setProofFile(null);
      if (fileRef.current) fileRef.current.value = '';

      const res = await depositAPI.getAll();
      setDeposits(res.data.deposits || res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit deposit');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <DashboardLayout><LoadingSpinner text="Loading wallet..." /></DashboardLayout>;
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
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Fund Wallet</h1>
          <p className="text-dark-400 text-sm mt-1">Deposit funds to your wallet</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Deposit Form */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-dark-900 dark:text-white mb-4">Make a Deposit</h2>

            {paymentAccount && (
              <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
                <h3 className="text-sm font-semibold text-primary-700 dark:text-primary-400 mb-2">Payment Details</h3>
                <p className="text-sm text-dark-700 dark:text-dark-300">
                  <span className="font-medium">Bank:</span> {paymentAccount.bankName || paymentAccount.bank}
                </p>
                <p className="text-sm text-dark-700 dark:text-dark-300">
                  <span className="font-medium">Account Number:</span> {paymentAccount.accountNumber}
                </p>
                <p className="text-sm text-dark-700 dark:text-dark-300">
                  <span className="font-medium">Account Name:</span> {paymentAccount.accountName}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Amount (Min: ₦{settings.minDeposit} - Max: ₦{settings.maxDeposit})
                </label>
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
                {validation.amount && <p className="text-xs text-danger-500 mt-1">{validation.amount}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Payment Proof
                </label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-dark-200 dark:border-dark-700 rounded-lg p-6 text-center cursor-pointer hover:border-primary-400 transition-colors"
                >
                  {proofFile ? (
                    <div className="text-sm text-dark-700 dark:text-dark-300">
                      <FiUpload size={24} className="mx-auto mb-2 text-success-500" />
                      <p className="font-medium">{proofFile.name}</p>
                      <p className="text-xs text-dark-400">{(proofFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div className="text-sm text-dark-400">
                      <FiUpload size={24} className="mx-auto mb-2" />
                      <p>Click to upload payment receipt or screenshot</p>
                      <p className="text-xs mt-1">JPG, PNG, PDF accepted</p>
                    </div>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => setProofFile(e.target.files[0])}
                  />
                </div>
                {validation.proof && <p className="text-xs text-danger-500 mt-1">{validation.proof}</p>}
              </div>

              <button type="submit" className="btn-primary w-full" disabled={submitting}>
                {submitting ? 'Submitting...' : <><FiDollarSign size={16} /> Submit Deposit</>}
              </button>
            </form>
          </div>

          {/* Deposit History */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-dark-900 dark:text-white mb-4">Deposit History</h2>
            {deposits.length === 0 ? (
              <p className="text-dark-400 text-sm py-8 text-center">No deposits yet</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Account</th>
                      <th>Status</th>
                      <th>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deposits.map((dep) => (
                      <tr key={dep._id}>
                        <td className="text-xs text-dark-400 whitespace-nowrap">
                          {new Date(dep.createdAt || dep.date).toLocaleDateString()}
                        </td>
                        <td className="font-medium">₦{Number(dep.amount).toLocaleString()}</td>
                        <td className="text-xs text-dark-400">{dep.account?.accountNumber || dep.accountNumber || '-'}</td>
                        <td>{statusBadge(dep.status)}</td>
                        <td>
                          {dep.receiptUrl || dep.receipt ? (
                            <a
                              href={dep.receiptUrl || dep.receipt}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-500 hover:text-primary-600 text-xs font-medium"
                            >
                              View
                            </a>
                          ) : '-'}
                        </td>
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
