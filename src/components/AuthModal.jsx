import React, { useState } from 'react';

export default function AuthModal({ onLoginSuccess, onAdminLoginSuccess, onClose }) {
  const [mode, setMode] = useState('student_login'); // 'student_login' | 'student_register' | 'admin_login'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentIdInput, setStudentIdInput] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  // Handle Student Registration
  const handleStudentRegister = (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Sabhi fields bharna anivarya hai.');
      return;
    }

    const storedUsers = JSON.parse(localStorage.getItem('cbt_students') || '[]');
    const existing = storedUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      setError('Yeh Email pehle se registered hai! Login karein.');
      return;
    }

    // Generate Unique Gen-Z Roll/Student ID (e.g. CBT-2026-8491)
    const uniqueId = `CBT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newUser = {
      id: uniqueId,
      name,
      email,
      password,
      createdAt: new Date().toLocaleDateString('en-GB'),
      testsAttempted: 0
    };

    const updated = [newUser, ...storedUsers];
    localStorage.setItem('cbt_students', JSON.stringify(updated));
    localStorage.setItem('cbt_logged_user', JSON.stringify(newUser));
    onLoginSuccess(newUser);
  };

  // Handle Student Login (via Email or Unique Student ID)
  const handleStudentLogin = (e) => {
    e.preventDefault();
    const storedUsers = JSON.parse(localStorage.getItem('cbt_students') || '[]');
    const user = storedUsers.find(
      (u) =>
        (u.email.toLowerCase() === email.toLowerCase() || u.id.toLowerCase() === studentIdInput.toLowerCase()) &&
        u.password === password
    );

    if (!user) {
      setError('Galat Credentials ya Roll ID. Kripya check karein.');
      return;
    }

    localStorage.setItem('cbt_logged_user', JSON.stringify(user));
    onLoginSuccess(user);
  };

  // Handle Admin Login
  const handleAdminAuth = (e) => {
    e.preventDefault();
    if (email === 'admin@examcbt.com' && password === 'admin123') {
      onAdminLoginSuccess();
    } else {
      setError('Galat Admin Email ya Password (Use: admin@examcbt.com / admin123)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900/95 border border-emerald-500/30 w-full max-w-md rounded-3xl p-7 shadow-2xl relative text-white">
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-5 right-5 text-slate-400 hover:text-white text-lg">✕</button>

        {/* Header Tabs */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-black text-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            CBT
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            {mode === 'admin_login' ? 'Official Admin Portal' : mode === 'student_register' ? 'Student Registration' : 'Student Examination Portal'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'admin_login' ? 'Central Question & Candidate Management' : 'Access your mocks & AI weakness tracker'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-950 p-1 rounded-xl mb-5 border border-slate-800 text-xs font-bold">
          <button
            onClick={() => { setMode('student_login'); setError(''); }}
            className={`flex-1 py-2 rounded-lg transition ${mode === 'student_login' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Student Login
          </button>
          <button
            onClick={() => { setMode('student_register'); setError(''); }}
            className={`flex-1 py-2 rounded-lg transition ${mode === 'student_register' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
          >
            New Student
          </button>
          <button
            onClick={() => { setMode('admin_login'); setError(''); }}
            className={`flex-1 py-2 rounded-lg transition ${mode === 'admin_login' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Admin Key
          </button>
        </div>

        {error && (
          <div className="mb-4 text-xs bg-rose-500/20 border border-rose-500/40 text-rose-300 p-2.5 rounded-xl">
            {error}
          </div>
        )}

        {/* Student Register Form */}
        {mode === 'student_register' && (
          <form onSubmit={handleStudentRegister} className="space-y-3.5 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Full Name</label>
              <input
                type="text"
                placeholder="Samir Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Email ID</label>
              <input
                type="email"
                placeholder="samir@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Create Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-emerald-400"
              />
            </div>
            <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-xl text-sm shadow-lg mt-2 transition">
              Create Account & Get Roll ID
            </button>
          </form>
        )}

        {/* Student Login Form */}
        {mode === 'student_login' && (
          <form onSubmit={handleStudentLogin} className="space-y-3.5 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Email ID or Unique Roll ID</label>
              <input
                type="text"
                placeholder="CBT-2026-XXXX or name@email.com"
                value={studentIdInput || email}
                onChange={(e) => {
                  setStudentIdInput(e.target.value);
                  setEmail(e.target.value);
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-emerald-400"
              />
            </div>
            <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-xl text-sm shadow-lg mt-2 transition">
              Verify & Enter Portal
            </button>
          </form>
        )}

        {/* Admin Login Form */}
        {mode === 'admin_login' && (
          <form onSubmit={handleAdminAuth} className="space-y-3.5 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Admin Email</label>
              <input
                type="email"
                placeholder="admin@examcbt.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Admin Password</label>
              <input
                type="password"
                placeholder="admin123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-amber-400"
              />
            </div>
            <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl text-sm shadow-lg mt-2 transition">
              Access Admin Panel
            </button>
          </form>
        )}
      </div>
    </div>
  );
}