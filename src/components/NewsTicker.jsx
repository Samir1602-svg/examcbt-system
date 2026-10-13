import React, { useState } from 'react';

const officialExamUpdates = [
  { text: "SSC CGL 2026 Tier-I Notification & Exam Date Schedule Announced", link: "https://ssc.gov.in" },
  { text: "NTA Annual Examination Calendar 2026-27 Directorate Circular Released", link: "https://nta.ac.in" },
  { text: "Railway RRB Non-Technical Popular Categories City Intimation Live", link: "https://indianrailways.gov.in" },
  { text: "UPSC Civil Services Preliminary Examination Official Notification", link: "https://upsc.gov.in" },
  { text: "Banking IBPS PO Mains Examination Scorecard & Cutoff Marks Live", link: "https://ibps.in" }
];

export default function NewsTicker() {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <div 
      className="bg-[#0b2b4f] text-white text-xs border-b border-[#fbc02d] flex items-center h-10 overflow-hidden select-none cursor-pointer shadow-md"
      onClick={() => setIsPaused(!isPaused)}
      title={isPaused ? "Marquee paused. Click to resume scrolling." : "Click anywhere to pause news ticker."}
    >
      {/* Clean Single Official Badge */}
      <div className="bg-[#d32f2f] text-white font-black px-4 py-2 uppercase tracking-wider text-[11px] shrink-0 z-10 flex items-center gap-2 shadow-inner">
        <span className="w-2 h-2 rounded-full bg-white animate-ping"></span> LATEST NOTIFICATIONS
      </div>

      {/* Smooth Marquee Track */}
      <div className="flex whitespace-nowrap overflow-hidden w-full relative">
        <div className={`flex gap-16 font-semibold tracking-wide items-center ${isPaused ? 'animate-none text-amber-200' : 'animate-marquee'}`}>
          {officialExamUpdates.map((item, idx) => (
            <a 
              key={idx} 
              href={item.link} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-[#ffeb3b] underline-offset-4 hover:underline inline-flex items-center gap-2 transition"
              onClick={(e) => e.stopPropagation()} // Prevents pause toggle when clicking link
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
