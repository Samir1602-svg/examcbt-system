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
  
  // Pro Custom Vault States
  const [customVaultTests, setCustomVaultTests] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');

  const candidate = currentStudent || {
    id: "CBT-2026-894102",
    name: "Verified Aspirant",
    email: "aspirant.official@assessment.gov.in",
    tier: "FREE" // FREE, PREMIUM_50, PRO_150
  };

  const currentTier = candidate.tier || "FREE";

  // Roll-specific photo and vault management
  const [studentPhoto, setStudentPhoto] = useState(null);

  useEffect(() => {
    if (candidate.id) {
      const savedPhoto = localStorage.getItem(`cbt_photo_${candidate.id}`);
      setStudentPhoto(savedPhoto || null);

      const history = JSON.parse(localStorage.getItem(`cbt_results_${candidate.id}`) || '[]');
      setPastResults(history);

      const vault = JSON.parse(localStorage.getItem(`cbt_vault_${candidate.id}`) || '[]');
      setCustomVaultTests(vault);
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

  // Handle Pro Custom File Upload & Parsing via Backend API
  const handleCustomFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsParsing(true);
    setParseError('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://localhost:8000/api/convert-pdf-to-cbt', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();

      if (data.status === 'success' && data.data?.questions?.length > 0) {
        const newCustomTest = {
          id: `vault-${Date.now()}`,
          title: `Custom Vault: ${selectedFile.name.replace(/\.[^/.]+$/, "")}`,
          duration_mins: 60,
          questions: data.data.questions
        };

        const updatedVault = [newCustomTest, ...customVaultTests];
        setCustomVaultTests(updatedVault);
        localStorage.setItem(`cbt_vault_${candidate.id}`, JSON.stringify(updatedVault));
        setSelectedFile(null);
        alert("Custom question paper successfully parsed and stored in your personal vault!");
      } else {
        setParseError('Failed to parse questions from the uploaded file. Please ensure valid PDF format.');
      }
    } catch (err) {
      console.error(err);
      setParseError('Server connection error during parsing. Ensure backend is running.');
    } finally {
      setIsParsing(false);
    }
  };

  // Helper to simulate Pro Tier activation for testing
  const handleSimulateProUpgrade = () => {
    candidate.tier = "PRO_150";
    if (onStudentLogin) onStudentLogin(candidate);
    alert("Simulated Pro Tier (₹150/month) activated successfully for testing!");
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
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] uppercase font-black tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full inline-block">
                  Verified Candidate
                </span>
                <span className="text-[9px] uppercase font-black tracking-widest bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full inline-block">
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
            <div className="flex gap-2 mt-3 justify-end flex-wrap">
              <button 
                onClick={handleSimulateProUpgrade}
                className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-[10px] font-bold py-1 px-2.5 rounded-xl transition"
                title="Test Pro Tier without payment gateway"
              >
                ⚡ Simulate Pro Tier
              </button>
              <button 
                onClick={() => setActiveTab('subscription_plans')}
                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold py-1 px-2.5 rounded-xl transition"
              >
                View Tiers
              </button>
            </div>
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
            onClick={() => setActiveTab('custom_vault')}
            className={`text-xs font-bold pb-2 border-b-2 transition whitespace-nowrap ${activeTab === 'custom_vault' ? 'border-purple-400 text-purple-400' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            Pro Custom Vault (Upload) ✨
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

        {/* TAB 1: Available Tests */}
        {activeTab === 'available_tests' && (
          <div className="space-y-4">
            {currentTier === "FREE" && mockTests.length > 10 && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3">
                <p className="text-xs text-amber-300">
                  ⚠️ <strong>Free Tier Active:</strong> You have access to 10 sample mock examinations. Upgrade to unlock all scheduled sets.
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
                              🔒 Locked
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
                          Unlock Full Access →
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

        {/* TAB 2: Pro Custom Vault (Upload & Parser) */}
        {activeTab === 'custom_vault' && (
          <div className="space-y-6">
            {currentTier !== 'PRO_150' ? (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-3xl p-8 text-center space-y-4">
                <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-2xl mx-auto flex items-center justify-center text-xl font-black">
                  🔒
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <h3 className="text-lg font-black text-white">Pro Vault Feature Locked</h3>
                  <p className="text-xs text-slate-300">
                    Custom question paper upload aur AI parsing ke liye <strong>Pro Tier (₹150/Month)</strong> active hona chahiye. Aap upar <em>"⚡ Simulate Pro Tier"</em> button daba kar ise turant test kar sakte hain!
                  </p>
                </div>
                <button
                  onClick={handleSimulateProUpgrade}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-black py-2.5 px-6 rounded-2xl text-xs uppercase tracking-wider transition shadow-lg shadow-purple-500/20"
                >
                  Activate Pro Mode for Testing Now →
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Upload Card */}
                <div className="bg-slate-900 border border-purple-500/30 p-6 rounded-3xl space-y-4 shadow-xl">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded">
                      Pro Custom Upload Engine
                    </span>
                    <h3 className="text-lg font-black text-white mt-2">Upload Custom Exam Set (PDF / JSON)</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Apni question paper PDF upload karein. Platform AI parser ke zariye use automatic CBT format me convert karke aapke personal vault me save kar dega.
                    </p>
                  </div>

                  <form onSubmit={handleCustomFileUpload} className="space-y-4">
                    <div className="border-2 border-dashed border-slate-700 hover:border-purple-500/50 p-6 rounded-2xl text-center bg-slate-950/50 transition">
                      <input 
                        type="file" 
                        accept=".pdf,.json"
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                        className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-500 file:text-slate-950 hover:file:bg-purple-400 cursor-pointer"
                      />
                      {selectedFile && (
                        <p className="text-xs text-emerald-400 mt-2 font-mono">Selected: {selectedFile.name}</p>
                      )}
                    </div>

                    {parseError && (
                      <p className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">{parseError}</p>
                    )}

                    <button
                      type="submit"
                      disabled={!selectedFile || isParsing}
                      className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-black py-3 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-purple-500/20 transition"
                    >
                      {isParsing ? 'Parsing PDF & Structuring CBT Questions...' : 'Upload & Parse into CBT Format 🚀'}
                    </button>
                  </form>
                </div>

                {/* Vault Tests List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Your Personal Upload Vault ({customVaultTests.length})</h4>
                  {customVaultTests.length === 0 ? (
                    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
                      Aapke vault me abhi koi custom uploaded exam nahi hai. Upar PDF upload karke pehla test create karein.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {customVaultTests.map((vaultTest) => (
                        <div key={vaultTest.id} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col justify-between space-y-4">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                              Personal Vault Test
                            </span>
                            <h3 className="font-bold text-base text-white mt-2">{vaultTest.title}</h3>
                            <p className="text-xs text-slate-400 mt-1">📝 {vaultTest.questions?.length || 0} Parsed Questions</p>
                          </div>
                          <button
                            onClick={() => onStartMock(vaultTest)}
                            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-2.5 rounded-xl text-xs uppercase tracking-wider transition"
                          >
                            Launch Custom CBT Exam →
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Subscription Tiers & Pricing */}
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
              <div className={`bg-slate-900 border rounded-3xl p-6 flex flex-col justify-between space-y-6 ${currentTier === 'FREE' ? 'border-emerald-500 shadow-lg' : 'border-slate-800'}`}>
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
                  </ul>
                </div>
                <button 
                  onClick={() => { candidate.tier = "FREE"; if(onStudentLogin) onStudentLogin(candidate); alert("Switched to Free Tier"); }}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-2xl text-xs"
                >
                  {currentTier === 'FREE' ? 'Active Plan' : 'Select Free'}
                </button>
              </div>

              {/* Tier 2: Basic Premium Tier (₹50 / Month) */}
              <div className={`bg-slate-900 border rounded-3xl p-6 flex flex-col justify-between space-y-6 ${currentTier === 'PREMIUM_50' ? 'border-emerald-500 shadow-lg' : 'border-amber-500/50'}`}>
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full">
                      RECOMMENDED
                    </span>
                    <h3 className="text-lg font-black text-white mt-3">Basic Premium Tier</h3>
                    <p className="text-2xl font-black text-amber-400 mt-1">₹50 <span className="text-xs font-normal text-slate-400">/ month</span></p>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">✓ Full access to all scheduled examination sets</li>
                    <li className="flex items-center gap-2">✓ Entire active 6-month exam repository</li>
                    <li className="flex items-center gap-2">✓ Complete detailed solutions & analytics</li>
                  </ul>
                </div>
                <button 
                  onClick={() => { candidate.tier = "PREMIUM_50"; if(onStudentLogin) onStudentLogin(candidate); alert("Basic Premium (₹50) Activated!"); }}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-2xl text-xs uppercase tracking-wider transition"
                >
                  {currentTier === 'PREMIUM_50' ? 'Active Plan' : 'Activate Basic (₹50)'}
                </button>
              </div>

              {/* Tier 3: Pro Tier with Custom Upload Engine (₹150 / Month) */}
              <div className={`bg-slate-900 border rounded-3xl p-6 flex flex-col justify-between space-y-6 ${currentTier === 'PRO_150' ? 'border-emerald-500 shadow-lg' : 'border-purple-500/50'}`}>
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2.5 py-1 rounded-full">
                      ADVANCED / PRO VAULT
                    </span>
                    <h3 className="text-lg font-black text-white mt-3">Pro Tier with Custom Parser</h3>
                    <p className="text-2xl font-black text-purple-400 mt-1">₹150 <span className="text-xs font-normal text-slate-400">/ month</span></p>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">✓ Everything in Basic Premium Tier</li>
                    <li className="flex items-center gap-2">✓ Upload custom exam sets via PDF or JSON</li>
                    <li className="flex items-center gap-2">✓ Automated AI parsing into CBT format</li>
                    <li className="flex items-center gap-2">✓ Personal candidate vault storage</li>
                  </ul>
                </div>
                <button 
                  onClick={() => { candidate.tier = "PRO_150"; if(onStudentLogin) onStudentLogin(candidate); alert("Pro Vault (₹150) Activated!"); }}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white font-black py-3 rounded-2xl text-xs uppercase tracking-wider transition"
                >
                  {currentTier === 'PRO_150' ? 'Active Plan' : 'Activate Pro Vault (₹150)'}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* TAB 4: Past Exam Results */}
        {activeTab === 'past_results' && (
          <div>
            {pastResults.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs space-y-2">
                <span className="text-2xl block">📊</span>
                <p>Abhi tak aapne koi exam attempt nahi kiya hai.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pastResults.map((rec) => (
                  <div key={rec.id} className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {rec.date}
                      </span>
                      <h3 className="font-bold text-sm sm:text-base text-white mt-1">{rec.testTitle}</h3>
                      <div className="text-xs text-slate-400 space-x-3 mt-1">
                        <span>Correct: <strong className="text-emerald-400">{rec.correct}</strong></span>
                        <span>Wrong: <strong className="text-rose-400">{rec.wrong}</strong></span>
                        <span>Skipped: <strong className="text-slate-300">{rec.unattempted}</strong></span>
                      </div>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Final Score</span>
                      <span className="text-lg font-black text-emerald-400">{rec.finalScore}</span>
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
