import React, { useState, useEffect } from 'react';

export default function LandingPage({ onOpenLoginModal, onLaunchSandboxDemo }) {
  const [liveNews, setLiveNews] = useState([
    { tag: "GOVT EXAM", text: "SSC CGL & CHSL official answer sheets and simulation portal operational." },
    { tag: "POLICY", text: "National Examination Agency updates CBT security lockdown protocol." },
    { tag: "MARKET", text: "Indian Indices: Nifty & Sensex trade on strong institutional inflows." },
    { tag: "RECRUITMENT", text: "Railway Recruitment Boards release multi-zone assessment calendar." },
    { tag: "ECONOMY", text: "Reserve Bank of India maintains steady monetary and liquidity stance." }
  ]);

  // Point 10: Dynamic Showcase Exams managed via Director Console
  const [examCategories] = useState(() => {
    return JSON.parse(localStorage.getItem('cbt_showcase_exams') || JSON.stringify([
      { code: "SSC-CGL", name: "Combined Graduate Level", pattern: "Tier-1 (100 Qs / 60 Min)", status: "Active Mock Matrix" },
      { code: "SSC-CHSL", name: "Combined Higher Secondary", pattern: "Tier-1 (100 Qs / 60 Min)", status: "Simulation Ready" },
      { code: "RRB-NTPC", name: "Non-Technical Popular", pattern: "CBT-1 (100 Qs / 90 Min)", status: "TCS Engine Active" },
      { code: "SSC-CPO", name: "Central Police Organization", pattern: "Paper-1 (200 Qs / 120 Min)", status: "Certified Setup" }
    ]));
  });

  // Point 11: Modals for Feedback and FAQ Hub
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    feedback: ''
  });

  // Top 10 CBT Simulation Software Specific FAQs
  const cbtFaqs = [
    {
      q: "1. Exam timer khatam hone par kya mera test automatically submit ho jayega?",
      a: "Haan. TCS iON standard lockdown protocol ke tahat, jaise hi reverse countdown timer '00:00' par pahunchta hai, system automatically aapke mark kiye gaye answers ko lock karke cloud server par final submit kar deta hai."
    },
    {
      q: "2. Exam hall interface me Hindi aur English language ke beech switch kaise karein?",
      a: "Question interface ke top right header par 'View in' dropdown diya gaya hai. Aap kisi bhi individual question ko attempt karte waqt bina timer pause kiye Hindi ya English me instantly switch kar sakte hain."
    },
    {
      q: "3. Question Palette ke alag-alag color codes ka kya matlab hota hai?",
      a: "Green: Answered, Red: Not Answered, Grey: Not Visited, Violet/Purple: Marked for Review, Violet with Green dot: Answered and Marked for Review (TCS iON evaluation me evaluate hota hai)."
    },
    {
      q: "4. Kya unregistered user bhi demo/trial test launch kar sakta hai?",
      a: "Bilkul! Landing page par 'Instant Sandbox Demo Frameworks' section me se kisi bhi test card par click karke aap bina login/signup kiye turant trial exam experience kar sakte hain."
    },
    {
      q: "5. Agar question me reasoning figure, Venn diagram ya diagram load na ho toh kya karein?",
      a: "Hamara PyMuPDF engine original official answer keys se diagrams auto-extract karta hai. Agar diagram blur lage toh browser zoom 100% par rakhein aur screen refresh karein (session save rehta hai)."
    },
    {
      q: "6. Negative marking calculation kaise calculate hoti hai?",
      a: "SSC CGL / CHSL standard norms ke anusaar, har sahi answer par +2 marks aur galat attempt par -0.50 marks evaluate hote hain. Unattempted questions ke liye 0 marks deduct hote hain."
    },
    {
      q: "7. Test submit hone ke baad detailed scorecard aur analysis kahan milega?",
      a: "Test submit hote hi 'Exam Result Analytics' dashboard khulta hai jisme aapka Total Score, Accuracy percentage, Section-wise breakdown, aur Har Question ka correct vs chosen option explain hota hai."
    },
    {
      q: "8. Browser refresh ya accidental tab close hone par kya mera test progress loss ho jayega?",
      a: "Nahi. Hamara CBT interface state-persistence mechanism use karta hai. Same browser tab par re-enter karte hi aapka remaining time aur previously saved responses restore ho jate hain."
    },
    {
      q: "9. Candidate login ID aur Password kya hota hai?",
      a: "Student registration ke waqt system candidate ko unique 'CBT Roll ID' generate karke deta hai. Wahi Roll ID aur aapka set kiya gaya password login ke liye valid hota hai."
    },
    {
      q: "10. Agar meri problem yahan solve na ho ya technical glitch report karna ho toh?",
      a: "Aap niche diye gaye 'Suggestion & Feedback Form' par click karke apni query submit kar sakte hain ya 'support@examcbt.gov.in' par direct mail bhej sakte hain."
    }
  ];

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    if (!feedbackForm.fullName || !feedbackForm.email || !feedbackForm.phone || !feedbackForm.feedback) {
      alert("Kripya saare mandatory fields bharein!");
      return;
    }

    // Save feedback locally / ready for backend sync
    const existing = JSON.parse(localStorage.getItem('cbt_user_feedbacks') || '[]');
    const newEntry = {
      id: `fb-${Date.now()}`,
      ...feedbackForm,
      submittedAt: new Date().toLocaleString('en-IN')
    };
    existing.unshift(newEntry);
    localStorage.setItem('cbt_user_feedbacks', JSON.stringify(existing));

    setFeedbackSuccess(true);
    setTimeout(() => {
      setFeedbackSuccess(false);
      setIsFeedbackOpen(false);
      setFeedbackForm({ fullName: '', email: '', phone: '', feedback: '' });
    }, 2500);
  };

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

        {/* Dynamic Sandbox Demo Exam Showcase */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300">Instant Sandbox Demo Examination Frameworks</h2>
            <span className="text-xs text-teal-400 font-semibold">⚡ Click any card to launch sandbox mode (No Login Required)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {examCategories.map((exam, i) => (
              <div 
                key={i} 
                onClick={() => onLaunchSandboxDemo(exam)}
                className="bg-slate-900/80 border border-slate-800 hover:border-teal-500 p-4 rounded-2xl cursor-pointer transition transform hover:-translate-y-1 shadow-lg group"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-xs font-black text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">{exam.code}</span>
                  <span className="text-[10px] text-teal-400 font-bold group-hover:underline">Launch Demo →</span>
                </div>
                <h3 className="font-bold text-sm text-slate-200 group-hover:text-white transition">{exam.name}</h3>
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

      {/* Point 11: Government Standard Visitor Support & Footer Enhancements */}
      <footer className="border-t border-slate-800 bg-slate-950/90 pt-8 pb-6 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Functional Support Modules Bar (Immediate above copyright line) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6 border-b border-slate-900">
            
            {/* 1. Suggestion & Feedback Trigger */}
            <div 
              onClick={() => setIsFeedbackOpen(true)}
              className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-2xl cursor-pointer transition flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg group-hover:scale-110 transition">
                📝
              </div>
              <div>
                <h4 className="text-xs font-black text-white group-hover:text-emerald-400 transition">Candidate Feedback & Grievance</h4>
                <p className="text-[11px] text-slate-400">Share suggestions or report simulation discrepancies</p>
              </div>
            </div>

            {/* 2. FAQ & Knowledge Base Hub Trigger */}
            <div 
              onClick={() => setIsFaqOpen(true)}
              className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 p-4 rounded-2xl cursor-pointer transition flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-lg group-hover:scale-110 transition">
                ❓
              </div>
              <div>
                <h4 className="text-xs font-black text-white group-hover:text-amber-400 transition">Frequently Asked Questions (FAQ)</h4>
                <p className="text-[11px] text-slate-400">Top 10 software issues, timer, & evaluation guides</p>
              </div>
            </div>

            {/* 3. Direct Support Channels (Email & Hotline) */}
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-lg shrink-0">
                ✉️
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Official Helpdesk</span>
                <a 
                  href="mailto:support@examcbt.gov.in" 
                  className="text-xs font-bold text-blue-400 hover:underline truncate block"
                >
                  support@examcbt.gov.in
                </a>
                <span className="text-[10px] text-slate-500 block">Mon - Sat (09:30 AM - 06:00 PM IST)</span>
              </div>
            </div>

          </div>

          {/* Exact Retained Copyright Notice */}
          <div className="text-center text-xs text-slate-500 font-medium">
            EXAMCBT &copy; 2026 • Real Computer Based Examination Simulation System • SSC & TCS iON Format Certified
          </div>
        </div>
      </footer>

      {/* ================= MODAL 1: SUGGESTION & FEEDBACK FORM ================= */}
      {isFeedbackOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button 
              onClick={() => setIsFeedbackOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center"
            >
              ✕
            </button>

            <div className="mb-5">
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full uppercase">
                Public Grievance & Feedback Portal
              </span>
              <h3 className="text-lg font-black text-white mt-2">Candidate Suggestion / Grievance Form</h3>
              <p className="text-xs text-slate-400 mt-1">Submit feedback or report CBT technical issues to the evaluation directorate.</p>
            </div>

            {feedbackSuccess ? (
              <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-2">
                <div className="text-3xl">✓</div>
                <h4 className="text-sm font-black text-emerald-400">Feedback Submitted Successfully!</h4>
                <p className="text-xs text-slate-400">Your grievance reference ID has been recorded by the Directorate Support desk.</p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Full Name *</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={feedbackForm.fullName}
                    onChange={(e) => setFeedbackForm({...feedbackForm, fullName: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Email Address *</label>
                  <input 
                    type="email"
                    required
                    placeholder="e.g. candidate@example.com"
                    value={feedbackForm.email}
                    onChange={(e) => setFeedbackForm({...feedbackForm, email: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Phone Number *</label>
                  <input 
                    type="tel"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={feedbackForm.phone}
                    onChange={(e) => setFeedbackForm({...feedbackForm, phone: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Feedback / Grievance Message *</label>
                  <textarea 
                    rows={4}
                    required
                    placeholder="Please provide details of the suggestion, software experience, or question issue..."
                    value={feedbackForm.feedback}
                    onChange={(e) => setFeedbackForm({...feedbackForm, feedback: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/20 active:scale-95"
                >
                  Submit Official Feedback →
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL 2: STANDALONE FAQ & KNOWLEDGE BASE HUB ================= */}
      {isFaqOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-3xl w-full max-h-[85vh] rounded-3xl p-6 shadow-2xl flex flex-col relative animate-in fade-in zoom-in-95 duration-150">
            <button 
              onClick={() => setIsFaqOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center"
            >
              ✕
            </button>

            <div className="border-b border-slate-800 pb-4 mb-4">
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full uppercase">
                Knowledge Base & Candidate Helpdesk
              </span>
              <h3 className="text-xl font-black text-white mt-2">CBT Examination System FAQ & Troubleshooting</h3>
              <p className="text-xs text-slate-400 mt-1">Frequently faced software questions, test protocols, and step-by-step solutions.</p>
            </div>

            {/* 10 FAQs List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 select-text">
              {cbtFaqs.map((faq, idx) => (
                <div key={idx} className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl space-y-1.5 hover:border-slate-700 transition">
                  <h4 className="text-xs font-bold text-amber-300 flex items-start gap-2">
                    <span>•</span>
                    <span>{faq.q}</span>
                  </h4>
                  <p className="text-[11px] text-slate-300 pl-4 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>

            {/* FAQ Footer CTA for other issues */}
            <div className="pt-4 mt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-400">Did not find what you were looking for?</span>
              <button 
                onClick={() => {
                  setIsFaqOpen(false);
                  setIsFeedbackOpen(true);
                }}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition active:scale-95 shrink-0"
              >
                Open Candidate Support Form →
              </button>
            </div>
          </div>
        </div>
      )}

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
