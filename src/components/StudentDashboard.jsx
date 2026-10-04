import React, { useState } from 'react';

export default function StudentDashboard({
  currentStudent,
  onStudentLogin,
  onLogout,
  mockTests = [],
  onStartMock,
  onBackHome,
  onOpenAdmin
}) {
  const [activeTab, setActiveTab] = useState('available_tests');
  const [studentPhoto, setStudentPhoto] = useState(null);

  // Fallback candidate profile if not directly provided
  const candidate = currentStudent || {
    id: "CBT-2026-894102",
    name: "Verified Aspirant",
    email: "aspirant.official@assessment.gov.in"
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStudentPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Candidate Bar */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl shadow-xl">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-sm">
              CBT
            </div>
            <div>
              <h1 className="font-black text-base sm:text-lg text-white">Candidate Assessment Room</h1>
              <p className="text-[11px] text-slate-400">Computer Based Test Examination System</p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 self-end sm:self-auto">
            <button
              onClick={onBackHome}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 py-2 rounded-xl transition"
            >
              Public Portal
            </button>
            <button
              onClick={onLogout}
              className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-bold px-4 py-2 rounded-xl transition"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Candidate Identity Card */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="flex items-center space-x-4 md:col-span-2">
            <div className="relative group shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800 border-2 border-dashed border-slate-700 overflow-hidden flex items-center justify-center">
                {studentPhoto ? (
                  <img src={studentPhoto} alt="Candidate" className="w-full h-full object-cover" />
                ) : (
                  <label htmlFor="dash-photo-upload" className="cursor-pointer text-[10px] text-center text-slate-400 p-2 leading-tight block">
                    Upload Photo
                  </label>
                )}
              </div>
              <input
                type="file"
                id="dash-photo-upload"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[9px] uppercase font-black tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Verified Candidate
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white">{candidate.name}</h2>
              <p className="text-xs text-slate-400 font-mono">{candidate.email}</p>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl text-left md:text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Candidate Roll ID</span>
            <span className="text-lg sm:text-xl font-mono font-black text-emerald-400 mt-0.5 block">{candidate.id}</span>
            <span className="text-[10px] text-slate-500 mt-1 block">TCS iON Examination Roll Certified</span>
          </div>
        </div>

        {/* Tests Navigation */}
        <div className="flex space-x-3 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('available_tests')}
            className={`text-xs font-bold pb-2 border-b-2 transition ${activeTab === 'available_tests' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            Available Examination Series ({mockTests.length})
          </button>
        </div>

        {/* Tests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockTests.map((t) => (
            <div key={t.id} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-500/10 border border-teal-500/30 px-2 py-0.5 rounded">
                  Official Tier-1 Simulation
                </span>
                <h3 className="font-bold text-base text-white mt-2 mb-1">{t.title}</h3>
                <div className="text-xs text-slate-400 space-x-3 mb-5">
                  <span>📝 {t.questions?.length || 0} Questions</span>
                  <span>⏱️ {t.duration_mins} Minutes</span>
                  <span>⚡ Real Marking (+2.0 / -0.5)</span>
                </div>
              </div>

              <button
                onClick={() => onStartMock(t)}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-2xl text-xs sm:text-sm tracking-wide shadow-lg shadow-emerald-500/10 active:scale-95 transition"
              >
                Attempt Official Examination →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
