'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { FaLock, FaEye, FaEyeSlash, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import { HiShieldCheck } from 'react-icons/hi';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing reset token');
    }
  }, [token]);

  const validate = () => {
    const errs = {};
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!token) {
      toast.error('Reset token is missing');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.resetPassword(token, form.password);
      if (res?.success) {
        setSuccess(true);
        toast.success('Password reset successfully!');
        setTimeout(() => router.push('/auth/login'), 2000);
      } else {
        toast.error(res?.message || 'Failed to reset password');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 px-4 py-12">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <HiShieldCheck className="w-10 h-10 text-primary-500" />
              <span className="text-3xl font-bold text-gradient">EarnersMatter</span>
            </Link>
          </div>
          <div className="bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-danger-500/10 rounded-full flex items-center justify-center mb-4">
              <FaExclamationTriangle className="w-8 h-8 text-danger-400" />
            </div>
            <h3 className="text-lg font-semibold text-dark-100 mb-2">Invalid Reset Link</h3>
            <p className="text-sm text-dark-400 mb-6">
              This password reset link is invalid or has expired.
            </p>
            <Link
              href="/auth/forgot-password"
              className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              Request a new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 px-4 py-12">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <HiShieldCheck className="w-10 h-10 text-primary-500" />
              <span className="text-3xl font-bold text-gradient">EarnersMatter</span>
            </Link>
          </div>
          <div className="bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl p-8 text-center animate-fade-in">
            <div className="mx-auto w-16 h-16 bg-success-500/10 rounded-full flex items-center justify-center mb-4">
              <FaLock className="w-8 h-8 text-success-400" />
            </div>
            <h3 className="text-lg font-semibold text-dark-100 mb-2">Password Reset Successful</h3>
            <p className="text-sm text-dark-400 mb-6">Redirecting you to login...</p>
            <Link
              href="/auth/login"
              className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              Go to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <HiShieldCheck className="w-10 h-10 text-primary-500" />
            <span className="text-3xl font-bold text-gradient">EarnersMatter</span>
          </Link>
          <p className="mt-3 text-dark-400 text-sm">Create a new password</p>
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">New Password</label>
              <div className="relative">
                <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500 text-sm" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  className={`w-full pl-10 pr-10 py-2.5 bg-dark-900 border rounded-lg text-dark-200 placeholder-dark-500 text-sm outline-none transition-all ${
                    errors.password ? 'border-danger-500 ring-1 ring-danger-500' : 'border-dark-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors"
                >
                  {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-danger-400">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Confirm New Password</label>
              <div className="relative">
                <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500 text-sm" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                  className={`w-full pl-10 pr-10 py-2.5 bg-dark-900 border rounded-lg text-dark-200 placeholder-dark-500 text-sm outline-none transition-all ${
                    errors.confirmPassword ? 'border-danger-500 ring-1 ring-danger-500' : 'border-dark-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors"
                >
                  {showConfirmPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-danger-400">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-600/20"
            >
              {loading ? <FaSpinner className="animate-spin" /> : <FaLock size={14} />}
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <p className="text-center">
              <Link
                href="/auth/login"
                className="text-sm text-dark-400 hover:text-dark-300 transition-colors"
              >
                Back to login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
