import React, { useState } from 'react';

const educationNews = [
  { text: "SSC CGL 2026 Tier-I Notification & Exam Dates Released", link: "https://ssc.gov.in" },
  { text: "NTA Examination Calendar 2026-27 Directorate Circular", link: "https://nta.ac.in" },
  { text: "Railway RRB Non-Technical Popular Categories City Intimation Live", link: "https://indianrailways.gov.in" },
  { text: "UPSC Civil Services Preliminary Examination Official Notice", link: "https://upsc.gov.in" }
];

export default function NewsTicker() {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <div 
      className="bg-[#0b2b4f] text-white text-xs border-b border-[#fbc02d] flex items-center h-9 overflow-hidden select-none cursor-pointer shadow-md"
      onClick={() => setIsPaused(!isPaused)}
      title={isPaused ? "Marquee paused. Click to resume." : "Click anywhere to pause news ticker."}
    >
      <div className="bg-[#d32f2f] text-white font-bold px-3 py-1.5 uppercase tracking-wider text-[11px] shrink-0 z-10 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-white animate-ping"></span> Live Updates
      </div>
      <div className="flex whitespace-nowrap overflow-hidden w-full relative">
        <div className={`flex gap-12 font-medium tracking-wide items-center ${isPaused ? 'animate-none' : 'animate-marquee'}`}>
          {educationNews.map((item, idx) => (
            <a 
              key={idx} 
              href={item.link} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-[#ffeb3b] underline-offset-2 hover:underline inline-flex items-center gap-2 transition"
              onClick={(e) => e.stopPropagation()} // Prevents pause toggle when clicking direct link
            >
              <span>{item.text}</span>
              <span className="text-gray-400">|</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
