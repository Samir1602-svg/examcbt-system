import React, { useState, useEffect } from 'react';

const API_BASE_URL = (process.env.REACT_APP_API_URL || '[https://examcbt-backend.onrender.com](https://examcbt-backend.onrender.com)').replace(/\/$/, "");

export default function NewsTicker() {
  const [examUpdates, setExamUpdates] = useState([
    { text: "SSC CGL 2026 Tier-I Notification & Exam Date Schedule Announced", link: "[https://ssc.gov.in](https://ssc.gov.in)" },
    { text: "NTA Annual Examination Calendar & Directorate Circular Released", link: "[https://nta.ac.in](https://nta.ac.in)" },
    { text: "Railway RRB NTPC Computer Based Test City Intimation Live", link: "[https://indianrailways.gov.in](https://indianrailways.gov.in)" }
  ]);

  const [circularUpdates, setCircularUpdates] = useState([]);
  const [isPaused1, setIsPaused1] = useState(false);
  const [isPaused2, setIsPaused2] = useState(false);

  useEffect(() => {
    // 1. Fetch live automated updates
    const fetchUpdates = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/live-exam-updates`);
        const data = await response.json();
        if (data.status === 'success' && data.updates?.length > 0) {
          setExamUpdates(data.updates.slice(0, 3));
        }
      } catch (err) {
        console.warn("Using default official updates fallback");
      }
    };
    fetchUpdates();

    // 2. Fetch Directorate Published Circulars from localStorage / sync
    const loadedCirculars = JSON.parse(localStorage.getItem('cbt_directorate_circulars') || '[]');
    setCircularUpdates(loadedCirculars);
  }, []);

  return (
    <div className="w-full flex flex-col border-b border-amber-500/40 shadow-xl select-none bg-slate-950">
      
      {/* Point 9: Dynamic Official Notifications & Directorate Circulars Block (Hides completely if 0 circulars) */}
      {circularUpdates.length > 0 && (
        <div className="bg-[#1e1103] border-b border-amber-500/30 text-amber-200 text-xs flex items-center h-10 overflow-hidden cursor-pointer shadow-inner">
          <div className="bg-amber-500 text-slate-950 font-black px-4 py-2 uppercase tracking-widest text-[10px] shrink-0 z-10 flex items-center gap-2 shadow">
            <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping"></span> DIRECTORATE CIRCULAR
          </div>
          <div className="flex whitespace-nowrap overflow-hidden w-full relative">
            <div className="flex gap-12 font-medium tracking-wide items-center animate-marquee">
              {circularUpdates.map((circ) => (
                <div key={circ.id} className="inline-flex items-center gap-2 px-3 py-1 bg-amber-950/40 border border-amber-500/30 rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span className="text-amber-200 font-bold">{circ.title}</span>
                  <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-300 font-mono">PDF Notice 📄</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Ticker Row 1: LATEST NOTIFICATIONS */}
      <div 
        className="bg-[#081b2d] text-slate-100 text-xs flex items-center h-10 overflow-hidden cursor-pointer border-b border-slate-800"
        onClick={() => setIsPaused1(!isPaused1)}
        title={isPaused1 ? "Ticker paused. Click to resume." : "Click anywhere to pause."}
      >
        <div className="bg-red-600 text-white font-black px-4 py-2 uppercase tracking-widest text-[10px] shrink-0 z-10 flex items-center gap-2 shadow-md">
          <span className="w-2 h-2 rounded-full bg-white animate-ping"></span> LATEST NOTIFICATIONS
        </div>
        <div className="flex whitespace-nowrap overflow-hidden w-full relative">
          <div className={`flex gap-12 font-medium tracking-wide items-center ${isPaused1 ? 'animate-none text-amber-300' : 'animate-marquee'}`}>
            {examUpdates.map((item, idx) => (
              <a 
                key={idx} 
                href={item.link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="group inline-flex items-center gap-2 px-3 py-1 bg-slate-900/80 border border-slate-800 rounded-lg hover:border-amber-500/50 hover:bg-slate-800 transition"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span className="group-hover:text-amber-300 transition">{item.text}</span>
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 group-hover:text-white font-mono">Official ↗</span>
              </a>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
