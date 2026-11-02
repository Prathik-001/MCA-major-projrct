import React from 'react';

export default function MacBookChassis({ children, viewMode = 'laptop', onToggleView }) {
  if (viewMode === 'screen') {
    // Edge-to-edge native Retina screen mode
    return (
      <div className="fixed inset-0 w-screen h-screen overflow-hidden select-none font-sans bg-black">
        {children}
      </div>
    );
  }

  // Full Photorealistic MacBook Pro 16-inch Laptop Mode
  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#06080d] flex flex-col items-center justify-center p-2 sm:p-3 select-none overflow-hidden font-sans">
      {/* Ambient Atmospheric Desk Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-48 bg-gradient-to-b from-blue-600/10 via-cyan-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* =================================================================== */}
      {/* 1. MACBOOK PRO DISPLAY LID ASSEMBLY                                 */}
      {/* =================================================================== */}
      <div className="relative w-full max-w-[1480px] h-[calc(100vh-140px)] min-h-[460px] bg-[#1a1e29] rounded-t-[28px] p-2 sm:p-2.5 pb-0 shadow-[0_20px_80px_rgba(0,0,0,0.9)] border-t border-x border-[#333b4e] flex flex-col transition-all">
        {/* Top Center Camera Notch (Seamlessly integrates into screen) */}
        <div className="absolute top-2 sm:top-2.5 left-1/2 -translate-x-1/2 w-36 h-6 bg-black rounded-b-xl z-50 flex items-center justify-center gap-2.5 shadow-md pointer-events-none">
          {/* Green Camera Active Indicator LED */}
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse" />
          {/* 1080p FaceTime HD Camera Lens */}
          <div className="w-3 h-3 rounded-full bg-[#0d1117] ring-1 ring-slate-800 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-[#0b2144] ring-1 ring-blue-500/40" />
          </div>
          {/* Ambient Light Sensor */}
          <span className="w-1 h-1 rounded-full bg-slate-900" />
        </div>

        {/* Liquid Retina XDR Display Border & Screen Area */}
        <div className="relative w-full h-full rounded-t-xl overflow-hidden shadow-inner ring-1 ring-black/80 bg-black">
          {children}
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. HINGE & LOWER ALUMINUM KEYBOARD CHASSIS                           */}
      {/* =================================================================== */}
      <div className="relative w-full max-w-[1520px] h-[130px] bg-gradient-to-b from-[#252a38] via-[#1b1f2b] to-[#12151d] rounded-b-[24px] shadow-[0_30px_90px_rgba(0,0,0,0.95)] border-b border-x border-[#333b4e] p-3 flex flex-col justify-between shrink-0">
        {/* Top Hinge Bar */}
        <div className="w-full h-2.5 bg-[#0f1118] rounded-t-sm shadow-inner flex items-center justify-center mb-1 border-b border-slate-800">
          <div className="w-48 h-[1px] bg-slate-700/60" />
        </div>

        {/* Keyboard Deck & Trackpad Row */}
        <div className="flex-1 flex items-center justify-between gap-4 px-3">
          {/* Left Stereo Speaker Grille */}
          <div className="w-20 sm:w-28 h-16 rounded-lg bg-[#141720] border border-slate-800/80 p-1 flex items-center justify-center overflow-hidden opacity-60">
            <div className="w-full h-full bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:4px_4px]" />
          </div>

          {/* Center Magic Keyboard Area Representation */}
          <div className="flex-1 max-w-2xl h-16 bg-[#11131a] rounded-xl border border-slate-800/90 p-1.5 flex flex-col justify-between shadow-inner">
            {/* Function Row */}
            <div className="flex items-center justify-between gap-1 h-2.5">
              {Array.from({ length: 14 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-full rounded-[2px] bg-[#1a1e29] border border-slate-800 shadow-sm flex items-center justify-center ${
                    i === 0 ? 'w-6' : i === 13 ? 'w-6 bg-slate-800 border-slate-700' : 'flex-1'
                  }`}
                />
              ))}
            </div>

            {/* QWERTY Row 1 */}
            <div className="flex items-center justify-between gap-1 h-2.5">
              {Array.from({ length: 14 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-full rounded-[2px] bg-[#1d222e] border border-slate-800/90 shadow-sm ${
                    i === 0 ? 'w-5' : i === 13 ? 'w-5' : 'flex-1'
                  }`}
                />
              ))}
            </div>

            {/* QWERTY Row 2 */}
            <div className="flex items-center justify-between gap-1 h-2.5">
              {Array.from({ length: 13 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-full rounded-[2px] bg-[#1d222e] border border-slate-800/90 shadow-sm ${
                    i === 0 ? 'w-6' : i === 12 ? 'w-7' : 'flex-1'
                  }`}
                />
              ))}
            </div>

            {/* Spacebar Row */}
            <div className="flex items-center justify-between gap-1 h-2.5">
              <div className="w-7 h-full rounded-[2px] bg-[#1d222e] border border-slate-800" />
              <div className="w-5 h-full rounded-[2px] bg-[#1d222e] border border-slate-800" />
              <div className="w-6 h-full rounded-[2px] bg-[#1d222e] border border-slate-800" />
              <div className="flex-1 h-full rounded-[2px] bg-[#222735] border border-slate-700/80 shadow-sm" />
              <div className="w-6 h-full rounded-[2px] bg-[#1d222e] border border-slate-800" />
              <div className="w-5 h-full rounded-[2px] bg-[#1d222e] border border-slate-800" />
              <div className="w-7 h-full rounded-[2px] bg-[#1d222e] border border-slate-800" />
            </div>
          </div>

          {/* Right Stereo Speaker Grille */}
          <div className="w-20 sm:w-28 h-16 rounded-lg bg-[#141720] border border-slate-800/80 p-1 flex items-center justify-center overflow-hidden opacity-60">
            <div className="w-full h-full bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:4px_4px]" />
          </div>
        </div>

        {/* Lower Trackpad & Thumb Opening Lip */}
        <div className="flex items-center justify-center relative mt-1">
          {/* Giant Force Touch Glass Trackpad */}
          <div className="w-48 sm:w-64 h-7 bg-gradient-to-b from-[#181c26] to-[#141720] rounded-lg border border-slate-700/50 shadow-inner flex items-center justify-center">
            <span className="text-[8px] text-slate-600 font-mono tracking-wider">FORCE TOUCH TRACKPAD</span>
          </div>

          {/* Front Thumb Opening Notch */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-32 h-2.5 bg-[#0d0f16] rounded-b-md shadow-inner border-b border-slate-700/50 flex items-center justify-center">
            <span className="text-[7px] text-slate-400 font-bold tracking-widest uppercase font-mono">MacBook Pro</span>
          </div>
        </div>
      </div>
    </div>
  );
}

