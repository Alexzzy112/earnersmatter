'use client';
import { useState } from 'react';
import { userAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import AdminLayout from '@/components/layout/AdminLayout';
import { FiUser, FiMail, FiPhone, FiShield, FiSave, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AdminProfilePage() {
  const { user, updateUser } = useAuth();
  const [profileData, setProfileData] = useState({ username: user?.username || '', phone: user?.phone || '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const validateProfile = () => {
    const errors = {};
    if (!profileData.username.trim()) errors.username = 'Username is required';
    if (profileData.phone && !/^\+?[\d\s-]{7,}$/.test(profileData.phone)) errors.phone = 'Invalid phone number';
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePassword = () => {
    const errors = {};
    if (!passwordData.currentPassword) errors.currentPassword = 'Current password is required';
    if (!passwordData.newPassword || passwordData.newPassword.length < 6) errors.newPassword = 'Password must be at least 6 characters';
    if (passwordData.newPassword !== passwordData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!validateProfile()) return;
    setSavingProfile(true);
    try {
      const res = await userAPI.updateProfile(profileData);
      updateUser(res.data.user || res.data);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;
    setSavingPassword(true);
    try {
      await userAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Admin Profile</h1>
          <p className="text-dark-400 text-sm mt-1">Manage your account settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card p-6 lg:col-span-1">
            <div className="text-center">
              <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUser size={32} className="text-white" />
              </div>
              <h2 className="text-lg font-semibold text-dark-900 dark:text-white">{user?.username || 'Admin'}</h2>
              <p className="text-sm text-dark-400">{user?.email}</p>
            </div>

            <div className="divider" />

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <FiMail size={16} className="text-dark-400" />
                <span className="text-dark-600 dark:text-dark-300">{user?.email || '-'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <FiPhone size={16} className="text-dark-400" />
                <span className="text-dark-600 dark:text-dark-300">{user?.phone || 'Not set'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                {user?.isActive || user?.status === 'active' ? (
                  <FiCheckCircle size={16} className="text-success-500" />
                ) : (
                  <FiXCircle size={16} className="text-danger-500" />
                )}
                <span className="text-dark-600 dark:text-dark-300">
                  {user?.isActive || user?.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
                <FiUser size={18} /> Edit Profile
              </h2>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Username</label>
                  <input
                    type="text"
                    value={profileData.username}
                    onChange={(e) => { setProfileData({ ...profileData, username: e.target.value }); setProfileErrors({}); }}
                    className="input-field"
                  />
                  {profileErrors.username && <p className="text-xs text-danger-500 mt-1">{profileErrors.username}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Email</label>
                  <input type="email" value={user?.email || ''} disabled className="input-field opacity-60 cursor-not-allowed" />
                  <p className="text-xs text-dark-400 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Phone</label>
                  <input
                    type="text"
                    value={profileData.phone}
                    onChange={(e) => { setProfileData({ ...profileData, phone: e.target.value }); setProfileErrors({}); }}
                    placeholder="+1234567890"
                    className="input-field"
                  />
                  {profileErrors.phone && <p className="text-xs text-danger-500 mt-1">{profileErrors.phone}</p>}
                </div>
                <button type="submit" className="btn-primary" disabled={savingProfile}>
                  {savingProfile ? 'Saving...' : <><FiSave size={16} /> Save Changes</>}
                </button>
              </form>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
                <FiShield size={18} /> Change Password
              </h2>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => { setPasswordData({ ...passwordData, currentPassword: e.target.value }); setPasswordErrors({}); }}
                    className="input-field"
                  />
                  {passwordErrors.currentPassword && <p className="text-xs text-danger-500 mt-1">{passwordErrors.currentPassword}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => { setPasswordData({ ...passwordData, newPassword: e.target.value }); setPasswordErrors({}); }}
                    className="input-field"
                  />
                  {passwordErrors.newPassword && <p className="text-xs text-danger-500 mt-1">{passwordErrors.newPassword}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => { setPasswordData({ ...passwordData, confirmPassword: e.target.value }); setPasswordErrors({}); }}
                    className="input-field"
                  />
                  {passwordErrors.confirmPassword && <p className="text-xs text-danger-500 mt-1">{passwordErrors.confirmPassword}</p>}
                </div>
                <button type="submit" className="btn-primary" disabled={savingPassword}>
                  {savingPassword ? 'Updating...' : <><FiShield size={16} /> Change Password</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
