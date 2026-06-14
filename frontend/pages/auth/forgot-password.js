'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { FaEnvelope, FaArrowLeft, FaSpinner, FaCheckCircle } from 'react-icons/fa';
import { HiShieldCheck } from 'react-icons/hi';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Invalid email address');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authAPI.forgotPassword(email.trim());
      if (res?.success) {
        setSent(true);
        toast.success('Reset link sent to your email');
      } else {
        toast.error(res?.message || 'Failed to send reset link');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <HiShieldCheck className="w-10 h-10 text-primary-500" />
            <span className="text-3xl font-bold text-gradient">EarnersMatter</span>
          </Link>
          <p className="mt-3 text-dark-400 text-sm">Reset your password</p>
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl p-8">
          {sent ? (
            <div className="text-center py-4 animate-fade-in">
              <div className="mx-auto w-16 h-16 bg-success-500/10 rounded-full flex items-center justify-center mb-4">
                <FaCheckCircle className="w-8 h-8 text-success-400" />
              </div>
              <h3 className="text-lg font-semibold text-dark-100 mb-2">Check your email</h3>
              <p className="text-sm text-dark-400 mb-6">
                We&apos;ve sent a password reset link to <span className="text-dark-200 font-medium">{email}</span>
              </p>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors"
              >
                <FaArrowLeft size={12} />
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-sm text-dark-400 leading-relaxed">
                Enter the email address associated with your account and we&apos;ll send you a link to reset your password.
              </p>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500 text-sm" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="you@example.com"
                    className={`w-full pl-10 pr-4 py-2.5 bg-dark-900 border rounded-lg text-dark-200 placeholder-dark-500 text-sm outline-none transition-all ${
                      error ? 'border-danger-500 ring-1 ring-danger-500' : 'border-dark-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
                    }`}
                  />
                </div>
                {error && <p className="mt-1 text-xs text-danger-400">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-600/20"
              >
                {loading ? <FaSpinner className="animate-spin" /> : <FaEnvelope size={14} />}
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <p className="text-center">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 text-sm text-dark-400 hover:text-dark-300 transition-colors"
                >
                  <FaArrowLeft size={12} />
                  Back to login
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
