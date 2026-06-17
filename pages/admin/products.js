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
  FiGrid, FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiPackage, FiRefreshCw
} from 'react-icons/fi';

const emptyProduct = { name: '', description: '', price: '', dailyEarnings: '', duration: '', minPurchase: '', maxPurchase: '', status: 'active', image: '' };

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ ...emptyProduct });
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resetting, setResetting] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getProducts();
      setProducts(res.data || []);
    } catch (err) {
      toast.error('Failed to load products');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const openCreate = () => { setFormData({ ...emptyProduct }); setEditing(null); setShowForm(true); };
  const openEdit = (product) => {
    setFormData({
      name: product.name || '', description: product.description || '', price: product.price || '',
      dailyEarnings: product.dailyEarnings || '', duration: product.duration || '',
      minPurchase: product.minPurchase || '', maxPurchase: product.maxPurchase || '',
      status: product.status || 'active', image: product.image || '',
    });
    setEditing(product._id); setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) { toast.error('Name and price are required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        dailyEarnings: parseFloat(formData.dailyEarnings) || 0,
        duration: parseInt(formData.duration) || 0,
        minPurchase: parseFloat(formData.minPurchase) || 0,
        maxPurchase: parseFloat(formData.maxPurchase) || 0,
      };
      if (editing) { await adminAPI.updateProduct(editing, payload); toast.success('Product updated'); }
      else { await adminAPI.createProduct(payload); toast.success('Product created'); }
      setShowForm(false); fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await adminAPI.deleteProduct(deleteTarget._id);
      toast.success('Product deleted');
      setDeleteTarget(null); fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete product');
    } finally { setSaving(false); }
  };

  const handleToggleStatus = async (id) => {
    try {
      await adminAPI.toggleProductStatus(id);
      toast.success('Product status toggled');
      fetchProducts();
    } catch (err) { toast.error('Failed to toggle product status'); }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Product Management</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Create and manage investment products</p>
          </div>
          <div className="flex gap-2">
            <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700">
              <FiPlus className="w-4 h-4" /> Create Product
            </button>
            <button
              onClick={async () => {
                if (!window.confirm('Reset all products to default? This will delete existing products.')) return;
                setResetting(true);
                try {
                  await adminAPI.resetProducts();
                  toast.success('Products reset successfully');
                  fetchProducts();
                } catch (err) {
                  toast.error(err.response?.data?.message || 'Reset failed');
                } finally { setResetting(false); }
              }}
              disabled={resetting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50"
            >
              <FiRefreshCw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} /> Reset
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-5 animate-pulse">
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-dark-700 rounded mb-3" />
                <div className="h-3 w-full bg-gray-200 dark:bg-dark-700 rounded mb-2" />
                <div className="h-3 w-2/3 bg-gray-200 dark:bg-dark-700 rounded" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700">
            <EmptyState icon={FiPackage} title="No products yet" description="Create your first investment product to get started."
              action={<button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"><FiPlus className="w-4 h-4" /> Create Product</button>} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <div key={product._id} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <FiGrid className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{product.name}</h3>
                      <div className="mt-1"><StatusBadge status={product.status} /></div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleToggleStatus(product._id)}
                      className={`p-1.5 rounded-lg ${product.status === 'active' ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700'}`}
                      title={product.status === 'active' ? 'Deactivate' : 'Activate'}>
                      {product.status === 'active' ? <FiToggleRight className="w-4 h-4" /> : <FiToggleLeft className="w-4 h-4" />}
                    </button>
                    <button onClick={() => openEdit(product)} className="p-1.5 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20" title="Edit">
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(product)} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete">
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{product.description || 'No description'}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-400 dark:text-gray-500">Price</span><p className="font-semibold text-green-600 dark:text-green-400">₦{(product.price || 0).toLocaleString()}</p></div>
                  <div><span className="text-gray-400 dark:text-gray-500">Daily Earnings</span><p className="font-semibold text-blue-600 dark:text-blue-400">₦{(product.dailyEarnings || 0).toLocaleString()}</p></div>
                  <div><span className="text-gray-400 dark:text-gray-500">Duration</span><p className="font-semibold text-gray-900 dark:text-white">{product.duration || 0} days</p></div>
                  <div><span className="text-gray-400 dark:text-gray-500">Total (30 days)</span><p className="font-semibold text-primary-600 dark:text-primary-400">₦{((product.dailyEarnings || 0) * (product.duration || 0)).toLocaleString()}</p></div>
                </div>
                {product.image && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-700">
                    <img src={product.image} alt={product.name} className="w-full h-32 object-cover rounded-lg" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Product' : 'Create Product'} size="lg">
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
              <input className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Product name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 !min-h-[80px]"
                value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Product description" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price *</label>
                <input type="number" step="0.01" className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Daily Earnings</label>
                <input type="number" step="0.01" className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  value={formData.dailyEarnings} onChange={(e) => setFormData({ ...formData, dailyEarnings: e.target.value })} placeholder="0.00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (days)</label>
                <input type="number" className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} placeholder="30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Purchase</label>
                <input type="number" step="0.01" className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  value={formData.minPurchase} onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })} placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Purchase</label>
                <input type="number" step="0.01" className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  value={formData.maxPurchase} onChange={(e) => setFormData({ ...formData, maxPurchase: e.target.value })} placeholder="10000" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL</label>
              <input className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} placeholder="https://example.com/image.jpg" />
            </div>
            {formData.image && (
              <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-dark-700">
                <img src={formData.image} alt="Preview" className="w-full h-40 object-cover" />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-700">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700">Cancel</button>
            <button onClick={handleSave} disabled={saving || !formData.name || !formData.price}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {saving ? 'Saving...' : editing ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </Modal>

        {/* Delete Confirmation */}
        <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="" size="sm">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto mb-4 flex items-center justify-center">
              <FiTrash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Product</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
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
