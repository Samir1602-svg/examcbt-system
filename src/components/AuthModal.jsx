import React, { useState } from 'react';

export default function AuthModal({ onClose, onStudentLogin, onAdminLogin }) {
  const [roleTab, setRoleTab] = useState('candidate'); // 'candidate' | 'admin'
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleCandidateSubmit = (e) => {
    e.preventDefault();
    if (!candidateName.trim()) {
      setErrorMsg("Kripya apna poora naam enter karein!");
      return;
    }
    const student = {
      id: `CBT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      name: candidateName.trim(),
      email: candidateEmail.trim() || `${candidateName.toLowerCase().replace(/\s+/g, '')}@aspirant.portal`,
      createdAt: new Date().toLocaleDateString('en-IN')
    };
    onStudentLogin(student);
  };

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    if (adminEmail === 'admin@examcbt.com' && adminPassword === 'admin123') {
      onAdminLogin();
    } else {
      setErrorMsg("Galat Credentials! Admin ke liye use karein: admin@examcbt.com / admin123");
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

        {/* Tab Switcher */}
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-6">
          <button
            onClick={() => { setRoleTab('candidate'); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${roleTab === 'candidate' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
          >
            🎓 Candidate Access
          </button>
          <button
            onClick={() => { setRoleTab('admin'); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${roleTab === 'admin' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
          >
            🛡️ Admin / Faculty
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* Candidate Login Form */}
        {roleTab === 'candidate' ? (
          <form onSubmit={handleCandidateSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Candidate Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Email / Registration Roll (Optional)</label>
              <input
                type="text"
                placeholder="e.g. candidate@gmail.com"
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-sm shadow-lg shadow-emerald-500/10 active:scale-95 transition"
            >
              Generate Roll & Enter Exam Room →
            </button>
          </form>
        ) : (
          /* Admin Login Form */
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Admin Email</label>
              <input
                type="email"
                required
                placeholder="admin@examcbt.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Admin Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl text-sm shadow-lg shadow-amber-500/10 active:scale-95 transition"
            >
              Verify & Open Control Center →
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
