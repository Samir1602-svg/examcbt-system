import React, { useState, useEffect } from 'react';

const motivationalBgs = [
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1920&q=80'
];

export default function LandingPage({ onEnterDashboard, onOpenAdmin }) {
  const [currentBg, setCurrentBg] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % motivationalBgs.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between text-white font-sans overflow-x-hidden bg-slate-950">
      {/* Background Image Carousel with Smooth Fade */}
      <div
        className="fixed inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out -z-10 brightness-[0.25] scale-105"
        style={{ backgroundImage: `url(${motivationalBgs[currentBg]})` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/60 to-slate-950 -z-10 pointer-events-none" />

      {/* Official Govt-Grade Header */}
      <header className="w-full border-b border-white/10 backdrop-blur-md sticky top-0 z-30 bg-slate-950/80 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg">
            CBT
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-black tracking-wider text-white">EXAMCBT</span>
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase">
                Govt Pattern Standard
              </span>
            </div>
            <p className="text-[11px] text-slate-400">National Computer Based Assessment Simulation</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={onEnterDashboard}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition active:scale-95"
          >
            Candidate Portal Login
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-16 text-center space-y-8 z-10">
        <div className="inline-flex items-center space-x-2 bg-slate-900/80 border border-slate-700/80 px-4 py-1.5 rounded-full text-xs font-semibold text-slate-300 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Real Examination Hall Lockdown Interface Active</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
          Master The Real CBT Screen.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
            Zero Exam-Hall Nervousness.
          </span>
        </h1>

        <p className="text-slate-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          TCS iON exact color palette, automatic timer lockdown, AI question paper parsing, aur bilingual instant switch ke saath apni tayyari ko real exam standard par test karein.
        </p>

        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <button
            onClick={onEnterDashboard}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black px-8 py-4 rounded-2xl text-sm shadow-xl shadow-emerald-500/20 transition transform hover:-translate-y-0.5 active:scale-95"
          >
            Enter Student Mock Test Room →
          </button>
        </div>

        {/* Feature Badges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 text-left">
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl backdrop-blur-md space-y-2">
            <div className="text-2xl">🖥️</div>
            <h3 className="font-bold text-base text-slate-100">Exact TCS iON UI Clone</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Green, Red, Purple aur Grey question palette color standard jo central exams me use hota hai.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl backdrop-blur-md space-y-2">
            <div className="text-2xl">🔒</div>
            <h3 className="font-bold text-base text-slate-100">Anti-Cheat Screen Lock</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Full-screen auto freeze environment jo tab-switch karne par warnings ke saath auto-freeze kar deta hai.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl backdrop-blur-md space-y-2">
            <div className="text-2xl">⚡</div>
            <h3 className="font-bold text-base text-slate-100">AI Weakness Diagnostics</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sirf score nahi, question-by-question time tracking aur topic weakness report automatic revision vault ke saath.
            </p>
          </div>
        </div>
      </main>

      {/* Official Footnote & Hidden Admin Key */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/90 py-6 px-6 text-center text-xs text-slate-500 flex flex-wrap justify-between items-center max-w-6xl mx-auto gap-4">
        <div>© 2026 EXAMCBT Portal. Verified Computer-Based Testing Simulation.</div>
        <div className="flex items-center space-x-4">
          <span>Security Protocol v4.2</span>
          <button
            onClick={onOpenAdmin}
            className="text-[11px] text-slate-600 hover:text-amber-400 transition"
          >
            Admin Sign-in
          </button>
        </div>
      </footer>
    </div>
  );
}