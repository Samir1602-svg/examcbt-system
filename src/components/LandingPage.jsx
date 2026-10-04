import React from 'react';

export default function LandingPage({ onEnterDashboard, onOpenAdmin }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950 font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-4 py-3 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Authentic CBT Shield Emblemed Brand Logo */}
          <div className="flex items-center space-x-2.5 sm:space-x-3.5 select-none">
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 p-[2px] shadow-lg shadow-emerald-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center overflow-hidden">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" fillOpacity="0.2" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="font-black text-base sm:text-xl tracking-tight text-white">
                  EXAM<span className="text-emerald-400">CBT</span>
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-md">
                  Govt Certified
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium tracking-wide">
                National Assessment Simulation
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={onOpenAdmin}
              className="text-slate-400 hover:text-slate-200 text-xs font-semibold px-2.5 py-2 transition hidden sm:inline-block"
            >
              Admin Portal
            </button>
            <button
              onClick={onEnterDashboard}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm px-4 py-2 sm:px-5 sm:py-2 rounded-xl shadow-md shadow-emerald-500/10 active:scale-95 transition"
            >
              Candidate Login →
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:py-16">
        <div className="max-w-3xl mx-auto text-center space-y-6 sm:space-y-8">
          <div className="inline-flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] sm:text-xs font-semibold text-slate-300">
              National Examination Hall Lockdown Interface Active
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight sm:leading-none">
            Master The Real CBT Screen.<br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              Zero Exam-Hall Nervousness.
            </span>
          </h1>

          <p className="text-xs sm:text-base text-slate-400 leading-relaxed max-w-xl mx-auto px-2">
            TCS iON exact color palette, automatic timer lockdown, AI question paper parsing, aur bilingual instant switch ke saath apni tayyari ko real exam standard par test karein.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4 sm:px-0">
            <button
              onClick={onEnterDashboard}
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm sm:text-base px-8 py-3.5 rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition"
            >
              Enter Student Mock Test Room →
            </button>
            <button
              onClick={onOpenAdmin}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs sm:text-sm px-6 py-3.5 rounded-2xl transition"
            >
              Admin & Faculty Portal
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-4 text-center text-[11px] text-slate-500">
        EXAMCBT &copy; 2026 • SSC CGL & TCS iON Pattern Certified Simulation
      </footer>
    </div>
  );
}
