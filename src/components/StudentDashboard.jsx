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
  const [billingHistory, setBillingHistory] = useState([]);
  const [showRenewalBanner, setShowRenewalBanner] = useState(false);
  
  // Custom Vault States for Advanced Tier
  const [customVaultTests, setCustomVaultTests] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');

  const candidate = currentStudent || {
    id: "CBT-2026-894102",
    name: "Verified Aspirant",
    email: "aspirant.official@assessment.gov.in",
    tier: "FREE", // FREE, BASIC, ADVANCED
    subscriptionExpiry: "2026-10-18" // Example expiry for reminder check (5 days or less)
  };

  const currentTier = candidate.tier || "FREE";
  const isAdvancedPro = currentTier === 'ADVANCED';

  // Roll-specific photo, vault, and billing management
  const [studentPhoto, setStudentPhoto] = useState(null);

  useEffect(() => {
    if (candidate.id) {
      const savedPhoto = localStorage.getItem(`cbt_photo_${candidate.id}`);
      setStudentPhoto(savedPhoto || null);

      const history = JSON.parse(localStorage.getItem(`cbt_results_${candidate.id}`) || '[]');
      setPastResults(history);

      const vault = JSON.parse(localStorage.getItem(`cbt_vault_${candidate.id}`) || '[]');
      setCustomVaultTests(vault);

      // Mock Billing & Purchases History Data
      const billing = JSON.parse(localStorage.getItem(`cbt_billing_${candidate.id}`) || JSON.stringify([
        {
          invoiceId: "INV-2026-001",
          tier: currentTier === 'ADVANCED' ? "Advanced Pro Vault (₹150 / Month)" : currentTier === 'BASIC' ? "Standard Premium (₹50 / Month)" : "Free Starter Plan",
          purchaseDate: "2026-10-11",
          expiryDate: candidate.subscriptionExpiry || "2026-11-11",
          status: currentTier === 'FREE' ? "Active (Complimentary)" : "SUCCESS",
          amountPaid: currentTier === 'ADVANCED' ? "₹150.00" : currentTier === 'BASIC' ? "₹50.00" : "₹0.00"
        }
      ]));
      setBillingHistory(billing);

      // Point 4: Subscription Renewal Reminder (5 days or fewer remaining)
      if (candidate.subscriptionExpiry && currentTier !== 'FREE') {
        const expiryDate = new Date(candidate.subscriptionExpiry);
        const today = new Date();
        const diffTime = expiryDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 5) {
          const lastShown = localStorage.getItem(`cbt_renewal_alert_${candidate.id}`);
          const todayStr = today.toDateString();
          if (lastShown !== todayStr) {
            setShowRenewalBanner(true);
            localStorage.setItem(`cbt_renewal_alert_${candidate.id}`, todayStr);
          }
        }
      }
    }
  }, [candidate.id, currentTier]);

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

  // Point 3: Pro Tier Custom Upload Engine & Parser
  const handleCustomFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    if (!isAdvancedPro) {
      alert("Custom upload vault is available exclusively for Advanced Pro Vault subscribers.");
      setActiveTab('subscription_plans');
      return;
    }

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
        alert("Custom question paper successfully parsed and stored in your secure vault!");
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

  return (
    <div className={`min-h-screen p-4 sm:p-8 font-sans transition-colors duration-300 ${
      isAdvancedPro ? 'bg-[#0f0e0a] text-amber-50 selection:bg-amber-400 selection:text-slate-950' : 'bg-slate-950 text-white selection:bg-emerald-500 selection:text-slate-950'
    }`}>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Point 4: Daily Subscription Renewal Reminder Banner */}
        {showRenewalBanner && (
          <div className="bg-amber-500 text-slate-950 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3 shadow-xl animate-bounce">
            <div className="flex items-center gap-2">
              <span className="text-xl">⏳</span>
              <p className="text-xs font-black uppercase tracking-wider">
                Subscription Notice: Your active examination subscription is expiring soon. Renew now to avoid interruption in mock test access.
              </p>
            </div>
            <button
              onClick={() => { setShowRenewalBanner(false); setActiveTab('subscription_plans'); }}
              className="bg-slate-950 text-amber-400 font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider hover:bg-slate-900 whitespace-nowrap"
            >
              Renew Subscription →
            </button>
          </div>
        )}

        {/* Top Header Bar */}
        <header className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 sm:p-5 rounded-3xl shadow-xl border ${
          isAdvancedPro ? 'bg-[#18160e] border-amber-500/30 shadow-amber-950/20' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center space-x-3.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-md ${
              isAdvancedPro ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-amber-500/20' : 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-emerald-500/20'
            }`}>
              CBT
            </div>
            <div>
              <h1 className="font-black text-base sm:text-lg text-white">EXAMCBT Candidate Portal</h1>
              <p className={`text-[11px] ${isAdvancedPro ? 'text-amber-200/70' : 'text-slate-400'}`}>National Computer Based Assessment System</p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 self-end sm:self-auto">
            <button
              onClick={onBackHome}
              className={`text-xs font-bold px-3.5 py-2 rounded-xl transition ${
                isAdvancedPro ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
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
        <div className={`p-5 sm:p-6 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-6 items-center shadow-lg border ${
          isAdvancedPro ? 'bg-[#18160e]/80 border-amber-500/30' : 'bg-slate-900/60 border-slate-800'
        }`}>
          <div className="flex items-center space-x-4 md:col-span-2">
            <div className="relative group shrink-0">
              <div className={`w-16 h-20 sm:w-20 sm:h-24 rounded-2xl border-2 border-dashed overflow-hidden flex items-center justify-center shadow-inner ${
                isAdvancedPro ? 'bg-[#221f14] border-amber-500/40' : 'bg-slate-800 border-slate-700'
              }`}>
                {studentPhoto ? (
                  <img src={studentPhoto} alt="Candidate" className="w-full h-full object-cover" />
                ) : (
                  <label htmlFor="dash-photo-upload" className={`cursor-pointer text-[10px] text-center p-2 leading-tight block transition ${
                    isAdvancedPro ? 'text-amber-300 hover:text-amber-400' : 'text-slate-400 hover:text-emerald-400'
                  }`}>
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
                  className={`absolute -bottom-2 -right-1 text-[9px] font-black px-1.5 py-0.5 rounded cursor-pointer shadow ${
                    isAdvancedPro ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  }`}
                >
                  Change
                </label>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full inline-block border ${
                  isAdvancedPro ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}>
                  Verified Candidate
                </span>
                <span className={`text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full inline-block border ${
                  isAdvancedPro ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40 shadow-sm shadow-yellow-500/20' :
                  currentTier === 'BASIC' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                  'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  {isAdvancedPro ? '★ Advanced Pro Vault Plan' : currentTier === 'BASIC' ? 'Standard Premium Plan' : 'Free Starter Plan'}
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-white">{candidate.name}</h2>
              <p className={`text-xs font-mono ${isAdvancedPro ? 'text-amber-200/70' : 'text-slate-400'}`}>{candidate.email}</p>
            </div>
          </div>

          <div className={`p-4 rounded-2xl text-left md:text-right flex flex-col justify-between border ${
            isAdvancedPro ? 'bg-[#12100a] border-amber-500/30' : 'bg-slate-950 border-slate-800/80'
          }`}>
            <div>
              <span className={`text-[10px] uppercase font-bold tracking-wider ${isAdvancedPro ? 'text-amber-300/70' : 'text-slate-500'}`}>Candidate Roll ID</span>
              <span className={`text-lg sm:text-xl font-mono font-black mt-0.5 block ${isAdvancedPro ? 'text-amber-400' : 'text-emerald-400'}`}>{candidate.id}</span>
            </div>
            <div className="flex gap-2 mt-3 justify-end flex-wrap">
              <button 
                onClick={() => setActiveTab('subscription_plans')}
                className={`text-[10px] font-bold py-1 px-3 rounded-xl transition border ${
                  isAdvancedPro ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}
              >
                Plans & Pricing
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`flex space-x-6 border-b pb-2 overflow-x-auto ${isAdvancedPro ? 'border-amber-500/20' : 'border-slate-800'}`}>
          <button
            onClick={() => setActiveTab('available_tests')}
            className={`text-xs font-bold pb-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'available_tests' ? (isAdvancedPro ? 'border-amber-400 text-amber-400' : 'border-emerald-400 text-emerald-400') : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Available Examination Series ({mockTests.length})
          </button>
          
          {isAdvancedPro && (
            <button
              onClick={() => setActiveTab('custom_vault')}
              className={`text-xs font-bold pb-2 border-b-2 transition whitespace-nowrap ${
                activeTab === 'custom_vault' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Secure Custom Vault ✨
            </button>
          )}

          <button
            onClick={() => setActiveTab('subscription_plans')}
            className={`text-xs font-bold pb-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'subscription_plans' ? (isAdvancedPro ? 'border-amber-400 text-amber-400' : 'border-emerald-400 text-emerald-400') : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Upgrade Plans & Subscriptions
          </button>

          {/* Point 5: Internal Billing & Purchases Tab */}
          <button
            onClick={() => setActiveTab('billing_history')}
            className={`text-xs font-bold pb-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'billing_history' ? (isAdvancedPro ? 'border-amber-400 text-amber-400' : 'border-emerald-400 text-emerald-400') : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Billing & Purchases ({billingHistory.length})
          </button>

          <button
            onClick={() => setActiveTab('past_results')}
            className={`text-xs font-bold pb-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'past_results' ? (isAdvancedPro ? 'border-amber-400 text-amber-400' : 'border-emerald-400 text-emerald-400') : 'border-transparent text-slate-400 hover:text-white'
            }`}
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
                  ⚠️ <strong>Starter Plan Active:</strong> You have access to 10 sample mock examinations. Upgrade via subscription plans to unlock full repository.
                </p>
                <button
                  onClick={() => setActiveTab('subscription_plans')}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs whitespace-nowrap"
                >
                  View Upgrade Options →
                </button>
              </div>
            )}

            {mockTests.length === 0 ? (
              <div className={`border rounded-2xl p-12 text-center text-xs ${
                isAdvancedPro ? 'bg-[#18160e]/40 border-amber-500/20 text-amber-200/60' : 'bg-slate-900/40 border-slate-800/80 text-slate-500'
              }`}>
                Koi active test available nahi hai. Admin portal se naya test generate karein.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockTests.map((t, idx) => {
                  const isLocked = currentTier === "FREE" && idx >= 10;
                  return (
                    <div 
                      key={t.id || idx} 
                      className={`border p-5 rounded-3xl flex flex-col justify-between transition space-y-4 ${
                        isAdvancedPro ? 'bg-[#18160e] border-amber-500/30 hover:border-amber-500/50 shadow-lg shadow-amber-950/10' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                            isAdvancedPro ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 'text-teal-400 bg-teal-500/10 border-teal-500/30'
                          }`}>
                            Official Tier-1 Simulation
                          </span>
                          {isLocked && (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              🔒 Locked
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-base sm:text-lg text-white mt-2 mb-1">{t.title}</h3>
                        <div className={`flex flex-wrap gap-3 text-xs mt-3 ${isAdvancedPro ? 'text-amber-200/70' : 'text-slate-400'}`}>
                          <span>📝 {t.questions?.length || 0} Questions</span>
                          <span>⏱ {t.duration_mins} Minutes</span>
                          <span>⚡ Real Marking (+2.0 / -0.5)</span>
                        </div>
                      </div>

                      {isLocked ? (
                        <button
                          onClick={() => setActiveTab('subscription_plans')}
                          className={`w-full font-bold py-3 rounded-2xl text-xs sm:text-sm uppercase tracking-wider transition ${
                            isAdvancedPro ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20' : 'bg-slate-800 hover:bg-slate-700 text-amber-400'
                          }`}
                        >
                          Unlock Full Repository →
                        </button>
                      ) : (
                        <button
                          onClick={() => onStartMock(t)}
                          className={`w-full font-black py-3 rounded-2xl text-xs sm:text-sm uppercase tracking-wider shadow-lg active:scale-95 transition ${
                            isAdvancedPro ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-amber-500/20' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/10'
                          }`}
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

        {/* TAB 2: Secure Custom Vault (Advanced Tier Only) */}
        {activeTab === 'custom_vault' && isAdvancedPro && (
          <div className="space-y-6">
            <div className="bg-[#18160e] border border-amber-500/40 p-6 rounded-3xl space-y-4 shadow-2xl shadow-amber-950/20">
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                  Advanced Custom Upload Engine
                </span>
                <h3 className="text-lg font-black text-white mt-2">Upload Custom Exam Set (PDF / JSON)</h3>
                <p className="text-xs text-amber-200/70 mt-1">
                  Upload your examination question papers. Our automated engine parses them into standard CBT format and stores them in your private vault.
                </p>
              </div>

              <form onSubmit={handleCustomFileUpload} className="space-y-4">
                <div className="border-2 border-dashed border-amber-500/30 hover:border-amber-500/60 p-6 rounded-2xl text-center bg-[#12100a] transition">
                  <input 
                    type="file" 
                    accept=".pdf,.json"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="text-xs text-amber-200/80 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
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
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 hover:opacity-90 disabled:opacity-50 text-slate-950 font-black py-3 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition"
                >
                  {isParsing ? 'Processing & Structuring CBT Format...' : 'Upload & Parse into CBT Format 🚀'}
                </button>
              </form>
            </div>

            {/* Vault Tests List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300/80">Your Private Vault Repository ({customVaultTests.length})</h4>
              {customVaultTests.length === 0 ? (
                <div className="bg-[#18160e]/50 border border-amber-500/20 rounded-2xl p-8 text-center text-amber-200/60 text-xs">
                  Aapke vault me abhi koi custom uploaded exam nahi hai. Upar PDF upload karke pehla test create karein.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customVaultTests.map((vaultTest) => (
                    <div key={vaultTest.id} className="bg-[#18160e] border border-amber-500/30 p-5 rounded-3xl flex flex-col justify-between space-y-4">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          Private Vault Test
                        </span>
                        <h3 className="font-bold text-base text-white mt-2">{vaultTest.title}</h3>
                        <p className="text-xs text-amber-200/70 mt-1">📝 {vaultTest.questions?.length || 0} Parsed Questions</p>
                      </div>
                      <button
                        onClick={() => onStartMock(vaultTest)}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl text-xs uppercase tracking-wider transition shadow-md shadow-amber-500/10"
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

        {/* TAB 3: Upgrade Plans & Subscriptions */}
        {activeTab === 'subscription_plans' && (
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">Choose Your Examination Subscription</h2>
              <p className={`text-xs ${isAdvancedPro ? 'text-amber-200/70' : 'text-slate-400'}`}>
                Scale your preparation with genuine TCS iON exam simulation, complete mock test repositories, and advanced custom parsing tools.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              
              {/* Tier 1: Free Starter */}
              <div className={`border rounded-3xl p-6 flex flex-col justify-between space-y-6 ${
                isAdvancedPro ? 'bg-[#18160e] border-amber-500/20' : 'bg-slate-900 border-slate-800'
              }`}>
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
                      STARTER ACCESS
                    </span>
                    <h3 className="text-lg font-black text-white mt-3">Free Practice Plan</h3>
                    <p className="text-2xl font-black text-emerald-400 mt-1">₹0 <span className="text-xs font-normal text-slate-400">/ forever</span></p>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">✓ Access to 10 sample mock examinations</li>
                    <li className="flex items-center gap-2">✓ Real TCS iON simulation interface</li>
                    <li className="flex items-center gap-2">✓ Instant result & performance check</li>
                  </ul>
                </div>
                <button 
                  disabled
                  className="w-full bg-slate-800 text-slate-400 font-bold py-3 rounded-2xl text-xs cursor-default"
                >
                  {currentTier === 'FREE' ? 'Current Active Plan' : 'Free Starter'}
                </button>
              </div>

              {/* Tier 2: Standard Premium */}
              <div className={`border rounded-3xl p-6 flex flex-col justify-between space-y-6 relative overflow-hidden ${
                isAdvancedPro ? 'bg-[#18160e] border-amber-500/40 shadow-lg shadow-amber-950/10' : 'bg-slate-900 border-amber-500/50'
              }`}>
                <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[9px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                  Most Popular
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full">
                      STANDARD PREMIUM
                    </span>
                    <h3 className="text-lg font-black text-white mt-3">Full Mock Repository</h3>
                    <p className="text-2xl font-black text-amber-400 mt-1">₹50 <span className="text-xs font-normal text-slate-400">/ month</span></p>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">✓ Full access to all scheduled examination sets</li>
                    <li className="flex items-center gap-2">✓ Active 6-month question bank repository</li>
                    <li className="flex items-center gap-2">✓ Detailed solutions and analytical scorecards</li>
                  </ul>
                </div>
                <button 
                  onClick={() => alert("Razorpay payment gateway integration ready. Connect your merchant key to accept payments.")}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-2xl text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/10"
                >
                  {currentTier === 'BASIC' ? 'Active Plan' : 'Proceed to Pay (₹50) →'}
                </button>
              </div>

              {/* Tier 3: Advanced Pro Vault */}
              <div className={`border rounded-3xl p-6 flex flex-col justify-between space-y-6 ${
                isAdvancedPro ? 'bg-[#18160e] border-amber-400 shadow-xl shadow-amber-950/20 ring-2 ring-amber-400/20' : 'bg-slate-900 border-purple-500/50'
              }`}>
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full">
                      PRO VAULT & PARSER
                    </span>
                    <h3 className="text-lg font-black text-white mt-3">Advanced Custom Engine</h3>
                    <p className="text-2xl font-black text-amber-400 mt-1">₹150 <span className="text-xs font-normal text-slate-400">/ month</span></p>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">✓ All Standard Premium repository features</li>
                    <li className="flex items-center gap-2">✓ Custom exam upload via PDF or JSON</li>
                    <li className="flex items-center gap-2">✓ AI-powered automated CBT formatting</li>
                    <li className="flex items-center gap-2">✓ Secure personal candidate vault storage</li>
                  </ul>
                </div>
                <button 
                  onClick={() => alert("Razorpay payment gateway integration ready. Connect your merchant key to accept payments.")}
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 hover:opacity-90 text-slate-950 font-black py-3 rounded-2xl text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20"
                >
                  {currentTier === 'ADVANCED' ? 'Active Plan' : 'Proceed to Pay (₹150) →'}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* TAB 5: Internal Billing & Purchases History (Point 5) */}
        {activeTab === 'billing_history' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-black text-white">Billing & Purchases Ledger</h3>
              <p className={`text-xs ${isAdvancedPro ? 'text-amber-200/70' : 'text-slate-400'}`}>
                Complete record of your subscription purchases, invoice IDs, transaction statuses, and validity periods.
              </p>
            </div>

            {billingHistory.length === 0 ? (
              <div className={`border rounded-2xl p-12 text-center text-xs ${
                isAdvancedPro ? 'bg-[#18160e]/40 border-amber-500/20 text-amber-200/60' : 'bg-slate-900/40 border-slate-800 text-slate-500'
              }`}>
                No billing or purchase history found.
              </div>
            ) : (
              <div className="space-y-3">
                {billingHistory.map((bill, index) => (
                  <div key={index} className={`border p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                    isAdvancedPro ? 'bg-[#18160e] border-amber-500/30' : 'bg-slate-900 border-slate-800'
                  }`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-400">{bill.invoiceId}</span>
                        <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                          bill.status.includes('SUCCESS') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {bill.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-white">{bill.tier}</h4>
                      <div className={`text-xs space-x-3 ${isAdvancedPro ? 'text-amber-200/70' : 'text-slate-400'}`}>
                        <span>Purchased: {bill.purchaseDate}</span>
                        <span>•</span>
                        <span>Expires: {bill.expiryDate}</span>
                      </div>
                    </div>
                    <div className={`border px-4 py-3 rounded-xl text-right ${
                      isAdvancedPro ? 'bg-[#12100a] border-amber-500/30' : 'bg-slate-950 border-slate-800'
                    }`}>
                      <span className={`text-[10px] uppercase font-bold block ${isAdvancedPro ? 'text-amber-300/70' : 'text-slate-400'}`}>Amount Paid</span>
                      <span className={`text-lg font-black ${isAdvancedPro ? 'text-amber-400' : 'text-emerald-400'}`}>{bill.amountPaid}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Past Exam Results */}
        {activeTab === 'past_results' && (
          <div>
            {pastResults.length === 0 ? (
              <div className={`border rounded-2xl p-12 text-center text-xs ${
                isAdvancedPro ? 'bg-[#18160e]/40 border-amber-500/20 text-amber-200/60' : 'bg-slate-900/40 border-slate-800 text-slate-500'
              }`}>
                <span className="text-2xl block mb-2">📊</span>
                <p>Abhi tak aapne koi exam attempt nahi kiya hai.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pastResults.map((rec) => (
                  <div key={rec.id} className={`border p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                    isAdvancedPro ? 'bg-[#18160e] border-amber-500/30' : 'bg-slate-900 border-slate-800'
                  }`}>
                    <div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        isAdvancedPro ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                      }`}>
                        {rec.date}
                      </span>
                      <h3 className="font-bold text-sm sm:text-base text-white mt-1">{rec.testTitle}</h3>
                      <div className={`text-xs space-x-3 mt-1 ${isAdvancedPro ? 'text-amber-200/70' : 'text-slate-400'}`}>
                        <span>Correct: <strong className="text-emerald-400">{rec.correct}</strong></span>
                        <span>Wrong: <strong className="text-rose-400">{rec.wrong}</strong></span>
                        <span>Skipped: <strong className={isAdvancedPro ? 'text-amber-200' : 'text-slate-300'}>{rec.unattempted}</strong></span>
                      </div>
                    </div>
                    <div className={`border px-4 py-2.5 rounded-xl text-right ${
                      isAdvancedPro ? 'bg-[#12100a] border-amber-500/30' : 'bg-slate-950 border-slate-800'
                    }`}>
                      <span className={`text-[10px] uppercase font-bold block ${isAdvancedPro ? 'text-amber-300/70' : 'text-slate-400'}`}>Final Score</span>
                      <span className={`text-lg font-black ${isAdvancedPro ? 'text-amber-400' : 'text-emerald-400'}`}>{rec.finalScore}</span>
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
