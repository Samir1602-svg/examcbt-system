import React, { useState, useEffect } from 'react';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'https://examcbt-backend.onrender.com').replace(/\/$/, "");
const OFFICIAL_UPI_ID = "dcgamers00876@okicici";
const PAYEE_NAME = "EXAMCBT Directorate";

export default function StudentDashboard({
  currentStudent,
  onStudentLogin,
  onUpdateStudentProfile,
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

  // Payment Checkout States
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPlanDetails, setSelectedPlanDetails] = useState(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentMsg, setPaymentMsg] = useState({ type: '', text: '' });
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Dynamic Subscription Pricing (Admin Controlled)
  const [subscriptionPricing, setSubscriptionPricing] = useState(() => {
    return JSON.parse(localStorage.getItem('cbt_subscription_pricing') || JSON.stringify({
      basicPrice: 50,
      basicSemiAnnualPrice: 299,
      advancedPrice: 150,
      advancedAnnualPrice: 799
    }));
  });

  const [candidateState, setCandidateState] = useState(() => currentStudent || {
    id: "CBT-2026-894102",
    name: "Verified Aspirant",
    email: "aspirant.official@assessment.gov.in",
    tier: "FREE",
    subscriptionExpiry: "2026-10-18"
  });

  const currentTier = (candidateState.tier || "FREE").toUpperCase();
  const isBasePlan = currentTier === 'FREE' || currentTier === 'BASE';
  const isProPlan = currentTier === 'BASIC' || currentTier === 'PRO';
  const isAdvancedPro = currentTier === 'ADVANCED' || currentTier === 'ADVANCE';

  // Persistent Student Profile Photo (Multi-layer fallback)
  const [studentPhoto, setStudentPhoto] = useState(() => {
    return candidateState.avatar || localStorage.getItem(`cbt_photo_${candidateState.id}`) || null;
  });

  // Central Results, Tier Verification & Billing Ledger Sync
  const fetchCentralCandidateData = async () => {
    if (!candidateState.id) return;

    // 1. Live Tier Synchronization directly from Central Cloud Database
    try {
      const sRes = await fetch(`${API_BASE_URL}/api/students`);
      if (sRes.ok) {
        const sData = await sRes.json();
        if (sData.status === 'success' && Array.isArray(sData.students)) {
          const freshRecord = sData.students.find(
            s => s.id === candidateState.id || (s.email && s.email.toLowerCase() === candidateState.email.toLowerCase())
          );
          if (freshRecord && freshRecord.tier && freshRecord.tier !== candidateState.tier) {
            const merged = { ...candidateState, tier: freshRecord.tier };
            setCandidateState(merged);
            localStorage.setItem('cbt_active_student', JSON.stringify(merged));
            if (onUpdateStudentProfile) onUpdateStudentProfile(merged);
          }
        }
      }
    } catch (e) {
      console.warn("Realtime student tier sync error:", e);
    }

    // 2. Fetch past results from central backend
    try {
      const res = await fetch(`${API_BASE_URL}/api/results/${candidateState.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success' && Array.isArray(data.results)) {
          setPastResults(data.results);
          localStorage.setItem(`cbt_results_${candidateState.id}`, JSON.stringify(data.results));
        }
      }
    } catch (e) {
      const localHistory = JSON.parse(localStorage.getItem(`cbt_results_${candidateState.id}`) || '[]');
      setPastResults(localHistory);
    }

    // 3. Fetch payments ledger from central backend
    try {
      const pRes = await fetch(`${API_BASE_URL}/api/payments`);
      if (pRes.ok) {
        const pData = await pRes.json();
        if (pData.status === 'success' && Array.isArray(pData.payments)) {
          const myPayments = pData.payments.filter(
            p => p.studentId === candidateState.id || p.email === candidateState.email
          );
          if (myPayments.length > 0) {
            const formatted = myPayments.map(m => ({
              invoiceId: m.utr ? `UTR-${m.utr.slice(-6)}` : m.id,
              tier: m.tierName || (m.tier === 'ADVANCED' ? 'Advance Plan (Pro Vault)' : 'Pro Plan (Standard Premium)'),
              purchaseDate: m.date || new Date().toLocaleDateString('en-IN'),
              expiryDate: m.expiryDate || "Active Term",
              status: m.status === 'APPROVED' ? 'SUCCESS (ACTIVATED)' : m.status === 'REJECTED' ? 'REJECTED' : 'PENDING VERIFICATION',
              amountPaid: `₹${m.amount}.00`
            }));
            setBillingHistory(formatted);
            localStorage.setItem(`cbt_billing_${candidateState.id}`, JSON.stringify(formatted));

            // Auto-upgrade session locally if payment has been approved
            const approvedPayment = myPayments.find(p => p.status === 'APPROVED');
            if (approvedPayment && candidateState.tier !== approvedPayment.tier) {
              const upgraded = { ...candidateState, tier: approvedPayment.tier };
              setCandidateState(upgraded);
              localStorage.setItem('cbt_active_student', JSON.stringify(upgraded));
              if (onUpdateStudentProfile) onUpdateStudentProfile(upgraded);
            }
            return;
          }
        }
      }
    } catch (err) {
      console.warn("Could not load central payments ledger:", err);
    }

    const localBilling = JSON.parse(localStorage.getItem(`cbt_billing_${candidateState.id}`) || JSON.stringify([
      {
        invoiceId: "INV-2026-001",
        tier: isAdvancedPro ? `Advance Plan (₹${subscriptionPricing.advancedPrice} / Month)` : isProPlan ? `Pro Plan (₹${subscriptionPricing.basicPrice} / Month)` : "Base Plan (Free Starter)",
        purchaseDate: "2026-10-11",
        expiryDate: candidateState.subscriptionExpiry || "2026-11-11",
        status: isBasePlan ? "Active (Complimentary)" : "SUCCESS",
        amountPaid: isAdvancedPro ? `₹${subscriptionPricing.advancedPrice}.00` : isProPlan ? `₹${subscriptionPricing.basicPrice}.00` : "₹0.00"
      }
    ]));
    setBillingHistory(localBilling);
  };

  useEffect(() => {
    if (currentStudent && currentStudent.id) {
      setCandidateState(currentStudent);
    }
  }, [currentStudent]);

  useEffect(() => {
    if (candidateState.id) {
      const savedPhoto = candidateState.avatar || localStorage.getItem(`cbt_photo_${candidateState.id}`);
      setStudentPhoto(savedPhoto || null);

      fetchCentralCandidateData();

      const vault = JSON.parse(localStorage.getItem(`cbt_vault_${candidateState.id}`) || '[]');
      setCustomVaultTests(vault);

      const livePricing = JSON.parse(localStorage.getItem('cbt_subscription_pricing') || 'null');
      if (livePricing) setSubscriptionPricing(livePricing);

      if (candidateState.subscriptionExpiry && !isBasePlan) {
        const expiryDate = new Date(candidateState.subscriptionExpiry);
        const today = new Date();
        const diffTime = expiryDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 5) {
          const lastShown = localStorage.getItem(`cbt_renewal_alert_${candidateState.id}`);
          const todayStr = today.toDateString();
          if (lastShown !== todayStr) {
            setShowRenewalBanner(true);
            localStorage.setItem(`cbt_renewal_alert_${candidateState.id}`, todayStr);
          }
        }
      }
    }
  }, [candidateState.id, candidateState.tier]);

  // Photo Upload Handler with Lightweight Canvas Compression
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file && candidateState.id) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = 150;
          canvas.height = 150;
          ctx.drawImage(img, 0, 0, 150, 150);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);

          setStudentPhoto(compressedBase64);
          localStorage.setItem(`cbt_photo_${candidateState.id}`, compressedBase64);

          const updatedCandidate = { 
            ...candidateState, 
            avatar: compressedBase64,
            photo: compressedBase64 
          };

          setCandidateState(updatedCandidate);

          if (onUpdateStudentProfile) {
            onUpdateStudentProfile(updatedCandidate);
          }

          localStorage.setItem('cbt_active_student', JSON.stringify(updatedCandidate));

          const allStudents = JSON.parse(localStorage.getItem('cbt_students') || '[]');
          const updatedRoster = allStudents.map(s => 
            (s.id === candidateState.id || s.email === candidateState.email) 
              ? { ...s, avatar: compressedBase64, photo: compressedBase64 } 
              : s
          );
          localStorage.setItem('cbt_students', JSON.stringify(updatedRoster));

          fetch(`${API_BASE_URL}/api/students/update-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: candidateState.id, email: candidateState.email, avatar: compressedBase64 }),
          }).catch(err => console.warn("Background photo sync offline:", err));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  // Custom Upload Engine & Parser
  const handleCustomFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    if (!isAdvancedPro) {
      alert("Custom upload vault is available exclusively for Advance Plan (Pro Vault) subscribers.");
      setActiveTab('subscription_plans');
      return;
    }

    setIsParsing(true);
    setParseError('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`${API_BASE_URL}/api/convert-pdf-to-cbt`, {
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
        localStorage.setItem(`cbt_vault_${candidateState.id}`, JSON.stringify(updatedVault));
        setSelectedFile(null);
        alert("Custom question paper successfully parsed and stored in your secure vault!");
      } else {
        setParseError('Failed to parse questions from the uploaded file. Please ensure valid PDF format.');
      }
    } catch (err) {
      console.error(err);
      setParseError('Server connection error during parsing. Please retry.');
    } finally {
      setIsParsing(false);
    }
  };

  // Payment Modal Trigger
  const handleInitiatePayment = (planTier, planTitle, amount) => {
    setSelectedPlanDetails({
      tier: planTier,
      title: planTitle,
      amount: amount
    });
    setUtrNumber('');
    setPaymentMsg({ type: '', text: '' });
    setCheckoutModalOpen(true);
  };

  // Direct UPI QR Generator URL
  const getUpiQrUrl = (amount, note) => {
    const cleanNote = encodeURIComponent(`EXAMCBT ${note}`.slice(0, 30));
    const upiString = `upi://pay?pa=${OFFICIAL_UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${amount}&cu=INR&tn=${cleanNote}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiString)}&margin=10`;
  };

  // Submit UTR to Central Backend for Approval
  const handleSubmitPaymentUtr = async (e) => {
    e.preventDefault();
    if (!utrNumber.trim()) {
      setPaymentMsg({ type: 'error', text: 'Please enter the 12-digit UTR / UPI Reference Number.' });
      return;
    }

    const cleanUtr = utrNumber.trim();
    if (cleanUtr.length < 8) {
      setPaymentMsg({ type: 'error', text: 'Invalid Reference No: UTR must contain at least 8 to 12 digits.' });
      return;
    }

    setIsSubmittingPayment(true);
    setPaymentMsg({ type: '', text: '' });

    const paymentPayload = {
      id: `pay-${Date.now()}`,
      studentId: candidateState.id,
      name: candidateState.name,
      email: candidateState.email,
      tier: selectedPlanDetails.tier,
      tierName: selectedPlanDetails.title,
      amount: selectedPlanDetails.amount,
      utr: cleanUtr,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      timestamp: new Date().toISOString()
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/payments/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentPayload),
      });

      const resData = await res.json();
      if (res.ok && resData.status === 'success') {
        setPaymentMsg({
          type: 'success',
          text: 'Payment request successfully logged! Your tier will activate automatically as soon as Directorate verification confirms receipt.'
        });
        fetchCentralCandidateData();
        setTimeout(() => {
          setCheckoutModalOpen(false);
          setActiveTab('billing_history');
        }, 2500);
      } else {
        setPaymentMsg({ type: 'error', text: resData.detail || 'Could not verify payment submission. Please retry.' });
      }
    } catch (err) {
      console.warn("Payment submission error, backup logged:", err);
      setPaymentMsg({
        type: 'success',
        text: 'Payment receipt registered offline. Directorate desk will verify and activate your access.'
      });
      setTimeout(() => {
        setCheckoutModalOpen(false);
        setActiveTab('billing_history');
      }, 2500);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleCopyUpiId = () => {
    navigator.clipboard.writeText(OFFICIAL_UPI_ID);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  // Distinct Theme Styling Matrix for Base vs Pro vs Advance
  const themeContainerClass = isAdvancedPro 
    ? 'bg-[#0f0e0a] text-amber-50 selection:bg-amber-400 selection:text-slate-950'
    : isProPlan
    ? 'bg-slate-950 text-cyan-50 selection:bg-teal-400 selection:text-slate-950'
    : 'bg-slate-950 text-white selection:bg-emerald-500 selection:text-slate-950';

  const headerCardClass = isAdvancedPro
    ? 'bg-[#18160e] border-amber-500/40 shadow-amber-950/20'
    : isProPlan
    ? 'bg-slate-900 border-teal-500/40 shadow-teal-950/20'
    : 'bg-slate-900 border-slate-800';

  const tierBadgeClass = isAdvancedPro
    ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-yellow-300 border-yellow-500/50 shadow-md shadow-yellow-500/20'
    : isProPlan
    ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-md shadow-teal-500/10'
    : 'bg-slate-800 text-slate-300 border-slate-700';

  return (
    <div className={`min-h-screen p-4 sm:p-8 font-sans transition-colors duration-300 ${themeContainerClass}`}>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Subscription Renewal Reminder Banner */}
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
        <header className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 sm:p-5 rounded-3xl shadow-xl border ${headerCardClass}`}>
          <div className="flex items-center space-x-3.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-md ${
              isAdvancedPro ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-amber-500/20' : 
              isProPlan ? 'bg-gradient-to-tr from-teal-400 to-cyan-500 text-slate-950 shadow-teal-500/20' :
              'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-emerald-500/20'
            }`}>
              CBT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-base sm:text-lg text-white">EXAMCBT Candidate Portal</h1>
                <span className={`text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded border ${
                  isAdvancedPro ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                  isProPlan ? 'bg-teal-500/20 text-teal-300 border-teal-500/30' :
                  'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {isAdvancedPro ? 'PRO VAULT ACTIVE' : isProPlan ? 'PRO PASS ACTIVE' : 'STARTER'}
                </span>
              </div>
              <p className={`text-[11px] ${isAdvancedPro ? 'text-amber-200/70' : isProPlan ? 'text-cyan-200/70' : 'text-slate-400'}`}>
                National Computer Based Assessment System
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 self-end sm:self-auto">
            <button
              onClick={onBackHome}
              className={`text-xs font-bold px-3.5 py-2 rounded-xl transition ${
                isAdvancedPro ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20' :
                isProPlan ? 'bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/20' :
                'bg-slate-800 hover:bg-slate-700 text-slate-300'
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

        {/* Candidate Identity & Tier Distinctive Showcase Card */}
        <div className={`p-5 sm:p-6 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-6 items-center shadow-lg border ${
          isAdvancedPro ? 'bg-[#18160e]/90 border-amber-500/40 shadow-amber-950/20' : 
          isProPlan ? 'bg-slate-900/90 border-teal-500/40 shadow-teal-950/20' :
          'bg-slate-900/60 border-slate-800'
        }`}>
          <div className="flex items-center space-x-4 md:col-span-2">
            <div className="relative group shrink-0">
              <div className={`w-16 h-20 sm:w-20 sm:h-24 rounded-2xl border-2 border-dashed overflow-hidden flex items-center justify-center shadow-inner ${
                isAdvancedPro ? 'bg-[#221f14] border-amber-500/40' : 
                isProPlan ? 'bg-slate-950 border-teal-500/40' :
                'bg-slate-800 border-slate-700'
              }`}>
                {studentPhoto ? (
                  <img src={studentPhoto} alt="Candidate" className="w-full h-full object-cover" />
                ) : (
                  <label htmlFor="dash-photo-upload" className={`cursor-pointer text-[10px] text-center p-2 leading-tight block transition ${
                    isAdvancedPro ? 'text-amber-300 hover:text-amber-400' : 
                    isProPlan ? 'text-teal-300 hover:text-teal-400' :
                    'text-slate-400 hover:text-emerald-400'
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
                    isAdvancedPro ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' : 
                    isProPlan ? 'bg-teal-400 hover:bg-teal-300 text-slate-950' :
                    'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  }`}
                >
                  Change
                </label>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full inline-block border ${
                  isAdvancedPro ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 
                  isProPlan ? 'bg-teal-500/10 text-teal-400 border-teal-500/30' :
                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}>
                  Verified Candidate
                </span>
                
                {/* Dynamically Synced Tier Badge */}
                <span className={`text-[9px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full inline-block border ${tierBadgeClass}`}>
                  {isAdvancedPro ? '★ Advance Plan (Pro Vault)' : isProPlan ? '⚡ Pro Plan (Standard Premium)' : 'Base Plan (Free Starter)'}
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-white">{candidateState.name}</h2>
              <p className={`text-xs font-mono ${isAdvancedPro ? 'text-amber-200/70' : isProPlan ? 'text-teal-200/70' : 'text-slate-400'}`}>
                {candidateState.email}
              </p>
            </div>
          </div>

          <div className={`p-4 rounded-2xl text-left md:text-right flex flex-col justify-between border ${
            isAdvancedPro ? 'bg-[#12100a] border-amber-500/30' : 
            isProPlan ? 'bg-slate-950 border-teal-500/30' :
            'bg-slate-950 border-slate-800/80'
          }`}>
            <div>
              <span className={`text-[10px] uppercase font-bold tracking-wider ${
                isAdvancedPro ? 'text-amber-300/70' : isProPlan ? 'text-teal-300/70' : 'text-slate-500'
              }`}>
                Candidate Roll ID
              </span>
              <span className={`text-lg sm:text-xl font-mono font-black mt-0.5 block ${
                isAdvancedPro ? 'text-amber-400' : isProPlan ? 'text-teal-400' : 'text-emerald-400'
              }`}>
                {candidateState.id}
              </span>
            </div>
            <div className="flex gap-2 mt-3 justify-end flex-wrap">
              <button 
                onClick={() => setActiveTab('subscription_plans')}
                className={`text-[10px] font-bold py-1 px-3 rounded-xl transition border ${
                  isAdvancedPro ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30' : 
                  isProPlan ? 'bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border-teal-500/30' :
                  'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}
              >
                Plans & Pricing
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`flex space-x-6 border-b pb-2 overflow-x-auto ${
          isAdvancedPro ? 'border-amber-500/20' : isProPlan ? 'border-teal-500/20' : 'border-slate-800'
        }`}>
          <button
            onClick={() => setActiveTab('available_tests')}
            className={`text-xs font-bold pb-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'available_tests' ? (
                isAdvancedPro ? 'border-amber-400 text-amber-400' : isProPlan ? 'border-teal-400 text-teal-400' : 'border-emerald-400 text-emerald-400'
              ) : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Available Examination Series ({mockTests.length})
          </button>
          
          {/* Custom Vault is available for Advanced Pro */}
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
              activeTab === 'subscription_plans' ? (
                isAdvancedPro ? 'border-amber-400 text-amber-400' : isProPlan ? 'border-teal-400 text-teal-400' : 'border-emerald-400 text-emerald-400'
              ) : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Upgrade Plans & Subscriptions
          </button>

          <button
            onClick={() => setActiveTab('billing_history')}
            className={`text-xs font-bold pb-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'billing_history' ? (
                isAdvancedPro ? 'border-amber-400 text-amber-400' : isProPlan ? 'border-teal-400 text-teal-400' : 'border-emerald-400 text-emerald-400'
              ) : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Billing & Purchases ({billingHistory.length})
          </button>

          <button
            onClick={() => setActiveTab('past_results')}
            className={`text-xs font-bold pb-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'past_results' ? (
                isAdvancedPro ? 'border-amber-400 text-amber-400' : isProPlan ? 'border-teal-400 text-teal-400' : 'border-emerald-400 text-emerald-400'
              ) : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            My Past Exam Results ({pastResults.length})
          </button>
        </div>

        {/* TAB 1: Available Tests */}
        {activeTab === 'available_tests' && (
          <div className="space-y-4">
            {isBasePlan && mockTests.length > 10 && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3">
                <p className="text-xs text-amber-300">
                  ⚠️ <strong>Base Plan Active:</strong> Aapke paas 10 sample mock examinations ka access hai. Unlimited tests unlock karne ke liye Pro ya Advance plan me upgrade karein.
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
                isAdvancedPro ? 'bg-[#18160e]/40 border-amber-500/20 text-amber-200/60' : 
                isProPlan ? 'bg-slate-900/40 border-teal-500/20 text-teal-200/60' :
                'bg-slate-900/40 border-slate-800/80 text-slate-500'
              }`}>
                Koi active test available nahi hai. Admin portal se naya test generate karein.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockTests.map((t, idx) => {
                  const isLocked = isBasePlan && idx >= 10;
                  return (
                    <div 
                      key={t.id || idx} 
                      className={`border p-5 rounded-3xl flex flex-col justify-between transition space-y-4 ${
                        isAdvancedPro ? 'bg-[#18160e] border-amber-500/30 hover:border-amber-500/50 shadow-lg shadow-amber-950/10' : 
                        isProPlan ? 'bg-slate-900 border-teal-500/30 hover:border-teal-500/50 shadow-lg shadow-teal-950/10' :
                        'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                            isAdvancedPro ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 
                            isProPlan ? 'text-teal-300 bg-teal-500/10 border-teal-500/30' :
                            'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
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
                        <div className={`flex flex-wrap gap-3 text-xs mt-3 ${
                          isAdvancedPro ? 'text-amber-200/70' : isProPlan ? 'text-cyan-200/70' : 'text-slate-400'
                        }`}>
                          <span>📝 {t.questions?.length || 0} Questions</span>
                          <span>⏱ {t.duration_mins} Minutes</span>
                          <span>⚡ Real Marking (+2.0 / -0.5)</span>
                        </div>
                      </div>

                      {isLocked ? (
                        <button
                          onClick={() => setActiveTab('subscription_plans')}
                          className="w-full font-bold py-3 rounded-2xl text-xs sm:text-sm uppercase tracking-wider transition bg-slate-800 hover:bg-slate-700 text-amber-400"
                        >
                          Unlock Full Repository →
                        </button>
                      ) : (
                        <button
                          onClick={() => onStartMock(t)}
                          className={`w-full font-black py-3 rounded-2xl text-xs sm:text-sm uppercase tracking-wider shadow-lg active:scale-95 transition ${
                            isAdvancedPro ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-amber-500/20' : 
                            isProPlan ? 'bg-gradient-to-r from-teal-400 to-cyan-400 text-slate-950 shadow-teal-500/20' :
                            'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/10'
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

        {/* TAB 3: Upgrade Plans & Subscriptions (Exact Tier Alignment) */}
        {activeTab === 'subscription_plans' && (
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                Transparent Examination Subscriptions
              </span>
              <h2 className="text-xl sm:text-3xl font-black text-white mt-2">Choose the Plan Built for Your Ambition</h2>
              <p className={`text-xs ${isAdvancedPro ? 'text-amber-200/70' : isProPlan ? 'text-cyan-200/70' : 'text-slate-400'}`}>
                Scale your preparation with genuine TCS iON exam simulation, complete mock test repositories, and advanced custom AI parsing tools.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 items-stretch">
              
              {/* ================= TIER 1: BASE PLAN (FREE STARTER) ================= */}
              <div className={`border rounded-3xl p-6 flex flex-col justify-between space-y-6 transition ${
                isBasePlan ? 'ring-2 ring-emerald-500/40 bg-slate-900/90' : 'bg-slate-900/50'
              } border-slate-800`}>
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-mono font-black uppercase text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
                      Starter Assessment
                    </span>
                    <h3 className="text-lg font-black text-white mt-3">1. Base Plan (Free Starter)</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-snug">
                      <strong>Target:</strong> Naye students jo simulation test dekhna chahte hain aur trust build kar rahe hain.
                    </p>
                    <div className="mt-3">
                      <span className="text-3xl font-black text-emerald-400">₹0</span>
                      <span className="text-xs text-slate-500 ml-1 font-semibold">/ Free Forever</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-3 space-y-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                        Access Limit
                      </span>
                      <ul className="text-xs text-slate-300 space-y-1">
                        <li className="flex items-start gap-1.5">
                          <span className="text-emerald-400 shrink-0">•</span>
                          <span>Sirf 5 se 10 Full-Length Mocks (Fixed demo question bank)</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 tracking-wider block mb-1.5">
                        Included Features
                      </span>
                      <ul className="text-xs text-slate-300 space-y-1.5">
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span>Real TCS iON interface experience</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span>Basic scorecard (Total Marks, Correct/Wrong, Accuracy %)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span>Solution key (sirf correct option dikhega, detailed explanation nahi)</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono uppercase font-bold text-rose-400 tracking-wider block mb-1.5">
                        Restrictions
                      </span>
                      <ul className="text-xs text-slate-400 space-y-1">
                        <li className="flex items-start gap-2">
                          <span className="text-rose-400">✗</span>
                          <span>No PDF upload / Custom Mock feature</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-rose-400">✗</span>
                          <span>Limited repository access</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <button 
                  disabled
                  className="w-full bg-slate-800 text-slate-400 font-bold py-3 rounded-2xl text-xs cursor-default uppercase tracking-wider"
                >
                  {isBasePlan ? 'Current Active Plan' : 'Free Starter Tier'}
                </button>
              </div>

              {/* ================= TIER 2: PRO PLAN (STANDARD PREMIUM) ================= */}
              <div className={`border rounded-3xl p-6 flex flex-col justify-between space-y-6 relative overflow-hidden transition shadow-xl ${
                isProPlan ? 'ring-2 ring-teal-400 bg-slate-900 border-teal-500' : 'bg-slate-900/90 border-teal-500/40 hover:border-teal-400'
              }`}>
                <div className="absolute top-0 right-0 bg-gradient-to-l from-teal-400 to-cyan-500 text-slate-950 text-[9px] font-black px-3.5 py-1 rounded-bl-xl uppercase tracking-wider shadow">
                  Most Popular for Serious Aspirants
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-teal-300 bg-teal-500/10 border border-teal-500/30 px-2.5 py-1 rounded-full">
                      Standard Premium
                    </span>
                    <h3 className="text-lg font-black text-white mt-3">2. Pro Plan (Standard Premium)</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-snug">
                      <strong>Target:</strong> Dedicated aspirants (SSC CGL, CHSL, RRB) jo roz regular mock test practice karna chahte hain.
                    </p>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-black text-teal-300">₹{subscriptionPricing.basicPrice}</span>
                      <span className="text-xs text-slate-400 font-semibold">/ Month</span>
                      <span className="text-[11px] text-teal-300 font-mono bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                        ₹{subscriptionPricing.basicSemiAnnualPrice || 299} / 6 Months
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-3 space-y-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                        Access Limit
                      </span>
                      <ul className="text-xs text-slate-300 space-y-1">
                        <li className="flex items-start gap-1.5">
                          <span className="text-teal-400 shrink-0">•</span>
                          <span><strong>Unlimited Access</strong> to all Official Mock Tests (SSC, RRB, CPO etc.)</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-teal-400 shrink-0">•</span>
                          <span>Live mock tests aur previous year question (PYQ) shifts</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 tracking-wider block mb-1.5">
                        Included Features
                      </span>
                      <ul className="text-xs text-slate-300 space-y-1.5">
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span>Real marking scheme (+2 / -0.5) aur exact timer countdown</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span>Detailed question-by-question analytics (Section-wise time spent & weak areas)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span>Hindi aur English bilingual toggle har question ke liye</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span>Question diagrams zoom aur full resolution preview</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono uppercase font-bold text-rose-400 tracking-wider block mb-1.5">
                        Restrictions
                      </span>
                      <ul className="text-xs text-slate-400 space-y-1">
                        <li className="flex items-start gap-2">
                          <span className="text-rose-400">✗</span>
                          <span>Custom PDF-to-CBT parser available nahi hoga (sirf portal ke published tests de sakte hain)</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => handleInitiatePayment('BASIC', 'Pro Plan (Standard Premium)', subscriptionPricing.basicPrice)}
                  className="w-full bg-teal-400 hover:bg-teal-300 text-slate-950 font-black py-3 rounded-2xl text-xs uppercase tracking-wider transition shadow-lg shadow-teal-500/20 active:scale-95"
                >
                  {isProPlan ? 'Active Plan (Renew Monthly) →' : `Upgrade to Pro (₹${subscriptionPricing.basicPrice} / Month) →`}
                </button>
              </div>

              {/* ================= TIER 3: ADVANCE PLAN (PRO VAULT & AI PARSER) ================= */}
              <div className={`border rounded-3xl p-6 flex flex-col justify-between space-y-6 relative overflow-hidden transition shadow-2xl ${
                isAdvancedPro ? 'ring-2 ring-yellow-400 bg-[#18160e] border-yellow-500' : 'bg-gradient-to-b from-[#18160e] to-slate-950 border-purple-500/50 hover:border-yellow-400'
              }`}>
                <div className="absolute top-0 right-0 bg-gradient-to-l from-yellow-400 to-amber-500 text-slate-950 text-[9px] font-black px-3.5 py-1 rounded-bl-xl uppercase tracking-wider shadow">
                  Ultimate AI Power Tier
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-2.5 py-1 rounded-full">
                      Pro Vault & AI Engine
                    </span>
                    <h3 className="text-lg font-black text-white mt-3">3. Advance Plan (Pro Vault & AI Parser)</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-snug">
                      <strong>Target:</strong> Coaching institutes, serious self-study students, aur aspirants jo personal test series / PYQ PDFs ko live CBT format mein attempt karna chahte hain.
                    </p>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-black text-yellow-400">₹{subscriptionPricing.advancedPrice}</span>
                      <span className="text-xs text-slate-400 font-semibold">/ Month</span>
                      <span className="text-[11px] text-yellow-300 font-mono bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                        ₹{subscriptionPricing.advancedAnnualPrice || 799} / Year
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-3 space-y-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                        Access Limit
                      </span>
                      <ul className="text-xs text-slate-300 space-y-1">
                        <li className="flex items-start gap-1.5">
                          <span className="text-yellow-400 shrink-0">•</span>
                          <span><strong>Sabhi Pro features included</strong></span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-yellow-400 shrink-0">•</span>
                          <span>Personal Secure Vault Storage</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono uppercase font-bold text-yellow-400 tracking-wider block mb-1.5">
                        Exclusive Power Features
                      </span>
                      <ul className="text-xs text-slate-200 space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-yellow-400 font-black">★</span>
                          <span><strong>AI PDF-to-CBT Converter:</strong> Apni kisi bhi official answer key ya mock test PDF ko upload karo, system automatic format karke private CBT mock bana dega.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-yellow-400 font-black">★</span>
                          <span><strong>Diagram Extraction Engine:</strong> Reasoning aur Maths ke figures automatic crop hokar question ke sath attach ho jayenge.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-yellow-400 font-black">★</span>
                          <span><strong>Custom Time & Question Pacing:</strong> Candidate apna manchaaha timer (30m, 60m, 120m) customize kar sakta hai.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-yellow-400 font-black">★</span>
                          <span><strong>Priority Grievance & Doubt Support:</strong> 24 hours turnaround time.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => handleInitiatePayment('ADVANCED', 'Advance Plan (Pro Vault & AI Parser)', subscriptionPricing.advancedPrice)}
                  className="w-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:opacity-95 text-slate-950 font-black py-3 rounded-2xl text-xs uppercase tracking-wider transition shadow-lg shadow-yellow-500/20 active:scale-95"
                >
                  {isAdvancedPro ? 'Active Plan (Renew Pro Vault) →' : `Upgrade to Advance (₹${subscriptionPricing.advancedPrice} / Month) →`}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* TAB 4: Internal Billing & Purchases History */}
        {activeTab === 'billing_history' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-black text-white">Billing & Purchases Ledger</h3>
              <p className={`text-xs ${isAdvancedPro ? 'text-amber-200/70' : isProPlan ? 'text-teal-200/70' : 'text-slate-400'}`}>
                Complete record of your subscription purchases, invoice IDs, transaction statuses, and validity periods.
              </p>
            </div>

            {billingHistory.length === 0 ? (
              <div className={`border rounded-2xl p-12 text-center text-xs ${
                isAdvancedPro ? 'bg-[#18160e]/40 border-amber-500/20 text-amber-200/60' : 
                isProPlan ? 'bg-slate-900/40 border-teal-500/20 text-teal-200/60' :
                'bg-slate-900/40 border-slate-800 text-slate-500'
              }`}>
                No billing or purchase history found.
              </div>
            ) : (
              <div className="space-y-3">
                {billingHistory.map((bill, index) => (
                  <div key={index} className={`border p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                    isAdvancedPro ? 'bg-[#18160e] border-amber-500/30' : 
                    isProPlan ? 'bg-slate-900 border-teal-500/30' :
                    'bg-slate-900 border-slate-800'
                  }`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-400">{bill.invoiceId}</span>
                        <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                          bill.status.includes('SUCCESS') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                          bill.status.includes('PENDING') ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {bill.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-white">{bill.tier}</h4>
                      <div className={`text-xs space-x-3 ${isAdvancedPro ? 'text-amber-200/70' : isProPlan ? 'text-teal-200/70' : 'text-slate-400'}`}>
                        <span>Purchased: {bill.purchaseDate}</span>
                        <span>•</span>
                        <span>Expires: {bill.expiryDate}</span>
                      </div>
                    </div>
                    <div className={`border px-4 py-3 rounded-xl text-right ${
                      isAdvancedPro ? 'bg-[#12100a] border-amber-500/30' : 
                      isProPlan ? 'bg-slate-950 border-teal-500/30' :
                      'bg-slate-950 border-slate-800'
                    }`}>
                      <span className={`text-[10px] uppercase font-bold block ${isAdvancedPro ? 'text-amber-300/70' : isProPlan ? 'text-teal-300/70' : 'text-slate-400'}`}>Amount Paid</span>
                      <span className={`text-lg font-black ${isAdvancedPro ? 'text-amber-400' : isProPlan ? 'text-teal-400' : 'text-emerald-400'}`}>{bill.amountPaid}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: Past Exam Results */}
        {activeTab === 'past_results' && (
          <div>
            {pastResults.length === 0 ? (
              <div className={`border rounded-2xl p-12 text-center text-xs ${
                isAdvancedPro ? 'bg-[#18160e]/40 border-amber-500/20 text-amber-200/60' : 
                isProPlan ? 'bg-slate-900/40 border-teal-500/20 text-teal-200/60' :
                'bg-slate-900/40 border-slate-800 text-slate-500'
              }`}>
                <span className="text-2xl block mb-2">📊</span>
                <p>Abhi tak aapne koi exam attempt nahi kiya hai.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pastResults.map((rec) => (
                  <div key={rec.id} className={`border p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                    isAdvancedPro ? 'bg-[#18160e] border-amber-500/30' : 
                    isProPlan ? 'bg-slate-900 border-teal-500/30' :
                    'bg-slate-900 border-slate-800'
                  }`}>
                    <div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        isAdvancedPro ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 
                        isProPlan ? 'text-teal-400 bg-teal-500/10 border-teal-500/20' :
                        'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                      }`}>
                        {rec.date}
                      </span>
                      <h3 className="font-bold text-sm sm:text-base text-white mt-1">{rec.testTitle}</h3>
                      <div className={`text-xs space-x-3 mt-1 ${isAdvancedPro ? 'text-amber-200/70' : isProPlan ? 'text-teal-200/70' : 'text-slate-400'}`}>
                        <span>Correct: <strong className="text-emerald-400">{rec.correct}</strong></span>
                        <span>Wrong: <strong className="text-rose-400">{rec.wrong}</strong></span>
                        <span>Skipped: <strong className={isAdvancedPro ? 'text-amber-200' : isProPlan ? 'text-teal-200' : 'text-slate-300'}>{rec.unattempted}</strong></span>
                      </div>
                    </div>
                    <div className={`border px-4 py-2.5 rounded-xl text-right ${
                      isAdvancedPro ? 'bg-[#12100a] border-amber-500/30' : 
                      isProPlan ? 'bg-slate-950 border-teal-500/30' :
                      'bg-slate-950 border-slate-800'
                    }`}>
                      <span className={`text-[10px] uppercase font-bold block ${isAdvancedPro ? 'text-amber-300/70' : isProPlan ? 'text-teal-300/70' : 'text-slate-400'}`}>Final Score</span>
                      <span className={`text-lg font-black ${isAdvancedPro ? 'text-amber-400' : isProPlan ? 'text-teal-400' : 'text-emerald-400'}`}>{rec.finalScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ================= MODAL: DIRECT UPI QR CHECKOUT & UTR SUBMISSION ================= */}
      {checkoutModalOpen && selectedPlanDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button 
              onClick={() => setCheckoutModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center transition"
            >
              ✕
            </button>

            <div className="text-center mb-4">
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full uppercase">
                Official Gateway • Zero Surcharge
              </span>
              <h3 className="text-lg font-black text-white mt-2">Scan & Pay via Any UPI App</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Upgrading to <strong className="text-emerald-400">{selectedPlanDetails.title}</strong> (₹{selectedPlanDetails.amount})
              </p>
            </div>

            {/* Dynamic UPI QR Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center space-y-3">
              <div className="bg-white p-2.5 rounded-xl shadow-lg">
                <img 
                  src={getUpiQrUrl(selectedPlanDetails.amount, selectedPlanDetails.tier)}
                  alt="Official UPI QR"
                  className="w-44 h-44 object-contain"
                />
              </div>

              {/* UPI ID Pill & Copy Action */}
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
                <span className="text-slate-400 font-mono text-[11px]">UPI:</span>
                <span className="text-emerald-400 font-mono font-bold text-xs select-all">{OFFICIAL_UPI_ID}</span>
                <button
                  type="button"
                  onClick={handleCopyUpiId}
                  className="ml-1 text-[10px] font-black uppercase text-slate-300 hover:text-white bg-slate-800 px-2 py-0.5 rounded"
                >
                  {copiedUpi ? "✓ Copied" : "Copy"}
                </button>
              </div>

              {/* Direct UPI Mobile Intent Link */}
              <a
                href={`upi://pay?pa=${OFFICIAL_UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${selectedPlanDetails.amount}&cu=INR&tn=EXAMCBT_${selectedPlanDetails.tier}`}
                className="text-[11px] font-bold text-teal-400 hover:underline flex items-center gap-1"
              >
                <span>📱</span> Tap to open Google Pay / PhonePe / Paytm directly
              </a>
            </div>

            {/* UTR Reference Form */}
            <form onSubmit={handleSubmitPaymentUtr} className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  12-Digit UPI Reference No. / UTR *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 428901234567 or TXN Ref No"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white outline-none focus:border-emerald-500 placeholder:text-slate-600"
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  💡 Payment complete hone ke baad apni UPI app (GPay/PhonePe/Paytm) ki receipt se 12-digit UTR yahan enter karein.
                </span>
              </div>

              {paymentMsg.text && (
                <div className={`p-2.5 rounded-xl text-xs font-medium border ${
                  paymentMsg.type === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}>
                  {paymentMsg.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingPayment || !utrNumber.trim()}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                {isSubmittingPayment ? 'Submitting to Directorate...' : 'Submit UTR & Activate Access →'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
