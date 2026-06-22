'use client';
import { useState, useEffect } from 'react';
import { FiTrendingUp, FiShield, FiClock, FiX } from 'react-icons/fi';

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
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${
          dismissing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleDismiss}
      />

      <div
        className={`relative w-full max-w-lg transform transition-all duration-500 ${
          dismissing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />

          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors"
          >
            <FiX size={18} />
          </button>

          <div className="relative p-6 md:p-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <FiTrendingUp size={22} className="text-white" />
              </div>

              <div className="space-y-1">
                <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                  Welcome to{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">
                    EarnersMatter
                  </span>
                </h1>
                <p className="text-slate-400 text-xs">
                  Your trusted platform for smart investments and daily earnings
                </p>
              </div>

              <div className="w-10 h-0.5 bg-gradient-to-r from-indigo-500/50 via-emerald-500/50 to-indigo-500/50 rounded-full" />

              <div className="grid grid-cols-3 gap-3 w-full">
                <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-800/50 border border-slate-700/30">
                  <div className="p-1 rounded-lg bg-indigo-500/10">
                    <FiTrendingUp size={13} className="text-indigo-400" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-300">Smart Investments</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-800/50 border border-slate-700/30">
                  <div className="p-1 rounded-lg bg-emerald-500/10">
                    <FiShield size={13} className="text-emerald-400" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-300">Secure Platform</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-800/50 border border-slate-700/30">
                  <div className="p-1 rounded-lg bg-amber-500/10">
                    <FiClock size={13} className="text-amber-400" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-300">Daily Returns</span>
                </div>
              </div>

              <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                Invest in curated products, complete daily tasks to maximize your earnings, and grow your portfolio with confidence.
              </p>

              <button
                onClick={handleDismiss}
                className="group relative w-full py-2.5 px-6 bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-400 hover:to-emerald-400 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 active:scale-[0.98]"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Get Started
                  <FiTrendingUp size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
