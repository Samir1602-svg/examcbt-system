import React, { useState, useEffect } from 'react';

export default function LandingPage({ onOpenLoginModal, onLaunchSandboxDemo }) {
  const [liveNews, setLiveNews] = useState([
    { tag: "GOVT EXAM", text: "Staff Selection Commission releases official CBT simulation advisory." },
    { tag: "POLICY", text: "National Examination Directorate updates digital examination hall lockdown protocols." },
    { tag: "RECRUITMENT", text: "Railway Recruitment Boards issue computerized testing schedules." },
    { tag: "DIRECTORATE", text: "Candidate grievance escalation desk operational for Tier-1 assessment." }
  ]);

  const [examCategories] = useState(() => {
    const defaultList = [
      { code: "SSC-CGL", name: "Combined Graduate Level", pattern: "Tier-1 (100 Qs / 60 Min)", status: "Active Mock Matrix" },
      { code: "SSC-CHSL", name: "Combined Higher Secondary", pattern: "Tier-1 (100 Qs / 60 Min)", status: "Simulation Ready" },
      { code: "RRB-NTPC", name: "Non-Technical Popular", pattern: "CBT-1 (100 Qs / 60 Min)", status: "TCS Engine Active" },
      { code: "SSC-CPO", name: "Central Police Organization", pattern: "Paper-1 (100 Qs / 60 Min)", status: "Certified Setup" }
    ];

    const raw = localStorage.getItem('cbt_showcase_exams');
    if (!raw) return defaultList;
    try {
      const parsed = JSON.parse(raw);
      return parsed.map(item => ({
        ...item,
        pattern: item.pattern
          ? item.pattern
              .replace(/90\s*Min/gi, "60 Min")
              .replace(/120\s*Min/gi, "60 Min")
              .replace(/200\s*Qs/gi, "100 Qs")
          : "Tier-1 (100 Qs / 60 Min)"
      }));
    } catch {
      return defaultList;
    }
  });

  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    feedback: ''
  });

  const cbtFaqs = [
    {
      q: "1. Will my examination submit automatically once the countdown timer reaches zero?",
      a: "Yes. Under standard computerized examination protocols, when the remaining test time reaches 00:00, the lockdown engine automatically freezes all input fields, locks your responses, and submits the test paper to the evaluation server."
    },
    {
      q: "2. How can I toggle between English and Hindi during an active examination session?",
      a: "Candidates can switch question presentation dynamically using the 'View in' language selector located on the top navigation panel of each question without interrupting the countdown timer."
    },
    {
      q: "3. What is the official interpretation of Question Palette color codes?",
      a: "Green indicates Answered; Red indicates Not Answered; Grey indicates Not Visited; Purple indicates Marked for Review; and Purple with a green dot indicates Answered & Marked for Review (which is evaluated in the final merit score calculation)."
    },
    {
      q: "4. Can unregistered candidates access sandbox demo and trial examinations?",
      a: "Yes. Candidates may launch public demo test simulations directly from the 'Instant Sandbox Demo Examination Frameworks' section without mandatory registration or authentication."
    },
    {
      q: "5. What steps should be taken if mathematical formulas or reasoning figures do not render?",
      a: "The platform dynamically extracts graphical assets from official keys. Ensure your display scaling is set to 100% and refresh your browser session. All previously selected answers are securely retained."
    },
    {
      q: "6. How is negative marking evaluated across mock papers?",
      a: "Marks are calculated strictly under authorized SSC/TCS norms: +2.0 marks are awarded for every correct answer, -0.50 marks are deducted for every incorrect submission, and zero marks are given for unattempted questions."
    },
    {
      q: "7. Where can candidates inspect the post-examination performance breakdown?",
      a: "Upon completing an assessment, candidates are redirected to the 'Exam Result Analytics' console, displaying final aggregate scores, percentile ratings, topic-wise accuracy, and detailed question-by-question comparative answers."
    },
    {
      q: "8. Is test progress preserved during accidental tab closure or browser crash?",
      a: "Yes. The examination interface maintains local session resilience. Relaunching the platform restores the test at the exact question state with the remaining allocated time."
    },
    {
      q: "9. What credentials are required to authenticate into the candidate portal?",
      a: "Candidates must provide their system-generated CBT Roll Identification Number and authorization password registered during initial profile onboarding."
    },
    {
      q: "10. What is the Turnaround Time (TAT) for grievance resolution and support desk responses?",
      a: "All support tickets, public grievances, and technical discrepancy inquiries are reviewed by the evaluation helpdesk with an official Turnaround Time (TAT) of within 48 hours."
    },
    {
      q: "11. How can candidates escalate unaddressed technical defects or evaluation queries?",
      a: "Candidates can submit formal inquiries via the 'Candidate Grievance & Feedback Form' on this portal or send a direct communication to the central desk at info.cbtexam@gmail.com."
    }
  ];

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    if (!feedbackForm.fullName || !feedbackForm.email || !feedbackForm.phone || !feedbackForm.feedback) {
      alert("Please complete all required fields before submission.");
      return;
    }

    const existing = JSON.parse(localStorage.getItem('cbt_user_feedbacks') || '[]');
    const newEntry = {
      id: `fb-${Date.now()}`,
      ...feedbackForm,
      submittedAt: new Date().toISOString()
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
        const query = encodeURIComponent('SSC CGL exam OR UPSC recruitment OR government examination schedule');
        const rssFeed = `https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`;
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssFeed)}`);
        const data = await res.json();

        if (data.status === 'ok' && data.items && data.items.length > 0) {
          const formatted = data.items.slice(0, 8).map((item) => {
            const title = item.title.replace(/ - .*$/, "");
            let tag = "OFFICIAL NOTICE";
            const lower = title.toLowerCase();
            if (lower.includes("exam") || lower.includes("ssc") || lower.includes("upsc") || lower.includes("rrb")) {
              tag = "EXAM NOTIFICATION";
            }
            return { tag, text: title };
          });
          setLiveNews(formatted);
        }
      } catch (err) {
        console.warn("Using offline notice fallback:", err);
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
    { name: "Union Public Service Commission", url: "https://upsc.gov.in", desc: "Civil Services & Combined Defence Examinations" },
    { name: "DigiLocker National Credentials", url: "https://www.digilocker.gov.in", desc: "National Academic Depository & Credential Verification" }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950 font-sans">
      
      {/* 1. Real-Time Official Bulletin */}
      <div className="bg-slate-900 border-b border-slate-800/80 h-9 overflow-hidden flex items-center relative text-xs z-30">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 text-slate-950 font-black px-3.5 h-full flex items-center gap-1.5 z-20 shrink-0 shadow-md">
          <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping"></span>
          <span className="tracking-wider text-[10px] sm:text-[11px] uppercase font-mono">OFFICIAL BULLETIN</span>
        </div>
        
        <div className="ticker-wrap flex-1 overflow-hidden whitespace-nowrap">
          <div className="ticker-move inline-flex items-center space-x-10 text-slate-300 font-medium text-[11px] sm:text-xs">
            {liveNews.concat(liveNews).map((item, idx) => (
              <span key={idx} className="inline-flex items-center space-x-2">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
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
                  Certified Environment
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">National Assessment Simulation Portal</p>
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
              National Computer-Based Testing Security Protocol Active
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight">
            Standardized Examination Simulation.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              Zero Exam-Hall Nervousness.
            </span>
          </h1>

          <p className="text-xs sm:text-base text-slate-400 leading-relaxed max-w-xl mx-auto">
            Experience authorized TCS iON screen ergonomics, reverse timer lockdown, synchronized bilingual question rendering, and authentic evaluation marking schemes.
          </p>

          <div className="pt-2">
            <button
              onClick={onOpenLoginModal}
              className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm sm:text-base px-8 py-3.5 rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition"
            >
              Enter Computer-Based Assessment Hall →
            </button>
          </div>
        </div>

        {/* Dynamic Sandbox Demo Exam Showcase (Now all set to 100 Qs / 60 Min) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300">Instant Sandbox Demo Examination Frameworks</h2>
            <span className="text-xs text-teal-400 font-semibold">⚡ Launch Immediate Trial Examination (No Sign-in Required)</span>
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
            <p className="text-xs text-slate-500 mt-0.5">Verified redirect gateways for authentic recruitment notices, answer keys, and scorecards.</p>
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

      {/* Official Visitor Support & Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/90 pt-8 pb-6 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6 border-b border-slate-900">
            <div 
              onClick={() => setIsFeedbackOpen(true)}
              className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-2xl cursor-pointer transition flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg group-hover:scale-110 transition">
                📝
              </div>
              <div>
                <h4 className="text-xs font-black text-white group-hover:text-emerald-400 transition">Candidate Grievance & Feedback</h4>
                <p className="text-[11px] text-slate-400">Submit evaluation feedback or technical discrepancies</p>
              </div>
            </div>

            <div 
              onClick={() => setIsFaqOpen(true)}
              className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 p-4 rounded-2xl cursor-pointer transition flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-lg group-hover:scale-110 transition">
                ❓
              </div>
              <div>
                <h4 className="text-xs font-black text-white group-hover:text-amber-400 transition">Knowledge Base & FAQ Desk</h4>
                <p className="text-[11px] text-slate-400">Technical specifications, test protocols, & turnaround times</p>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-lg shrink-0">
                ✉️
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Central Directorate Helpdesk</span>
                <a 
                  href="mailto:info.cbtexam@gmail.com" 
                  className="text-xs font-bold text-blue-400 hover:underline truncate block"
                >
                  info.cbtexam@gmail.com
                </a>
                <span className="text-[10px] text-emerald-400 font-semibold block">Official Support TAT: Within 48 Hours</span>
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-slate-500 font-medium">
            EXAMCBT &copy; 2026 • Real Computer Based Examination Simulation System • SSC & TCS iON Format Certified
          </div>
        </div>
      </footer>

      {/* MODAL 1: GRIEVANCE & FEEDBACK FORM */}
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
                Directorate Helpdesk & Grievance Cell
              </span>
              <h3 className="text-lg font-black text-white mt-2">Candidate Grievance & Feedback Form</h3>
              <p className="text-xs text-slate-400 mt-1">Submit feedback or report CBT technical issues to the evaluation directorate.</p>
            </div>

            {feedbackSuccess ? (
              <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-2">
                <div className="text-3xl text-emerald-400">✓</div>
                <h4 className="text-sm font-black text-emerald-400">Grievance Registered Successfully</h4>
                <p className="text-xs text-slate-400">Your query has been logged. Our helpdesk team will review and respond within 48 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Full Name *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Enter Candidate Full Name"
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
                    placeholder="candidate@example.com"
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
                    placeholder="+91 98765 43210"
                    value={feedbackForm.phone}
                    onChange={(e) => setFeedbackForm({...feedbackForm, phone: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Grievance / Feedback Statement *</label>
                  <textarea 
                    rows={4}
                    required
                    placeholder="Provide details regarding the software observation or evaluation inquiry..."
                    value={feedbackForm.feedback}
                    onChange={(e) => setFeedbackForm({...feedbackForm, feedback: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/20 active:scale-95"
                >
                  Submit Official Grievance →
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: STANDALONE OFFICIAL FAQ HUB */}
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
                Candidate Knowledge Base & Technical Advisory
              </span>
              <h3 className="text-xl font-black text-white mt-2">CBT Examination System FAQ & Troubleshooting</h3>
              <p className="text-xs text-slate-400 mt-1">Official guidelines, platform specifications, and operational resolutions.</p>
            </div>

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

            <div className="pt-4 mt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-400">Require personalized escalation? Official TAT: within 48 hours.</span>
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
