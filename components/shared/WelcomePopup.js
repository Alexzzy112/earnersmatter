'use client';
import { useState, useEffect } from 'react';
import { FiStar, FiCheck, FiInfo } from 'react-icons/fi';

const POPUP_SEEN_KEY = 'em_welcome_seen';

export default function WelcomePopup() {
  const [visible, setVisible] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(POPUP_SEEN_KEY);
    if (!seen) {
      const timer = setTimeout(() => setVisible(true), 300);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setDismissing(true);
    setTimeout(() => {
      localStorage.setItem(POPUP_SEEN_KEY, 'true');
      setVisible(false);
    }, 400);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-500 ${
          dismissing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleDismiss}
      />

      <div
        className={`relative w-full max-w-lg transform transition-all duration-500 ${
          dismissing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* Animated gradient border */}
        <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-300 to-orange-500 opacity-75 blur-sm animate-pulse" />
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-300 to-orange-500 opacity-50" />

        <div className="relative bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          {/* Background decorative elements */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />

          <div className="relative p-8 md:p-10 text-center space-y-6">
            {/* Logo / Icon */}
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 animate-bounce-slow">
              <FiStar size={36} className="text-white" />
            </div>

            {/* Decorative sparkles */}
            <div className="absolute top-8 left-8 text-yellow-400/30">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div className="absolute bottom-8 right-8 text-yellow-400/20">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-300">
                Welcome to EarnersMatter!
              </h1>
              <div className="mt-2 h-0.5 w-20 mx-auto bg-gradient-to-r from-amber-400 to-orange-500 rounded-full" />
            </div>

            {/* Company Description */}
            <div className="space-y-3 text-sm md:text-base leading-relaxed">
              <p className="text-gray-300">
                EarnersMatter is a premier <span className="text-amber-300 font-semibold">Nigerian investment platform</span> designed to help you grow your wealth through carefully curated investment products and daily earning opportunities.
              </p>
              <p className="text-gray-300">
                We combine the power of <span className="text-amber-300 font-semibold">smart investments</span> with an engaging daily task system, allowing you to earn consistently while building a diversified portfolio — all from the comfort of your home.
              </p>
              <div className="flex items-center justify-center gap-6 pt-2 text-gray-400 text-sm">
                <div className="flex items-center gap-1.5">
                  <FiCheck className="text-green-400" size={14} />
                  <span>Secure &amp; Reliable</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FiCheck className="text-green-400" size={14} />
                  <span>24/7 Support</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FiCheck className="text-green-400" size={14} />
                  <span>Quick Withdrawals</span>
                </div>
              </div>
            </div>

            {/* Launch Date Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-full">
              <FiInfo size={14} className="text-amber-400" />
              <span className="text-amber-300 text-sm font-medium">
                Launched <span className="font-bold">1st April 2026</span> — Join thousands of smart investors!
              </span>
            </div>

            {/* OK Button */}
            <button
              onClick={handleDismiss}
              className="relative group w-full py-3.5 px-8 mt-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-lg rounded-xl shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all duration-300 active:scale-[0.98] overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Get Started
                <FiCheck size={20} />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </button>

            <p className="text-xs text-gray-500">
              Start your investment journey today and watch your earnings grow!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
