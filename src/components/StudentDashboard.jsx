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
  const [upgradeModalTier, setUpgradeModalTier] = useState(null);

  const candidate = currentStudent || {
    id: "CBT-2026-894102",
    name: "Verified Aspirant",
    email: "aspirant.official@assessment.gov.in",
    tier: "FREE" // FREE, PREMIUM_50, PRO_150
  };

  const currentTier = candidate.tier || "FREE";

  // Roll-specific photo management
  const [studentPhoto, setStudentPhoto] = useState(null);

  useEffect(() => {
    if (candidate.id) {
      const savedPhoto = localStorage.getItem(`cbt_photo_${candidate.id}`);
      setStudentPhoto(savedPhoto || null);

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
        localStorage.setItem(`cbt_photo_${candidate.id}`, photoData);
      };
      reader.readAsDataURL(file);
    }
  };

  // Freemium filter: Free users get access to up to 10 sample mock tests
  const accessibleTests = currentTier === "FREE" ? mockTests.slice(0, 10) : mockTests;
  const lockedTestsCount = currentTier === "FREE" ? Math.max(0, mockTests.length - 10) : 0;

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

        {/* Candidate Identity & Tier Card */}
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
              <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase font-black tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full inline-block">
                  Verified Candidate
                </span>
                <span className="text-[9px] uppercase font-black tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full inline-block">
                  Plan: {currentTier}
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-white">{candidate.name}</h2>
              <p className="text-xs text-slate-400 font-mono">{candidate.email}</p>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl text-left md:text-right flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Candidate Roll ID</span>
              <span className="text-lg sm:text-xl font-mono font-black text-emerald-400 mt-0.5 block">{candidate.id}</span>
            </div>
            <button 
              onClick={() => setActiveTab('subscription_plans')}
              className="mt-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold py-1.5 px-3 rounded-xl transition"
            >
              View Subscription Tiers ⚡
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-6 border-b border-slate-800 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('available_tests')}
            className={`text-xs font-bold pb-2 border-b-2 transition whitespace-nowrap ${activeTab === 'available_tests' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            Available Examination Series ({mockTests.length})
          </button>
          <button
            onClick={() => setActiveTab('subscription_plans')}
            className={`text-xs font-bold pb-2 border-b-2 transition whitespace-nowrap ${activeTab === 'subscription_plans' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            Subscription Tiers & Pricing
          </button>
          <button
            onClick={() => setActiveTab('past_results')}
            className={`text-xs font-bold pb-2 border-b-2 transition whitespace-nowrap ${activeTab === 'past_results' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            My Past Exam Results ({pastResults.length})
          </button>
        </div>

        {/* TAB 1: Available Tests (Freemium Enforced) */}
        {activeTab === 'available_tests' && (
          <div className="space-y-4">
            {currentTier === "FREE" && mockTests.length > 10 && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3">
                <p className="text-xs text-amber-300">
                  ⚠️ <strong>Free Tier Active:</strong> You have access to 10 sample mock examinations. Upgrade to Basic Premium (₹50/month) to unlock all scheduled sets.
                </p>
                <button
                  onClick={() => setActiveTab('subscription_plans')}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs whitespace-nowrap"
                >
                  Explore Plans →
                </button>
              </div>
            )}

            {mockTests.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center text-slate-500 text-xs">
                Koi active test available nahi hai. Admin portal se naya test generate karein.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockTests.map((t, idx) => {
                  const isLocked = currentTier === "FREE" && idx >= 10;
                  return (
                    <div 
                      key={t.id || idx} 
                      className={`bg-slate-900 border p-5 rounded-3xl flex flex-col justify-between transition space-y-4 ${isLocked ? 'border-amber-500/30 opacity-75' : 'border-slate-800 hover:border-slate-700'}`}
                    >
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-500/10 border border-teal-500/30 px-2 py-0.5 rounded">
                            Official Tier-1 Simulation
                          </span>
                          {isLocked && (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              🔒 Locked (Premium Required)
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-base sm:text-lg text-white mt-2 mb-1">{t.title}</h3>
                        <div className="flex flex-wrap gap-3 text-xs text-slate-400 mt-3">
                          <span>📝 {t.questions?.length || 0} Questions</span>
                          <span>⏱ {t.duration_mins} Minutes</span>
                          <span>⚡ Real Marking (+2.0 / -0.5)</span>
                        </div>
                      </div>

                      {isLocked ? (
                        <button
                          onClick={() => setActiveTab('subscription_plans')}
                          className="w-full bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold py-3 rounded-2xl text-xs sm:text-sm uppercase tracking-wider transition"
                        >
                          Unlock Full Access (₹50 / Month) →
                        </button>
                      ) : (
                        <button
                          onClick={() => onStartMock(t)}
                          className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-2xl text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/10 active:scale-95 transition"
                        >
                          Attempt Official Examination →
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Subscription Tiers & Pricing (3-Section Matrix View) */}
        {activeTab === 'subscription_plans' && (
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">Choose Your Examination Tier</h2>
              <p className="text-xs text-slate-400">
                Select a tier designed to scale your preparation with real TCS iON simulation engine, custom analysis, and complete question vaults.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              
              {/* Tier 1: Free Tier */}
              <div className={`bg-slate-900 border rounded-3xl p-6 flex flex-col justify-between space-y-6 ${currentTier === 'FREE' ? 'border-emerald-500 shadow-lg shadow-emerald-500/5' : 'border-slate-800'}`}>
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
                      CURRENT / ENTRY
                    </span>
                    <h3 className="text-lg font-black text-white mt-3">Free Trial Tier</h3>
                    <p className="text-2xl font-black text-emerald-400 mt-1">₹0 <span className="text-xs font-normal text-slate-400">/ forever</span></p>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">✓ Access to exactly 10 sample mock exam papers</li>
                    <li className="flex items-center gap-2">✓ Real TCS iON simulation engine & UI</li>
                    <li className="flex items-center gap-2">✓ Instant result & accuracy check</li>
                    <li className="text-slate-500 flex items-center gap-2">✕ Full 6-month scheduled question repository</li>
                    <li className="text-slate-500 flex items-center gap-2">✕ Custom PDF/JSON exam parser vault</li>
                  </ul>
                </div>
                <button 
                  disabled={currentTier === 'FREE'}
                  className="w-full bg-slate-800 text-slate-400 font-bold py-3 rounded-2xl text-xs cursor-not-allowed"
                >
                  {currentTier === 'FREE' ? 'Active Plan' : 'Free Tier'}
                </button>
              </div>

              {/* Tier 2: Basic Premium Tier (₹50 / Month) */}
              <div className={`bg-slate-900 border rounded-3xl p-6 flex flex-col justify-between space-y-6 relative overflow-hidden ${currentTier === 'PREMIUM_50' ? 'border-emerald-500 shadow-lg shadow-emerald-500/10' : 'border-amber-500/50'}`}>
                <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[9px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                  Most Popular
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full">
                      RECOMMENDED FOR ASPIRANTS
                    </span>
                    <h3 className="text-lg font-black text-white mt-3">Basic Premium Tier</h3>
                    <p className="text-2xl font-black text-amber-400 mt-1">₹50 <span className="text-xs font-normal text-slate-400">/ month</span></p>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">✓ Full access to all scheduled examination sets</li>
                    <li className="flex items-center gap-2">✓ Entire active 6-month exam repository</li>
                    <li className="flex items-center gap-2">✓ Complete detailed solutions & analytics</li>
                    <li className="flex items-center gap-2">✓ Priority server response time</li>
                    <li className="text-slate-500 flex items-center gap-2">✕ Custom question paper parser vault</li>
                  </ul>
                </div>
                <button 
                  onClick={() => alert("Redirecting to Secure Payment Gateway for Basic Premium (₹50/month)...")}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/10 transition"
                >
                  Activate Basic Premium (₹50) →
                </button>
              </div>

              {/* Tier 3: Pro Tier with Custom Upload Engine (₹150 / Month) */}
              <div className={`bg-slate-900 border rounded-3xl p-6 flex flex-col justify-between space-y-6 ${currentTier === 'PRO_150' ? 'border-emerald-500 shadow-lg shadow-emerald-500/10' : 'border-slate-800'}`}>
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2.5 py-1 rounded-full">
                      ADVANCED / PRO VAULT
                    </span>
                    <h3 className="text-lg font-black text-white mt-3">Pro Tier with Custom Parser</h3>
                    <p className="text-2xl font-black text-purple-400 mt-1">₹150 <span className="text-xs font-normal text-slate-400">/ month</span></p>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">✓ Everything included in Basic Premium Tier</li>
                    <li className="flex items-center gap-2">✓ Dedicated Pro subscription upload engine</li>
                    <li className="flex items-center gap-2">✓ Upload custom exam sets via PDF or JSON</li>
                    <li className="flex items-center gap-2">✓ Automated AI parsing into CBT format</li>
                    <li className="flex items-center gap-2">✓ Personal candidate vault storage</li>
                  </ul>
                </div>
                <button 
                  onClick={() => alert("Redirecting to Secure Payment Gateway for Pro Tier (₹150/month)...")}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white font-black py-3 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-purple-500/10 transition"
                >
                  Upgrade to Pro Vault (₹150) →
                </button>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: Past Exam Results */}
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
