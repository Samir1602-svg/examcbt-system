import React, { useState, useEffect } from 'react';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'https://examcbt-backend.onrender.com').replace(/\/$/, "");

export default function NewsTicker() {
  const [examUpdates, setExamUpdates] = useState([
    { text: "SSC CGL 2026 Tier-I Notification & Exam Date Schedule Announced", link: "https://ssc.gov.in" },
    { text: "NTA Annual Examination Calendar & Directorate Circular Released", link: "https://nta.ac.in" },
    { text: "Railway RRB NTPC Computer Based Test City Intimation Live", link: "https://indianrailways.gov.in" }
  ]);

  const [careerUpdates, setCareerUpdates] = useState([
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
          setCareerUpdates(data.updates.slice(3, 6));
        }
      } catch (err) {
        console.warn("Using default education updates fallback");
      }
    };
    fetchUpdates();
  }, []);

  return (
    <div className="w-full flex flex-col border-b border-[#fbc02d] shadow-md select-none">
      
      {/* Ticker Row 1: EXAM RADAR */}
      <div 
        className="bg-[#0b2b4f] text-white text-xs flex items-center h-9 overflow-hidden cursor-pointer border-b border-blue-900/50"
        onClick={() => setIsPaused1(!isPaused1)}
        title={isPaused1 ? "Paused. Click to resume." : "Click to pause."}
      >
        <div className="bg-[#1976d2] text-white font-black px-4 py-2 uppercase tracking-wider text-[10px] shrink-0 z-10 flex items-center gap-2 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> EXAM RADAR
        </div>
        <div className="flex whitespace-nowrap overflow-hidden w-full relative">
          <div className={`flex gap-16 font-semibold tracking-wide items-center ${isPaused1 ? 'animate-none text-amber-200' : 'animate-marquee'}`}>
            {examUpdates.map((item, idx) => (
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

      {/* Ticker Row 2: CAREER FLASH */}
      <div 
        className="bg-[#071d35] text-white text-xs flex items-center h-9 overflow-hidden cursor-pointer"
        onClick={() => setIsPaused2(!isPaused2)}
        title={isPaused2 ? "Paused. Click to resume." : "Click to pause."}
      >
        <div className="bg-[#d32f2f] text-white font-black px-4 py-2 uppercase tracking-wider text-[10px] shrink-0 z-10 flex items-center gap-2 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-white animate-ping"></span> CAREER FLASH
        </div>
        <div className="flex whitespace-nowrap overflow-hidden w-full relative">
          <div className={`flex gap-16 font-semibold tracking-wide items-center ${isPaused2 ? 'animate-none text-amber-200' : 'animate-marquee'}`}>
            {careerUpdates.map((item, idx) => (
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

    </div>
  );
}
