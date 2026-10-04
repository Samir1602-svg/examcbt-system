import React from 'react';

export default function BrandLogo({ size = 'md' }) {
  const isSm = size === 'sm';
  return (
    <div className="flex items-center space-x-2.5 sm:space-x-3.5 select-none">
      {/* Authentic Govt/CBT Emblemed Shield */}
      <div className={`relative ${isSm ? 'w-8 h-8' : 'w-10 h-10 sm:w-11 sm:h-11'} rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 p-[2px] shadow-lg shadow-emerald-500/20 shrink-0`}>
        <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center overflow-hidden">
          <svg
            className={`${isSm ? 'w-4 h-4' : 'w-5 h-5 sm:w-6 sm:h-6'} text-emerald-400`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* National Security & Assessment Shield */}
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" fillOpacity="0.15" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
      </div>

      {/* Brand Text & Official Standard Badge */}
      <div>
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          <span className={`font-black tracking-tight text-white ${isSm ? 'text-sm' : 'text-base sm:text-xl'}`}>
            EXAM<span className="text-emerald-400">CBT</span>
          </span>
          <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-md">
            Govt Certified
          </span>
        </div>
        <p className="text-[10px] sm:text-xs text-slate-400 font-medium tracking-wide">
          National Assessment Interface
        </p>
      </div>
    </div>
  );
}