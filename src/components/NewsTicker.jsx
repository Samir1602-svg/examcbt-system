import React, { useState, useEffect } from 'react';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'https://examcbt-backend.onrender.com').replace(/\/$/, "");

export default function NewsTicker() {
  const [examUpdates, setExamUpdates] = useState([
    { text: "SSC CGL 2026 Tier-I Notification & Exam Date Schedule Announced", link: "https://ssc.gov.in" },
    { text: "NTA Annual Examination Calendar & Directorate Circular Released", link: "https://nta.ac.in" },
    { text: "Railway RRB NTPC Computer Based Test City Intimation Live", link: "https://indianrailways.gov.in" }
  ]);

  const [circularUpdates, setCircularUpdates] = useState([
    { text: "UPSC Civil Services Preliminary Examination Official Policy Notification", link: "https://upsc.gov.in" },
    { text: "Banking IBPS PO Mains Examination Scorecard & Cutoff Marks Live", link: "https://ibps.in" },
    { text: "Ministry of Education - National Educational Policy Guidelines Update", link: "https://www.education.gov.in" }
  ]);

  const [isPaused1, setIsPaused1] = useState(false);
  const [isPaused2, setIsPaused2] = useState(false);

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/live-exam-updates`);
        const data = await response.json();
        if (data.status === 'success' && data.updates?.length > 0) {
          setExamUpdates(data.updates.slice(0, 3));
          setCircularUpdates(data.updates.slice(3, 6));
        }
      } catch (err) {
        console.warn("Using default official updates fallback");
      }
    };
    fetchUpdates();
  }, []);

  return (
    <div className="w-full flex flex-col border-b border-amber-500/40 shadow-xl select-none bg-slate-950">
      
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

      {/* Ticker Row 2: EXAM CIRCULARS */}
      <div 
        className="bg-[#051322] text-slate-100 text-xs flex items-center h-10 overflow-hidden cursor-pointer"
        onClick={() => setIsPaused2(!isPaused2)}
        title={isPaused2 ? "Ticker paused. Click to resume." : "Click anywhere to pause."}
      >
        <div className="bg-amber-600 text-slate-950 font-black px-4 py-2 uppercase tracking-widest text-[10px] shrink-0 z-10 flex items-center gap-2 shadow-md">
          <span className="w-2 h-2 rounded-full bg-slate-950 animate-pulse"></span> EXAM CIRCULARS
        </div>
        <div className="flex whitespace-nowrap overflow-hidden w-full relative">
          <div className={`flex gap-12 font-medium tracking-wide items-center ${isPaused2 ? 'animate-none text-amber-300' : 'animate-marquee'}`}>
            {circularUpdates.map((item, idx) => (
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
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 group-hover:text-white font-mono">Portal ↗</span>
              </a>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
