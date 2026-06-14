'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa';
import { HiShieldCheck } from 'react-icons/hi';
import { initCSRF } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { login, user, loading: authLoading } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [emailNotVerified, setEmailNotVerified] = useState(false);

  useEffect(() => { initCSRF(); }, []);

  if (authLoading) return null;
  if (user) {
    router.replace(user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard');
    return null;
  }

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email address';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
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
    setLoading(true);
    try {
      const res = await login(form.email, form.password);
      if (res?.success) {
        if (res.data?.user && !res.data.user.emailVerifiedAt) {
          setEmailNotVerified(true);
          return;
        }
        toast.success('Welcome back!');
        const role = res.data?.user?.role || user?.role;
        router.push(role === 'admin' ? '/admin/dashboard' : '/user/dashboard');
      } else {
        toast.error(res?.message || 'Login failed');
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
          <p className="mt-3 text-dark-400 text-sm">Sign in to your account</p>
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl p-8">
          {emailNotVerified && (
            <div className="mb-6 p-4 bg-warning-500/10 border border-warning-500/30 rounded-lg flex items-start gap-3">
              <div className="text-warning-400 text-lg mt-0.5">⚠</div>
              <div>
                <p className="text-warning-300 text-sm font-medium">Email not verified</p>
                <p className="text-warning-400/80 text-xs mt-1">
                  Please check your inbox for the verification email. If you haven't received it, you can{' '}
                  <button
                    type="button"
                    onClick={() => toast.success('Verification email resent!')}
                    className="text-warning-300 hover:text-warning-200 underline"
                  >
                    resend the verification email
                  </button>
                  .
                </p>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Email Address</label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`input-field pl-10 ${errors.email ? 'border-danger-500' : ''}`}
                />
              </div>
              {errors.email && <p className="text-danger-400 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Password</label>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={`input-field pl-10 pr-10 ${errors.password ? 'border-danger-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && <p className="text-danger-400 text-xs mt-1">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-dark-400">Remember me</span>
              </label>
              <Link href="/auth/forgot-password" className="text-sm text-primary-400 hover:text-primary-300">
                Forgot Password?
              </Link>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <FaSpinner className="animate-spin" /> : null}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-dark-400 text-sm mt-6">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-primary-400 hover:text-primary-300 font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
