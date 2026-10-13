import React, { useState, useEffect } from 'react';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'https://examcbt-backend.onrender.com').replace(/\/$/, "");

export default function NewsTicker() {
  const [updates, setUpdates] = useState([
    { text: "Loading latest government exam policies & recruitment updates...", link: "#" }
  ]);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const fetchAutomatedUpdates = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/live-exam-updates`);
        const data = await response.json();
        if (data.status === 'success' && data.updates?.length > 0) {
          setUpdates(data.updates);
        }
      } catch (err) {
        console.warn("Using default automated exam updates fallback:", err);
      }
    };

    fetchAutomatedUpdates();
    // Refresh automated updates every 1 hour in background
    const interval = setInterval(fetchAutomatedUpdates, 3600000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="bg-[#0b2b4f] text-white text-xs border-b border-[#fbc02d] flex items-center h-10 overflow-hidden select-none cursor-pointer shadow-md"
      onClick={() => setIsPaused(!isPaused)}
      title={isPaused ? "Marquee paused. Click to resume." : "Click anywhere to pause news ticker."}
    >
      <div className="bg-[#d32f2f] text-white font-black px-4 py-2 uppercase tracking-wider text-[11px] shrink-0 z-10 flex items-center gap-2 shadow-inner">
        <span className="w-2 h-2 rounded-full bg-white animate-ping"></span> AUTOMATED EXAM & POLICY ALERTS
      </div>

      <div className="flex whitespace-nowrap overflow-hidden w-full relative">
        <div className={`flex gap-16 font-semibold tracking-wide items-center ${isPaused ? 'animate-none text-amber-200' : 'animate-marquee'}`}>
          {updates.map((item, idx) => (
            <a 
              key={idx} 
              href={item.link} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-[#ffeb3b] underline-offset-4 hover:underline inline-flex items-center gap-2 transition"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-amber-400 font-mono">✦</span>
              <span>{item.text}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
