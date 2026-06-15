'use client';
import { useState, useEffect, useRef } from 'react';
import { depositAPI, paymentAccountAPI, productAPI, uploadsBase } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { FiDollarSign, FiUpload, FiRefreshCw, FiPackage, FiX, FiCheckCircle } from 'react-icons/fi';
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
  const [products, setProducts] = useState([]);
  const [paymentAccount, setPaymentAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [validation, setValidation] = useState({});
  const fileRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [depositRes, accountRes, prodRes] = await Promise.all([
          depositAPI.getAll(),
          paymentAccountAPI.getActive(),
          productAPI.getAll(),
        ]);
        setDeposits(depositRes.data || []);
        setPaymentAccount(accountRes.data || null);
        setProducts(prodRes.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load wallet data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePayNow = () => {
    if (!selectedProduct) {
      toast.error('Please select a deposit amount');
      return;
    }
    if (!paymentAccount) {
      toast.error('No active payment account available');
      return;
    }
    setShowPayModal(true);
    setValidation({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!proofFile) {
      setValidation({ proof: 'Please upload payment proof' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await depositAPI.create({ amount: selectedProduct.price });
      const deposit = res.data;

      if (deposit?._id && proofFile) {
        const formData = new FormData();
        formData.append('paymentProof', proofFile);
        await depositAPI.uploadProof(deposit._id, formData);
      }

      toast.success('Deposit submitted successfully!');
      setShowPayModal(false);
      setSelectedProduct(null);
      setProofFile(null);
      if (fileRef.current) fileRef.current.value = '';

      const depRes = await depositAPI.getAll();
      setDeposits(depRes.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit deposit');
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowPayModal(false);
    setProofFile(null);
    setValidation({});
    if (fileRef.current) fileRef.current.value = '';
  };

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
            <h2 className="text-lg font-semibold text-dark-900 dark:text-white mb-4">Select Deposit Amount</h2>

            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-3">
                Choose a product amount to deposit
              </label>
              {products.length === 0 ? (
                <p className="text-sm text-dark-400 py-4 text-center">No products available</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {products.map((product) => (
                    <button
                      key={product._id}
                      type="button"
                      onClick={() => { setSelectedProduct(product); setValidation({}); }}
                      className={`p-4 rounded-xl border text-center transition-all ${
                        selectedProduct?._id === product._id
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500/20'
                          : 'border-dark-200 dark:border-dark-700 hover:border-primary-300'
                      }`}
                    >
                      <p className="text-lg font-bold text-dark-900 dark:text-white">
                        ₦{Number(product.price).toLocaleString()}
                      </p>
                      <p className="text-xs text-dark-400 mt-1">{product.name}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedProduct && (
              <div className="mt-6">
                <div className="p-4 bg-dark-50 dark:bg-dark-800 rounded-lg mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-dark-400">Product</span>
                    <span className="font-medium text-dark-900 dark:text-white">{selectedProduct.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-400">Amount</span>
                    <span className="font-bold text-lg text-primary-500">₦{Number(selectedProduct.price).toLocaleString()}</span>
                  </div>
                </div>
                <button onClick={handlePayNow} className="btn-primary w-full">
                  <FiDollarSign size={16} /> Pay Now
                </button>
              </div>
            )}
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
                      <th>Proof</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deposits.map((dep) => (
                      <tr key={dep._id}>
                        <td className="text-xs text-dark-400 whitespace-nowrap">
                          {new Date(dep.createdAt || dep.date).toLocaleDateString()}
                        </td>
                        <td className="font-medium">₦{Number(dep.amount).toLocaleString()}</td>
                        <td>
                          {dep.paymentProof ? (
                            <a href={`${uploadsBase}/${dep.paymentProof}`} target="_blank" rel="noopener noreferrer"
                              className="text-primary-500 hover:text-primary-600 text-xs font-medium">View</a>
                          ) : '-'}
                        </td>
                        <td>{statusBadge(dep.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pay Now Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={closeModal}>
          <div className="bg-white dark:bg-dark-800 rounded-2xl max-w-md w-full p-6 animate-scale-in shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-dark-900 dark:text-white">Complete Payment</h2>
              <button onClick={closeModal} className="text-dark-400 hover:text-dark-600 dark:hover:text-dark-200">
                <FiX size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Amount Summary */}
              <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl text-center">
                <p className="text-sm text-dark-500 dark:text-dark-400 mb-1">Amount to Pay</p>
                <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                  ₦{Number(selectedProduct?.price).toLocaleString()}
                </p>
                <p className="text-xs text-dark-400 mt-1">{selectedProduct?.name}</p>
              </div>

              {/* Payment Account Details */}
              {paymentAccount && (
                <div className="p-4 border border-dark-200 dark:border-dark-700 rounded-xl">
                  <h3 className="text-sm font-semibold text-dark-900 dark:text-white mb-3 flex items-center gap-2">
                    <FiCheckCircle size={16} className="text-success-500" />
                    Transfer to This Account
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-dark-400">Bank</span>
                      <span className="font-medium text-dark-900 dark:text-white">{paymentAccount.bankName || paymentAccount.bank}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">Account Number</span>
                      <span className="font-medium text-dark-900 dark:text-white">{paymentAccount.accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">Account Name</span>
                      <span className="font-medium text-dark-900 dark:text-white">{paymentAccount.accountName}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Proof */}
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                    Upload Payment Proof
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
                        <p>Click to upload receipt or screenshot</p>
                        <p className="text-xs mt-1">JPG, PNG, PDF accepted</p>
                      </div>
                    )}
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => { setProofFile(e.target.files[0]); setValidation({}); }}
                    />
                  </div>
                  {validation.proof && <p className="text-xs text-danger-500 mt-1">{validation.proof}</p>}
                </div>

                <button type="submit" className="btn-primary w-full" disabled={submitting}>
                  {submitting ? 'Submitting...' : <><FiDollarSign size={16} /> Submit Deposit</>}
                </button>
              </form>

              <p className="text-xs text-dark-400 text-center">
                After payment, upload the receipt and click submit. Your deposit will be reviewed by admin.
              </p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
