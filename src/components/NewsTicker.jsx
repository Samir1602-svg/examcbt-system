import React, { useState, useEffect } from 'react';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'https://examcbt-backend.onrender.com').replace(/\/$/, "");

export default function NewsTicker() {
  const [examUpdates, setExamUpdates] = useState([
    { text: "SSC CGL 2026 Tier-I Notification & Exam Date Schedule Announced", link: "https://ssc.gov.in" },
    { text: "NTA Annual Examination Calendar & Directorate Circular Released", link: "https://nta.ac.in" },
    { text: "Railway RRB NTPC Computer Based Test City Intimation Live", link: "https://indianrailways.gov.in" }
  ]);

  const [circularUpdates, setCircularUpdates] = useState([]);

  useEffect(() => {
    // 1. Fetch live automated updates
    const fetchUpdates = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/live-exam-updates`);
        const data = await response.json();
        if (data.status === 'success' && data.updates?.length > 0) {
          setExamUpdates(data.updates);
        }
      } catch (err) {
        console.warn("Using default official updates fallback");
      }
    };
    fetchUpdates();

    // 2. Fetch Directorate Published Circulars from localStorage
    const loadedCirculars = JSON.parse(localStorage.getItem('cbt_directorate_circulars') || '[]');
    setCircularUpdates(loadedCirculars);
  }, []);

  return (
    <div className="w-full flex flex-col border-b border-amber-500/40 shadow-xl select-none bg-slate-950 overflow-hidden">
      
      {/* 1. Directorate Circulars Row (Auto-hides if 0 items) */}
      {circularUpdates.length > 0 && (
        <div className="bg-[#181105] text-amber-200 text-xs flex items-center h-9 sm:h-10 overflow-hidden border-b border-amber-500/20 relative">
          <div className="bg-amber-500 text-slate-950 font-black px-2.5 sm:px-4 h-full flex items-center gap-1.5 shrink-0 z-20 shadow-md">
            <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping"></span>
            <span className="text-[9px] sm:text-[10px] tracking-wider uppercase font-mono whitespace-nowrap">
              CIRCULAR
            </span>
          </div>

          <div className="ticker-track-container flex-1 overflow-hidden relative">
            <div className="marquee-rail flex items-center gap-8 whitespace-nowrap">
              {circularUpdates.concat(circularUpdates).map((circ, idx) => (
                <div key={idx} className="inline-flex items-center gap-2 px-2.5 py-1 bg-amber-950/40 border border-amber-500/30 rounded-lg shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                  <span className="text-amber-200 font-bold text-[11px] sm:text-xs">{circ.title}</span>
                  <span className="text-[9px] sm:text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-300 font-mono">
                    NOTICE 📄
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Latest Official Notifications Marquee */}
      <div className="bg-[#08182b] text-slate-100 text-xs flex items-center h-9 sm:h-10 overflow-hidden relative">
        <div className="bg-red-600 text-white font-black px-2.5 sm:px-4 h-full flex items-center gap-1.5 shrink-0 z-20 shadow-md">
          <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
          <span className="text-[9px] sm:text-[10px] tracking-wider uppercase font-mono whitespace-nowrap">
            NOTIFICATIONS
          </span>
        </div>

        <div className="ticker-track-container flex-1 overflow-hidden relative">
          <div className="marquee-rail flex items-center gap-8 whitespace-nowrap">
            {examUpdates.concat(examUpdates).map((item, idx) => (
              <a
                key={idx}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 px-3 py-1 bg-slate-900/90 border border-slate-800 rounded-lg hover:border-amber-500/50 hover:bg-slate-800 transition shrink-0"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span className="group-hover:text-amber-300 transition text-[11px] sm:text-xs font-medium text-slate-200">
                  {item.text}
                </span>
                <span className="text-[9px] sm:text-[10px] bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-slate-400 group-hover:text-white font-mono">
                  Official ↗
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Infinite Seamless Loop & Touch-pause Styles */}
      <style>{`
        .ticker-track-container {
          mask-image: linear-gradient(to right, transparent 0%, black 2%, black 98%, transparent 100%);
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 2%, black 98%, transparent 100%);
        }

        .marquee-rail {
          display: inline-flex;
          width: max-content;
          animation: continuousLoop 32s linear infinite;
        }

        .marquee-rail:hover,
        .marquee-rail:active {
          animation-play-state: paused;
        }

        @keyframes continuousLoop {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>

    </div>
  );
}
