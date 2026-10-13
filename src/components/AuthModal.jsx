import React, { useState } from 'react';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'https://examcbt-backend.onrender.com').replace(/\/$/, "");

export default function AuthModal({ onClose, onStudentLogin, onAdminLogin }) {
  const [roleTab, setRoleTab] = useState('candidate');
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [isForgotView, setIsForgotView] = useState(false);
  
  // Registration & Login Fields
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidatePhone, setCandidatePhone] = useState('');
  const [candidatePassword, setCandidatePassword] = useState('');
  
  // Login specific identifier (Email OR Phone) & Password
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Forgot Password / Two-Factor Recovery Fields
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [isIdentityVerified, setIsIdentityVerified] = useState(false);
  const [matchedCandidate, setMatchedCandidate] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoverySuccessMsg, setRecoverySuccessMsg] = useState('');

  // Admin fields
  const [adminUsername, setAdminUsername] = useState('');
  const [adminKey, setAdminKey] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');

  // Password Strength Evaluator Logic
  const evaluatePasswordStrength = (pwd) => {
    if (!pwd) return { label: 'None', color: 'bg-slate-800', score: 0 };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2 || pwd.length < 8) {
      return { label: 'Weak', color: 'bg-rose-500', score: 1 };
    } else if (score === 3) {
      return { label: 'Medium', color: 'bg-amber-500', score: 2 };
    } else {
      return { label: 'Strong', color: 'bg-emerald-500', score: 3 };
    }
  };

  const pwdStrength = evaluatePasswordStrength(candidatePassword);
  const newPwdStrength = evaluatePasswordStrength(newPassword);

  const handleCandidateSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const savedStudents = JSON.parse(localStorage.getItem('cbt_students') || '[]');

    if (isExistingUser) {
      // Login Flexibility: Email OR Phone + Password
      if (!loginIdentifier.trim() || !loginPassword.trim()) {
        setErrorMsg("Please enter your registered Email/Phone and Password.");
        return;
      }

      const cleanInput = loginIdentifier.trim().toLowerCase();
      const existing = savedStudents.find(s => 
        (s.email && s.email.toLowerCase() === cleanInput) || 
        (s.phone && s.phone === cleanInput) ||
        (s.id && s.id.toLowerCase() === cleanInput)
      );

      if (existing) {
        if (existing.password && existing.password !== loginPassword) {
          setErrorMsg("Authentication Failed: Incorrect password entered.");
          return;
        }
        onStudentLogin(existing);
      } else {
        setErrorMsg("No candidate account found matching this Email, Phone, or Roll ID.");
      }
    } else {
      // Registration: Require both Email & Phone, and Strict Password Strength Gate
      if (!candidateName.trim() || !candidateEmail.trim() || !candidatePhone.trim() || !candidatePassword) {
        setErrorMsg("All registration fields including Email, Phone and Password are mandatory.");
        return;
      }

      if (pwdStrength.label === 'Weak') {
        setErrorMsg("Weak Password Rejected: Please create a Medium or Strong password adhering to security guidelines.");
        return;
      }

      const generatedRoll = `CBT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      
      const newStudent = {
        id: generatedRoll,
        name: candidateName.trim(),
        email: candidateEmail.trim(),
        phone: candidatePhone.trim(),
        password: candidatePassword,
        tier: "FREE",
        createdAt: new Date().toLocaleDateString('en-IN')
      };

      // 1. Local Cache
      savedStudents.unshift(newStudent);
      localStorage.setItem('cbt_students', JSON.stringify(savedStudents));

      // 2. Central Backend Sync
      try {
        await fetch(`${API_BASE_URL}/api/students/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newStudent),
        });
      } catch (err) {
        console.warn("Backend student sync offline fallback:", err);
      }

      onStudentLogin(newStudent);
    }
  };

  // Two-Factor Verification Step
  const handleVerifyCandidateIdentity = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!recoveryIdentifier.trim() || !recoveryPhone.trim()) {
      setErrorMsg("Please enter both Registered Identifier and Phone Number.");
      return;
    }

    const savedStudents = JSON.parse(localStorage.getItem('cbt_students') || '[]');
    const cleanIdent = recoveryIdentifier.trim().toLowerCase();
    const cleanPhone = recoveryPhone.trim();

    const matched = savedStudents.find(s => 
      ((s.email && s.email.toLowerCase() === cleanIdent) || 
       (s.id && s.id.toLowerCase() === cleanIdent) ||
       (s.phone && s.phone === cleanIdent)) &&
      (s.phone && s.phone === cleanPhone)
    );

    if (matched) {
      setMatchedCandidate(matched);
      setIsIdentityVerified(true);
      setErrorMsg('');
    } else {
      setErrorMsg("Two-Factor Verification Failed: Provided credentials do not match our registered records.");
    }
  };

  // Set New Password Step
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newPassword || !confirmPassword) {
      setErrorMsg("Please provide and confirm your new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Password Mismatch: Both password fields must be identical.");
      return;
    }

    if (newPwdStrength.label === 'Weak') {
      setErrorMsg("Security Policy: New password must be Medium or Strong.");
      return;
    }

    const savedStudents = JSON.parse(localStorage.getItem('cbt_students') || '[]');
    const updatedList = savedStudents.map(s => {
      if (s.id === matchedCandidate.id) {
        return { ...s, password: newPassword };
      }
      return s;
    });

    localStorage.setItem('cbt_students', JSON.stringify(updatedList));

    // Sync to backend register endpoint to update password centrally
    try {
      const updatedRecord = { ...matchedCandidate, password: newPassword };
      await fetch(`${API_BASE_URL}/api/students/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRecord),
      });
    } catch (err) {
      console.warn("Backend password update offline fallback:", err);
    }

    setRecoverySuccessMsg("Password successfully reset! You can now log in with your updated credentials.");
    setTimeout(() => {
      setIsForgotView(false);
      setIsIdentityVerified(false);
      setIsExistingUser(true);
      setRecoverySuccessMsg('');
      setLoginPassword('');
    }, 2000);
  };

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    if (adminUsername.trim() === 'EXAM-DIRECTOR' && adminKey.trim() === 'CBT@Secure#2026') {
      onAdminLogin();
    } else {
      setErrorMsg("Access Denied: Invalid Security Clearance ID or Key.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-800 transition"
        >
          ✕
        </button>

        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => { setRoleTab('candidate'); setErrorMsg(''); setIsForgotView(false); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${roleTab === 'candidate' ? 'bg-emerald-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            🎓 Candidate Portal
          </button>
          <button
            type="button"
            onClick={() => { setRoleTab('admin'); setErrorMsg(''); setIsForgotView(false); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${roleTab === 'admin' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            🛡️ Directorate Console
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl font-medium">
            {errorMsg}
          </div>
        )}

        {recoverySuccessMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl font-medium">
            ✓ {recoverySuccessMsg}
          </div>
        )}

        {roleTab === 'candidate' ? (
          <div className="space-y-4">
            {isForgotView ? (
              /* Two-Factor Forgot Password View */
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-2">
                  <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Candidate Identity Verification
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1">Reset Password via Two-Factor Security</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Government standard verification matching registered identification records.</p>
                </div>

                {!isIdentityVerified ? (
                  <form onSubmit={handleVerifyCandidateIdentity} className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Registered Email or Roll ID *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. candidate@example.com or CBT-2026-..."
                        value={recoveryIdentifier}
                        onChange={(e) => setRecoveryIdentifier(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Registered 10-Digit Mobile Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9876543210"
                        value={recoveryPhone}
                        onChange={(e) => setRecoveryPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl text-xs uppercase tracking-wider transition active:scale-95 shadow-md shadow-amber-500/10"
                    >
                      Verify Identity & Proceed →
                    </button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => { setIsForgotView(false); setErrorMsg(''); }}
                        className="text-xs text-slate-400 hover:text-white underline underline-offset-4"
                      >
                        ← Back to Candidate Login
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-3">
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300">
                      Identity Confirmed for: <span className="font-bold text-white">{matchedCandidate?.name}</span> ({matchedCandidate?.id})
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">New Secure Password *</label>
                      <input
                        type="password"
                        required
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-emerald-500"
                      />

                      {/* Password Strength Meter */}
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400">Strength:</span>
                          <span className={`font-bold uppercase ${
                            newPwdStrength.label === 'Strong' ? 'text-emerald-400' :
                            newPwdStrength.label === 'Medium' ? 'text-amber-400' : 'text-rose-400'
                          }`}>
                            {newPwdStrength.label}
                          </span>
                        </div>
                        <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden flex gap-1">
                          <div className={`h-full flex-1 ${newPwdStrength.score >= 1 ? newPwdStrength.color : 'bg-slate-800'}`}></div>
                          <div className={`h-full flex-1 ${newPwdStrength.score >= 2 ? newPwdStrength.color : 'bg-slate-800'}`}></div>
                          <div className={`h-full flex-1 ${newPwdStrength.score >= 3 ? newPwdStrength.color : 'bg-slate-800'}`}></div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Confirm New Password *</label>
                      <input
                        type="password"
                        required
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={newPwdStrength.label === 'Weak'}
                      className={`w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition ${
                        newPwdStrength.label === 'Weak'
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 active:scale-95 shadow-md shadow-emerald-500/10'
                      }`}
                    >
                      Update & Save Password →
                    </button>
                  </form>
                )}
              </div>
            ) : (
              /* Normal Login & Registration View */
              <>
                <div className="flex border-b border-slate-800 pb-2 text-xs font-semibold justify-around">
                  <button
                    type="button"
                    onClick={() => { setIsExistingUser(false); setErrorMsg(''); }}
                    className={`pb-1 ${!isExistingUser ? 'text-emerald-400 border-b-2 border-emerald-400 font-bold' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    + New Candidate Registration
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsExistingUser(true); setErrorMsg(''); }}
                    className={`pb-1 ${isExistingUser ? 'text-emerald-400 border-b-2 border-emerald-400 font-bold' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    🔑 Candidate Login
                  </button>
                </div>

                <form onSubmit={handleCandidateSubmit} className="space-y-3">
                  {isExistingUser ? (
                    <>
                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">Email Address OR Phone Number *</label>
                        <input
                          type="text"
                          required
                          placeholder="Enter registered email or phone"
                          value={loginIdentifier}
                          onChange={(e) => setLoginIdentifier(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-bold text-slate-300">Password *</label>
                          <button
                            type="button"
                            onClick={() => { setIsForgotView(true); setErrorMsg(''); }}
                            className="text-[11px] text-amber-400 hover:underline"
                          >
                            Forgot Credentials?
                          </button>
                        </div>
                        <input
                          type="password"
                          required
                          placeholder="Enter your password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">Candidate Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="Enter Official Candidate Name"
                          value={candidateName}
                          onChange={(e) => setCandidateName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">Email Address (Mandatory) *</label>
                        <input
                          type="email"
                          required
                          placeholder="aspirant@domain.com"
                          value={candidateEmail}
                          onChange={(e) => setCandidateEmail(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">Phone Number (Mandatory) *</label>
                        <input
                          type="tel"
                          required
                          placeholder="10-digit mobile number"
                          value={candidatePhone}
                          onChange={(e) => setCandidatePhone(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">Secure Password *</label>
                        <input
                          type="password"
                          required
                          placeholder="Create secure password"
                          value={candidatePassword}
                          onChange={(e) => setCandidatePassword(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                        />
                        
                        {/* Password Strength Meter & Guidelines */}
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-400">Password Strength:</span>
                            <span className={`font-bold uppercase ${
                              pwdStrength.label === 'Strong' ? 'text-emerald-400' :
                              pwdStrength.label === 'Medium' ? 'text-amber-400' : 'text-rose-400'
                            }`}>
                              {pwdStrength.label}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden flex gap-1">
                            <div className={`h-full flex-1 transition-all ${pwdStrength.score >= 1 ? pwdStrength.color : 'bg-slate-800'}`}></div>
                            <div className={`h-full flex-1 transition-all ${pwdStrength.score >= 2 ? pwdStrength.color : 'bg-slate-800'}`}></div>
                            <div className={`h-full flex-1 transition-all ${pwdStrength.score >= 3 ? pwdStrength.color : 'bg-slate-800'}`}></div>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-tight pt-1">
                            Guidelines: Minimum 8 characters, include uppercase letters, numbers & special symbols. (Weak passwords are strictly rejected).
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={!isExistingUser && pwdStrength.label === 'Weak'}
                    className={`w-full font-black py-3 rounded-xl text-xs sm:text-sm uppercase tracking-wider transition shadow-lg ${
                      !isExistingUser && pwdStrength.label === 'Weak' 
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none' 
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/10 active:scale-95'
                    }`}
                  >
                    {isExistingUser ? 'Login & Access Examination Room →' : 'Complete Registration & Enter →'}
                  </button>
                </form>
              </>
            )}
          </div>
        ) : (
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Directorate Authority ID</label>
              <input
                type="text"
                required
                placeholder="Security ID"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Authorization Security Key</label>
              <input
                type="password"
                required
                placeholder="Security Passkey"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-amber-500/10 active:scale-95 transition"
            >
              Authenticate Control Center →
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
