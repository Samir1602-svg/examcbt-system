import React, { useState, useEffect } from 'react';

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
  const [pastResults, setPastResults] = useState([]);

  const candidate = currentStudent || {
    id: "CBT-2026-894102",
    name: "Verified Aspirant",
    email: "aspirant.official@assessment.gov.in"
  };

  // Roll-specific photo management
  const [studentPhoto, setStudentPhoto] = useState(null);

  useEffect(() => {
    if (candidate.id) {
      // 1. Fetch photo specific to this Roll ID only
      const savedPhoto = localStorage.getItem(`cbt_photo_${candidate.id}`);
      setStudentPhoto(savedPhoto || null);

      // 2. Fetch past exam history specific to this Roll ID
      const history = JSON.parse(localStorage.getItem(`cbt_results_${candidate.id}`) || '[]');
      setPastResults(history);
    }
  }, [candidate.id]);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file && candidate.id) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const photoData = reader.result;
        setStudentPhoto(photoData);
        // Save strictly against this candidate's Roll ID
        localStorage.setItem(`cbt_photo_${candidate.id}`, photoData);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8 font-sans selection:bg-emerald-500 selection:text-slate-950">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Header Bar */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl shadow-xl">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-md shadow-emerald-500/20">
              CBT
            </div>
            <div>
              <h1 className="font-black text-base sm:text-lg text-white">EXAMCBT Candidate Portal</h1>
              <p className="text-[11px] text-slate-400">National Computer Based Assessment System</p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 self-end sm:self-auto">
            <button
              onClick={onBackHome}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-3.5 py-2 rounded-xl transition"
            >
              Public Home
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
        <div className="bg-slate-900/60 border border-slate-800 p-5 sm:p-6 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-6 items-center shadow-lg">
          <div className="flex items-center space-x-4 md:col-span-2">
            <div className="relative group shrink-0">
              <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-2xl bg-slate-800 border-2 border-dashed border-slate-700 overflow-hidden flex items-center justify-center shadow-inner">
                {studentPhoto ? (
                  <img src={studentPhoto} alt="Candidate" className="w-full h-full object-cover" />
                ) : (
                  <label htmlFor="dash-photo-upload" className="cursor-pointer text-[10px] text-center text-slate-400 p-2 leading-tight block hover:text-emerald-400 transition">
                    Upload<br/>Photo
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
              {studentPhoto && (
                <label 
                  htmlFor="dash-photo-upload" 
                  className="absolute -bottom-2 -right-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded cursor-pointer shadow"
                >
                  Change
                </label>
              )}
            </div>

            <div className="space-y-1.5">
              <span className="text-[9px] uppercase font-black tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full inline-block">
                Verified Candidate
              </span>
              <h2 className="text-lg sm:text-2xl font-black text-white">{candidate.name}</h2>
              <p className="text-xs text-slate-400 font-mono">{candidate.email}</p>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl text-left md:text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Candidate Roll ID</span>
            <span className="text-lg sm:text-xl font-mono font-black text-emerald-400 mt-0.5 block">{candidate.id}</span>
            <span className="text-[10px] text-slate-500 mt-1 block">TCS iON Center Registration Standard</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-6 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('available_tests')}
            className={`text-xs font-bold pb-2 border-b-2 transition ${activeTab === 'available_tests' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            Available Examination Series ({mockTests.length})
          </button>
          <button
            onClick={() => setActiveTab('past_results')}
            className={`text-xs font-bold pb-2 border-b-2 transition ${activeTab === 'past_results' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            My Past Exam Results ({pastResults.length})
          </button>
        </div>

        {/* TAB 1: Available Tests */}
        {activeTab === 'available_tests' && (
          <div>
            {mockTests.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center text-slate-500 text-xs">
                Koi active test available nahi hai. Admin portal se naya test generate karein.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockTests.map((t) => (
                  <div 
                    key={t.id} 
                    className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col justify-between hover:border-slate-700 transition space-y-4"
                  >
                    <div>
                      <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-500/10 border border-teal-500/30 px-2 py-0.5 rounded">
                        Official Tier-1 Simulation
                      </span>
                      <h3 className="font-bold text-base sm:text-lg text-white mt-2 mb-1">{t.title}</h3>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-400 mt-3">
                        <span>📝 {t.questions?.length || 0} Questions</span>
                        <span>⏱ {t.duration_mins} Minutes</span>
                        <span>⚡ Real Marking (+2.0 / -0.5)</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onStartMock(t)}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-2xl text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/10 active:scale-95 transition"
                    >
                      Attempt Official Examination →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Past Exam Results */}
        {activeTab === 'past_results' && (
          <div>
            {pastResults.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center text-slate-500 text-xs space-y-2">
                <span className="text-2xl block">📊</span>
                <p>Abhi tak aapne koi exam attempt nahi kiya hai.</p>
                <p className="text-[11px] text-slate-600">Koi test submit karne par aapka score, accuracy aur date yahan permanently record ho jayenge.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pastResults.map((rec) => (
                  <div key={rec.id} className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-700 transition">
                    <div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {rec.date}
                      </span>
                      <h3 className="font-bold text-sm sm:text-base text-white mt-1">{rec.testTitle}</h3>
                      <div className="text-xs text-slate-400 space-x-3 mt-1">
                        <span>Correct: <strong className="text-emerald-400">{rec.correct}</strong></span>
                        <span>Wrong: <strong className="text-rose-400">{rec.wrong}</strong></span>
                        <span>Skipped: <strong className="text-slate-300">{rec.unattempted}</strong></span>
                        <span>Time: {rec.timeSpentMins}m</span>
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl text-right self-stretch sm:self-auto">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Final Score</span>
                      <span className="text-lg sm:text-xl font-black text-emerald-400">{rec.finalScore}</span>
                      <span className="text-[10px] text-slate-500 ml-1">/ {rec.totalQuestions * 2}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
