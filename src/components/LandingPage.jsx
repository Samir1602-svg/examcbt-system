import React, { useState, useEffect } from 'react';

export default function LandingPage({ onOpenLoginModal }) {
  const [liveNews, setLiveNews] = useState([
    { tag: "GOVT EXAM", text: "SSC CGL & CHSL official answer sheets and simulation portal operational." },
    { tag: "POLICY", text: "National Examination Agency updates CBT security lockdown protocol." },
    { tag: "MARKET", text: "Indian Indices: Nifty & Sensex trade on strong institutional inflows." },
    { tag: "RECRUITMENT", text: "Railway Recruitment Boards release multi-zone assessment calendar." },
    { tag: "ECONOMY", text: "Reserve Bank of India maintains steady monetary and liquidity stance." }
  ]);

  // Hourly Live Feed Fetcher (Govt Exams, Policies, Stock Market)
  useEffect(() => {
    const fetchLiveIndianUpdates = async () => {
      try {
        const query = encodeURIComponent('SSC CGL exam OR Indian govt policy OR Nifty Sensex stock market');
        const rssFeed = `https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`;
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssFeed)}`);
        const data = await res.json();

        if (data.status === 'ok' && data.items && data.items.length > 0) {
          const formatted = data.items.slice(0, 8).map((item) => {
            const title = item.title.replace(/ - .*$/, "");
            let tag = "POLICY";
            const lower = title.toLowerCase();
            if (lower.includes("exam") || lower.includes("ssc") || lower.includes("rrb") || lower.includes("nta") || lower.includes("admit")) {
              tag = "GOVT EXAM";
            } else if (lower.includes("nifty") || lower.includes("sensex") || lower.includes("market") || lower.includes("shares") || lower.includes("stock")) {
              tag = "MARKET";
            }
            return { tag, text: title };
          });
          setLiveNews(formatted);
        }
      } catch (err) {
        console.warn("Real-time feed fallback active:", err);
      }
    };

    fetchLiveIndianUpdates();
    // Har 1 ghante (3600000 ms) me live update fetch karega
    const interval = setInterval(fetchLiveIndianUpdates, 3600000);
    return () => clearInterval(interval);
  }, []);

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
      
      {/* 1. Real-Time Hourly Indian Ticker */}
      <div className="bg-slate-900 border-b border-slate-800/80 h-9 overflow-hidden flex items-center relative text-xs z-30">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 text-slate-950 font-black px-3.5 h-full flex items-center gap-1.5 z-20 shrink-0 shadow-md">
          <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping"></span>
          <span className="tracking-wider text-[10px] sm:text-[11px] uppercase font-mono">LIVE BULLETIN</span>
        </div>
        
        <div className="ticker-wrap flex-1 overflow-hidden whitespace-nowrap">
          <div className="ticker-move inline-flex items-center space-x-10 text-slate-300 font-medium text-[11px] sm:text-xs">
            {liveNews.concat(liveNews).map((item, idx) => (
              <span key={idx} className="inline-flex items-center space-x-2">
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider ${
                  item.tag === 'GOVT EXAM' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  item.tag === 'MARKET' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                }`}>
                  {item.tag}
                </span>
                <span className="text-slate-200">{item.text}</span>
                <span className="text-slate-600 select-none">•</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 select-none">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 p-[2px] shadow-lg shadow-emerald-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" fillOpacity="0.2" />
                  <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-lg sm:text-xl tracking-tight text-white">
                  EXAM<span className="text-emerald-400">CBT</span>
                </span>
                <span className="text-[9px] uppercase font-black tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-md">
                  Govt Certified
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">National Assessment Simulation</p>
            </div>
          </div>

          <button
            onClick={onOpenLoginModal}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl shadow-md shadow-emerald-500/20 active:scale-95 transition"
          >
            Portal Login / Access →
          </button>
        </div>
      </header>

      {/* 3. Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-10 sm:py-16 space-y-12">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-slate-900 border border-slate-800 px-4 py-1.5 rounded-full shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-semibold text-slate-300">
              National Examination Hall Lockdown Interface Active
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

        {/* Supported Exams Matrix */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300">Supported CBT Examination Frameworks</h2>
            <span className="text-xs text-emerald-400 font-semibold">TCS Pattern 100% Certified</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {examCategories.map((exam, i) => (
              <div key={i} className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl hover:border-slate-700 transition">
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

        {/* Govt Sources */}
        <div className="space-y-4 bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl">
          <div className="border-b border-slate-800 pb-2">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span>🏛️</span> Official Examination Portals & Government Gateways
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Verified redirect gateways for authentic answer keys, notices, and scorecards.</p>
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

      <footer className="border-t border-slate-800/80 py-4 px-4 text-center text-xs text-slate-500">
        EXAMCBT &copy; 2026 • Real Computer Based Examination Simulation System • SSC & TCS iON Format Certified
      </footer>

      {/* Ticker Animation */}
      <style>{`
        .ticker-wrap {
          mask-image: linear-gradient(to right, transparent, black 4%, black 96%, transparent);
        }
        .ticker-move {
          display: inline-flex;
          animation: tickerLoop 35s linear infinite;
        }
        .ticker-move:hover {
          animation-play-state: paused;
        }
        @keyframes tickerLoop {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
