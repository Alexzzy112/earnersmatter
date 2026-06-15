import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Derive the uploads base URL from the API URL (strip trailing /api)
export const uploadsBase = API_URL.replace(/\/api\/?$/, '') + '/uploads';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  updateProfile: (data) => api.put('/auth/profile', data),
  updateBankAccount: (data) => api.put('/auth/bank-account', data),
  sendVerificationEmail: () => api.post('/auth/send-verification-email'),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
};

export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

export const walletAPI = {
  get: () => api.get('/wallet'),
  getBalance: () => api.get('/wallet'),
  getTransactions: (params) => api.get('/wallet/transactions', { params }),
};

export const depositAPI = {
  create: (data) => api.post('/deposits', data),
  uploadProof: (id, formData) => api.post(`/deposits/${id}/proof`, formData),
  getAll: (params) => api.get('/deposits', { params }),
  getById: (id) => api.get(`/deposits/${id}`),
};

export const withdrawalAPI = {
  create: (data) => api.post('/withdrawals', data),
  getAll: (params) => api.get('/withdrawals', { params }),
};

export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
};

export const investmentAPI = {
  purchase: (data) => api.post('/investments', data),
  getAll: (params) => api.get('/investments', { params }),
  getById: (id) => api.get(`/investments/${id}`),
};

export const earningAPI = {
  getAll: (params) => api.get('/earnings', { params }),
  getSchedule: (id) => api.get(`/earnings/schedule/${id}`),
};

export const referralAPI = {
  getAll: () => api.get('/referrals'),
  getStats: () => api.get('/referrals/stats'),
};

export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

export const paymentAccountAPI = {
  getActive: () => api.get('/payment-account/active'),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getRecentActivity: () => api.get('/admin/recent-activity'),

  getUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  suspendUser: (id) => api.put(`/admin/users/${id}/suspend`),
  activateUser: (id) => api.put(`/admin/users/${id}/activate`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),

  getDeposits: (params) => api.get('/admin/deposits', { params }),
  getDepositById: (id) => api.get(`/admin/deposits/${id}`),
  approveDeposit: (id) => api.put(`/admin/deposits/${id}/approve`),
  rejectDeposit: (id, note) => api.put(`/admin/deposits/${id}/reject`, { adminNote: note }),
  deleteDeposit: (id) => api.delete(`/admin/deposits/${id}`),

  getWithdrawals: (params) => api.get('/admin/withdrawals', { params }),
  getWithdrawalById: (id) => api.get(`/admin/withdrawals/${id}`),
  approveWithdrawal: (id) => api.put(`/admin/withdrawals/${id}/approve`),
  rejectWithdrawal: (id, note) => api.put(`/admin/withdrawals/${id}/reject`, { adminNote: note }),
  completeWithdrawal: (id) => api.put(`/admin/withdrawals/${id}/complete`),
  deleteWithdrawal: (id) => api.delete(`/admin/withdrawals/${id}`),

  getProducts: () => api.get('/admin/products'),
  createProduct: (data) => api.post('/admin/products', data),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  toggleProductStatus: (id) => api.put(`/admin/products/${id}/toggle`),

  getAllInvestments: (params) => api.get('/admin/investments', { params }),

  getPaymentAccounts: () => api.get('/admin/payment-accounts'),
  createPaymentAccount: (data) => api.post('/admin/payment-accounts', data),
  updatePaymentAccount: (id, data) => api.put(`/admin/payment-accounts/${id}`, data),
  activateAccount: (id) => api.put(`/admin/payment-accounts/${id}/activate`),
  deactivateAccount: (id) => api.put(`/admin/payment-accounts/${id}/deactivate`),
  getSwitchHistory: () => api.get('/admin/payment-accounts/switch-history'),

  getEarningSchedules: (params) => api.get('/admin/earnings/schedules', { params }),
  getAllEarnings: (params) => api.get('/admin/earnings', { params }),
  runManualEarning: () => api.post('/admin/earnings/run-manual'),

  getTransactionStats: () => api.get('/admin/reports/transactions'),
  getDepositReport: (params) => api.get('/admin/reports/deposits', { params }),
  getWithdrawalReport: (params) => api.get('/admin/reports/withdrawals', { params }),
  getEarningsReport: (params) => api.get('/admin/reports/earnings', { params }),
  exportReport: () => api.get('/admin/reports/export'),

  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),

  getSettings: () => api.get('/admin/settings'),
  updateSetting: (key, value) => api.put(`/admin/settings/${key}`, { value }),

  getNotificationUsers: () => api.get('/admin/notifications/users'),
  sendNotification: (data) => api.post('/admin/notifications/send', data),
};

export const userAPI = {
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const settingsAPI = {
  getDeposit: () => api.get('/settings/deposit'),
};

export const contactAPI = {
  get: () => api.get('/settings/contact'),
};

export default api;
