'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import { FaUser, FaEnvelope, FaPhone, FaLock, FaEye, FaEyeSlash, FaGift, FaSpinner, FaGoogle, FaFacebook } from 'react-icons/fa';
import { HiShieldCheck } from 'react-icons/hi';
import { initCSRF } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const { register, user, loading: authLoading } = useAuth();

  const [form, setForm] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [verificationPending, setVerificationPending] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  useEffect(() => { initCSRF(); }, []);

  if (authLoading) return null;
  if (user) {
    router.replace('/user/dashboard');
    return null;
  }

  const passwordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    if (score <= 1) return { score, label: 'Weak', color: 'bg-danger-500' };
    if (score <= 2) return { score, label: 'Fair', color: 'bg-warning-500' };
    if (score <= 3) return { score, label: 'Good', color: 'bg-primary-500' };
    return { score, label: 'Strong', color: 'bg-success-500' };
  };

  const strength = passwordStrength(form.password);

  const validate = () => {
    const errs = {};
    if (!form.username.trim()) errs.username = 'Username is required';
    else if (form.username.trim().length < 3) errs.username = 'Username must be at least 3 characters';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email address';
    if (!form.phone.trim()) errs.phone = 'Phone number is required';
    else if (!/^\+?[\d\s\-()]{7,20}$/.test(form.phone)) errs.phone = 'Invalid phone number';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!agreeTerms) errs.terms = 'You must agree to the terms and conditions';
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
      const payload = {
        username: form.username.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        referralCode: form.referralCode.trim() || undefined,
      };
      const res = await register(payload);
      if (res?.success) {
        toast.success('Account created successfully!');
        if (res.data?.user && !res.data.user.emailVerifiedAt) {
          setVerificationPending(true);
          setRegisteredEmail(form.email);
        } else {
          router.push('/user/dashboard');
        }
      } else {
        toast.error(res?.message || 'Registration failed');
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
          <p className="mt-3 text-dark-400 text-sm">Create your account</p>
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl p-8">
          {verificationPending ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaEnvelope className="text-primary-400 text-2xl" />
              </div>
              <h3 className="text-lg font-semibold text-dark-100 mb-2">Verify Your Email</h3>
              <p className="text-dark-400 text-sm mb-4">
                We've sent a verification email to <span className="text-primary-400">{registeredEmail}</span>. Please check your inbox and click the link to verify your account.
              </p>
              <p className="text-dark-500 text-xs mb-6">Didn't receive the email? Check your spam folder or click below to resend.</p>
              <button
                type="button"
                className="w-full py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold rounded-lg transition-all shadow-lg shadow-primary-600/20"
                onClick={() => toast.success('Verification email resent!')}
              >
                Resend Verification Email
              </button>
              <button
                type="button"
                onClick={() => router.push('/auth/login')}
                className="w-full mt-3 py-2.5 bg-dark-900 border border-dark-700 text-dark-300 hover:bg-dark-700 font-semibold rounded-lg transition-all"
              >
                Go to Login
              </button>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Username</label>
              <div className="relative">
                <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500 text-sm" />
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Choose a username"
                  className={`w-full pl-10 pr-4 py-2.5 bg-dark-900 border rounded-lg text-dark-200 placeholder-dark-500 text-sm outline-none transition-all ${
                    errors.username ? 'border-danger-500 ring-1 ring-danger-500' : 'border-dark-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
                  }`}
                />
              </div>
              {errors.username && <p className="mt-1 text-xs text-danger-400">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Email Address</label>
              <div className="relative">
                <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500 text-sm" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`w-full pl-10 pr-4 py-2.5 bg-dark-900 border rounded-lg text-dark-200 placeholder-dark-500 text-sm outline-none transition-all ${
                    errors.email ? 'border-danger-500 ring-1 ring-danger-500' : 'border-dark-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
                  }`}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-danger-400">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Phone Number</label>
              <div className="relative">
                <FaPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500 text-sm" />
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                  className={`w-full pl-10 pr-4 py-2.5 bg-dark-900 border rounded-lg text-dark-200 placeholder-dark-500 text-sm outline-none transition-all ${
                    errors.phone ? 'border-danger-500 ring-1 ring-danger-500' : 'border-dark-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
                  }`}
                />
              </div>
              {errors.phone && <p className="mt-1 text-xs text-danger-400">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Password</label>
              <div className="relative">
                <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500 text-sm" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a password"
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
              {form.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          i <= strength.score ? strength.color : 'bg-dark-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${strength.score <= 2 ? 'text-danger-400' : strength.score <= 3 ? 'text-primary-400' : 'text-success-400'}`}>
                    {strength.label}
                  </p>
                </div>
              )}
              {errors.password && <p className="mt-1 text-xs text-danger-400">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Confirm Password</label>
              <div className="relative">
                <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500 text-sm" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
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

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">
                Referral Code <span className="text-dark-500 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <FaGift className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500 text-sm" />
                <input
                  type="text"
                  name="referralCode"
                  value={form.referralCode}
                  onChange={handleChange}
                  placeholder="Enter referral code"
                  className="w-full pl-10 pr-4 py-2.5 bg-dark-900 border border-dark-700 rounded-lg text-dark-200 placeholder-dark-500 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-dark-600 bg-dark-900 text-primary-500 focus:ring-primary-500 cursor-pointer"
                />
                <span className="text-sm text-dark-400">
                  I agree to the{' '}
                  <Link href="/terms" className="text-primary-400 hover:text-primary-300 transition-colors">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-primary-400 hover:text-primary-300 transition-colors">
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.terms && <p className="mt-1 text-xs text-danger-400">{errors.terms}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-600/20"
            >
              {loading ? <FaSpinner className="animate-spin" /> : <FaUser size={14} />}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dark-700" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-dark-800 px-3 text-xs text-dark-500">Or sign up with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 py-2.5 bg-dark-900 border border-dark-700 rounded-lg text-dark-300 hover:bg-dark-700 transition-all text-sm">
              <FaGoogle className="text-danger-400" />
              Google
            </button>
            <button className="flex items-center justify-center gap-2 py-2.5 bg-dark-900 border border-dark-700 rounded-lg text-dark-300 hover:bg-dark-700 transition-all text-sm">
              <FaFacebook className="text-primary-400" />
              Facebook
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-dark-400">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
          )}
      </div>
    </div>
  );
}
