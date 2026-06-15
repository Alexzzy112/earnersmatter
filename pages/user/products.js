'use client';
import { useState, useEffect } from 'react';
import { productAPI, investmentAPI, walletAPI } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { FiPackage, FiTrendingUp, FiDollarSign, FiClock, FiRefreshCw, FiX, FiMinus, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [balance, setBalance] = useState(0);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, balRes] = await Promise.all([
          productAPI.getAll(),
          walletAPI.getBalance(),
        ]);
        setProducts(prodRes.data || []);
        setBalance(balRes.data?.walletBalance || 0);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const openModal = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setQuantity(1);
  };

  const handlePurchase = async () => {
    if (!selectedProduct) return;
    const totalCost = selectedProduct.price * quantity;
    if (totalCost > balance) {
      toast.error('Insufficient wallet balance');
      return;
    }

    setPurchasing(true);
    try {
      await investmentAPI.purchase({
        productId: selectedProduct._id,
        quantity,
      });
      toast.success('Investment purchased successfully!');
      closeModal();
      const balRes = await walletAPI.getBalance();
      setBalance(balRes.data.balance || balRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) return <DashboardLayout><LoadingSpinner text="Loading products..." /></DashboardLayout>;
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
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Investment Products</h1>
          <p className="text-dark-400 text-sm mt-1">Choose a product and start earning daily returns</p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16">
            <FiPackage size={48} className="mx-auto text-dark-300 dark:text-dark-600 mb-4" />
            <h2 className="text-xl font-semibold text-dark-600 dark:text-dark-400">No products available</h2>
            <p className="text-dark-400 text-sm mt-1">Check back later for new investment opportunities</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {products.map((product, idx) => (
              <div key={product._id} className="card-hover p-4 sm:p-5 relative">
                <div className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-bold shadow-lg">
                  {idx + 1}
                </div>
                {product.image ? (
                  <div className="w-full h-48 rounded-xl overflow-hidden mb-4 bg-dark-50 dark:bg-dark-800 flex items-center justify-center">
                    <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mb-4">
                    <FiPackage size={22} className="text-white" />
                  </div>
                )}
                <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-2">{product.name}</h3>
                <p className="text-sm text-dark-400 mb-4 line-clamp-2">{product.description}</p>

                <div className="space-y-2 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-400">Price</span>
                    <span className="font-semibold text-dark-900 dark:text-white">₦{Number(product.price).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-400">Daily Earnings</span>
                    <span className="font-semibold text-success-500">+₦{Number(product.dailyEarnings).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-400">Duration</span>
                    <span className="font-semibold text-dark-900 dark:text-white">{product.duration} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-400">Total Return</span>
                    <span className="font-semibold text-primary-500">₦{Number(product.totalReturn || product.price + product.dailyEarnings * product.duration).toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => openModal(product)}
                  className="btn-primary w-full"
                >
                  <FiTrendingUp size={16} /> Invest Now
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Purchase Modal */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-dark-900 dark:text-white">Confirm Purchase</h2>
              <button onClick={closeModal} className="text-dark-400 hover:text-dark-600 dark:hover:text-dark-200">
                <FiX size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-dark-50 dark:bg-dark-800 rounded-lg">
                <h3 className="font-medium text-dark-900 dark:text-white">{selectedProduct.name}</h3>
                <p className="text-sm text-dark-400">₦{Number(selectedProduct.price).toLocaleString()} per unit</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">Quantity</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg border border-dark-200 dark:border-dark-700 flex items-center justify-center text-dark-600 hover:bg-dark-100 dark:hover:bg-dark-800"
                  >
                    <FiMinus size={16} />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="input-field text-center w-20"
                    min="1"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-lg border border-dark-200 dark:border-dark-700 flex items-center justify-center text-dark-600 hover:bg-dark-100 dark:hover:bg-dark-800"
                  >
                    <FiPlus size={16} />
                  </button>
                </div>
              </div>

              <div className="p-4 bg-dark-50 dark:bg-dark-800 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-dark-400">Unit Price</span>
                  <span className="font-medium text-dark-900 dark:text-white">₦{Number(selectedProduct.price).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-400">Quantity</span>
                  <span className="font-medium text-dark-900 dark:text-white">{quantity}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-dark-200 dark:border-dark-700 pt-2">
                  <span className="text-dark-900 dark:text-white">Total Cost</span>
                  <span className="text-primary-500">₦{(selectedProduct.price * quantity).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-400">Wallet Balance</span>
                  <span className={`font-medium ${balance >= selectedProduct.price * quantity ? 'text-success-500' : 'text-danger-500'}`}>
                    ₦{Number(balance).toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={handlePurchase}
                disabled={purchasing || balance < selectedProduct.price * quantity}
                className="btn-primary w-full"
              >
                {purchasing ? 'Processing...' : <><FiTrendingUp size={16} /> Confirm Purchase</>}
              </button>

              {balance < selectedProduct.price * quantity && (
                <p className="text-xs text-danger-500 text-center">Insufficient balance. Please fund your wallet first.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
