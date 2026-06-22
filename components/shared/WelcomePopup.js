'use client';
import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';

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
        className={`relative w-full max-w-sm transform transition-all duration-500 ${
          dismissing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 z-10 p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors"
          >
            <FiX size={16} />
          </button>

          <div className="relative p-5">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="text-3xl">🌟</div>

              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">
                  Welcome to{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">
                    EarnersMatter
                  </span>
                </h1>
                <p className="text-slate-400 text-xs mt-0.5">
                  Where Your Effort Creates Opportunity
                </p>
              </div>

              <div className="grid grid-cols-2 gap-1.5 w-full text-left">
                <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-800/40 border border-slate-700/30">
                  <span className="text-sm">✨</span>
                  <span className="text-[11px] text-slate-300">Simple Daily Tasks</span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-800/40 border border-slate-700/30">
                  <span className="text-sm">💰</span>
                  <span className="text-[11px] text-slate-300">Earn Rewards</span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-800/40 border border-slate-700/30">
                  <span className="text-sm">📈</span>
                  <span className="text-[11px] text-slate-300">Track Your Growth</span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-800/40 border border-slate-700/30">
                  <span className="text-sm">🚀</span>
                  <span className="text-[11px] text-slate-300">Unlock Opportunities</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic leading-relaxed px-2">
                &ldquo;Success is built one task at a time.&rdquo;
              </p>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                <span className="text-[10px] text-indigo-300 font-medium">Launched 1st May 2026</span>
              </div>

              <button
                onClick={handleDismiss}
                className="w-full py-2 px-5 bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-400 hover:to-emerald-400 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 active:scale-[0.98]"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
