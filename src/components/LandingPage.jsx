import React from 'react';

export default function LandingPage({ onOpenLoginModal }) {
  // Official Govt Portal Links
  const govtPortals = [
    { name: "Staff Selection Commission (SSC)", url: "https://ssc.gov.in", desc: "Official Combined Graduate & Higher Secondary Recruitment" },
    { name: "Railway Recruitment Boards (RRB)", url: "https://indianrailways.gov.in", desc: "NTPC, Group D, ALP & Technical Cadres" },
    { name: "National Testing Agency (NTA)", url: "https://nta.ac.in", desc: "National Level Eligibility & Entrance Examinations" },
    { name: "Union Public Service Commission", url: "https://upsc.gov.in", desc: "Civil Services & Combined Defence Exams" },
    { name: "DigiLocker Govt Credentials", url: "https://www.digilocker.gov.in", desc: "National Academic Depository & Certificates Verification" }
  ];

  const examCategories = [
    { code: "SSC-CGL", name: "Combined Graduate Level", pattern: "Tier-1 (100 Qs / 60 Min)", status: "Active Mock Matrix" },
    { code: "SSC-CHSL", name: "Combined Higher Secondary", pattern: "Tier-1 (100 Qs / 60 Min)", status: "Simulation Ready" },
    { code: "RRB-NTPC", name: "Non-Technical Popular", pattern: "CBT-1 (100 Qs / 90 Min)", status: "TCS Engine Active" },
    { code: "SSC-CPO", name: "Central Police Organization", pattern: "Paper-1 (200 Qs / 120 Min)", status: "Certified Setup" }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950 font-sans">
      
      {/* 1. Continuous Running Govt Notification Bar (Train loop ticker) */}
      <div className="bg-emerald-950/80 border-b border-emerald-800/50 py-1.5 overflow-hidden whitespace-nowrap flex items-center text-xs text-emerald-300">
        <span className="bg-emerald-500 text-slate-950 px-2.5 py-0.5 font-black text-[10px] tracking-wider uppercase mx-3 rounded shadow shrink-0">
          Official Ticker
        </span>
        <div className="flex animate-marquee space-x-8 font-medium tracking-wide">
          <span>🔔 SSC CGL 2024 Tier-1 Official Response Sheet CBT Simulation Interface Activated</span>
          <span>•</span>
          <span>⚡ Exact TCS iON Exam Screen with Real Negative Marking (-0.50 / +2.00)</span>
          <span>•</span>
          <span>📑 Direct Official PDF Parser with Question-Figure Cropping Support</span>
          <span>•</span>
          <span>🛡️ Anti-Cheat Fullscreen Assessment Lockdown Protocol Standard Enforced</span>
          <span>•</span>
          <span>🔔 SSC CGL 2024 Tier-1 Official Response Sheet CBT Simulation Interface Activated</span>
          <span>•</span>
          <span>⚡ Exact TCS iON Exam Screen with Real Negative Marking (-0.50 / +2.00)</span>
        </div>
      </div>

      {/* 2. Top Header (Combined Single Login Portal) */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50 px-4 py-3 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo & Emblemed Badge */}
          <div className="flex items-center space-x-2.5 sm:space-x-3.5 select-none">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 p-[2px] shadow-lg shadow-emerald-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center overflow-hidden">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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

          {/* Unified Action Button */}
          <div>
            <button
              onClick={onOpenLoginModal}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl shadow-md shadow-emerald-500/20 active:scale-95 transition"
            >
              Portal Login / Access →
            </button>
          </div>
        </div>
      </header>

      {/* 3. Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 sm:py-12 space-y-12">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] sm:text-xs font-semibold text-slate-300">
              National Computer Based Test Lockdown Infrastructure Active
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight">
            Master The Real CBT Screen.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              Zero Exam-Hall Nervousness.
            </span>
          </h1>

          <p className="text-xs sm:text-base text-slate-400 leading-relaxed max-w-xl mx-auto">
            TCS iON exact color palette, automatic timer lockdown, AI question paper parsing, aur bilingual instant switch ke saath apni tayyari ko real exam standard par test karein.
          </p>

          <div className="pt-2">
            <button
              onClick={onOpenLoginModal}
              className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm sm:text-base px-8 py-3.5 rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition"
            >
              Enter Computer Based Mock Test Room →
            </button>
          </div>
        </div>

        {/* 4. Supported Examination Frameworks */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Supported CBT Examination Frameworks</h2>
            <span className="text-xs text-emerald-400 font-semibold">TCS Pattern 100% Certified</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {examCategories.map((exam, i) => (
              <div key={i} className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl hover:border-slate-700 transition">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{exam.code}</span>
                  <span className="text-[10px] text-slate-500">{exam.status}</span>
                </div>
                <h3 className="font-bold text-sm text-slate-200">{exam.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{exam.pattern}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Official Government Portals & Authentic Resources */}
        <div className="space-y-4 bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl">
          <div className="border-b border-slate-800 pb-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span>🏛️</span> Official Examination Portals & Government Sources
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Verified redirect gateways for candidates to check authentic answer keys, notices, and scorecards.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {govtPortals.map((portal, idx) => (
              <a
                key={idx}
                href={portal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-3 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-200 group-hover:text-emerald-400 transition">{portal.name}</span>
                    <span className="text-slate-500 group-hover:text-emerald-400 text-xs">↗</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">{portal.desc}</p>
                </div>
                <span className="text-[10px] font-mono text-slate-500 mt-2 block truncate">{portal.url}</span>
              </a>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-4 text-center text-xs text-slate-500">
        EXAMCBT &copy; 2026 • Real Computer Based Examination Simulation System • SSC & TCS iON Format Certified
      </footer>

      {/* Marquee Animation Style */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-flex;
          animation: marquee 25s linear infinite;
        }
      `}</style>
    </div>
  );
}
