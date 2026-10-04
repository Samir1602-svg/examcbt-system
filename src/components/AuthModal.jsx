import React, { useState } from 'react';

export default function AuthModal({ onClose, onStudentLogin, onAdminLogin }) {
  const [roleTab, setRoleTab] = useState('candidate'); // 'candidate' | 'admin'
  const [isExistingUser, setIsExistingUser] = useState(false); // Existing Roll Login vs New Registration
  
  const [candidateName, setCandidateName] = useState('');
  const [candidateRoll, setCandidateRoll] = useState('');
  
  const [adminUsername, setAdminUsername] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Handle Candidate Authentication
  const handleCandidateSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const savedStudents = JSON.parse(localStorage.getItem('cbt_students') || '[]');

    if (isExistingUser) {
      // Login with Existing Roll ID
      if (!candidateRoll.trim()) {
        setErrorMsg("Kripya apna Roll Number (e.g. CBT-2026-XXXX) enter karein!");
        return;
      }

      const cleanRoll = candidateRoll.trim().toUpperCase();
      const existing = savedStudents.find(s => s.id.toUpperCase() === cleanRoll);

      if (existing) {
        onStudentLogin(existing);
      } else {
        setErrorMsg(`Roll Number "${cleanRoll}" nahi mila! Kripya sahi Roll No enter karein ya 'New Registration' karein.`);
      }
    } else {
      // New Candidate Registration
      if (!candidateName.trim()) {
        setErrorMsg("Kripya Candidate ka poora naam enter karein!");
        return;
      }

      const generatedRoll = candidateRoll.trim() ? candidateRoll.trim().toUpperCase() : `CBT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      
      const newStudent = {
        id: generatedRoll,
        name: candidateName.trim(),
        email: `${candidateName.trim().toLowerCase().replace(/\s+/g, '.')}.${Math.floor(100 + Math.random() * 900)}@assessment.gov.in`,
        createdAt: new Date().toLocaleDateString('en-IN')
      };

      // Save to database/roster
      savedStudents.unshift(newStudent);
      localStorage.setItem('cbt_students', JSON.stringify(savedStudents));

      onStudentLogin(newStudent);
    }
  };

  // Handle Admin Authentication
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

        {/* Tab Selection */}
        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 mb-6">
          <button
            onClick={() => { setRoleTab('candidate'); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${roleTab === 'candidate' ? 'bg-emerald-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            🎓 Candidate Desk
          </button>
          <button
            onClick={() => { setRoleTab('admin'); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${roleTab === 'admin' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            🛡️ Assessment Director
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl font-medium">
            {errorMsg}
          </div>
        )}

        {/* Candidate Section */}
        {roleTab === 'candidate' ? (
          <div className="space-y-4">
            {/* Toggle Existing vs New Candidate */}
            <div className="flex border-b border-slate-800 pb-2 text-xs font-semibold justify-around">
              <button
                type="button"
                onClick={() => { setIsExistingUser(false); setErrorMsg(''); }}
                className={`pb-1 ${!isExistingUser ? 'text-emerald-400 border-b-2 border-emerald-400 font-bold' : 'text-slate-500 hover:text-slate-300'}`}
              >
                + New Registration
              </button>
              <button
                type="button"
                onClick={() => { setIsExistingUser(true); setErrorMsg(''); }}
                className={`pb-1 ${isExistingUser ? 'text-emerald-400 border-b-2 border-emerald-400 font-bold' : 'text-slate-500 hover:text-slate-300'}`}
              >
                🔑 Login with Roll No.
              </button>
            </div>

            <form onSubmit={handleCandidateSubmit} className="space-y-4">
              {isExistingUser ? (
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Your Registered Roll Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CBT-2026-123456"
                    value={candidateRoll}
                    onChange={(e) => setCandidateRoll(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white uppercase font-mono outline-none focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Apna purana Roll Number enter karein past results aur progress dekhne ke liye.</p>
                </div>
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
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Custom Roll Number (Optional)</label>
                    <input
                      type="text"
                      placeholder="Leave blank for auto-generated Roll No."
                      value={candidateRoll}
                      onChange={(e) => setCandidateRoll(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white uppercase font-mono outline-none focus:border-emerald-500"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/10 active:scale-95 transition"
              >
                {isExistingUser ? 'Login & Load My Records →' : 'Register & Enter Examination Room →'}
              </button>
            </form>
          </div>
        ) : (
          /* Director / Admin Access */
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
