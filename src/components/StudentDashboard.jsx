import React, { useState } from 'react';
import { useRealtimeTest } from '../hooks/useRealtimeTest';

function TestCard({ test, onInitiateExam }) {
  const { isRecentlyUpdated } = useRealtimeTest(test.id);
  const showBadge = isRecentlyUpdated || test.isRecentlyUpdated;

  return (
    <div className="p-6 border border-slate-800 rounded-3xl bg-slate-900/80 backdrop-blur-xl shadow-xl hover:border-emerald-500/50 transition flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-3 gap-2">
          <h3 className="text-base font-bold text-slate-100">{test.title}</h3>
          {showBadge && (
            <span className="shrink-0 bg-amber-500/20 text-amber-400 border border-amber-500/50 text-[10px] px-2.5 py-0.5 rounded-full font-black animate-pulse">
              RECENTLY UPDATED
            </span>
          )}
        </div>

        <div className="flex items-center space-x-4 text-xs text-slate-400 mb-6">
          <span>📝 {test.questions?.length || 0} Questions</span>
          <span>⏱️ {test.duration_mins || 60} Minutes</span>
          <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[11px] font-semibold">
            TCS iON Standard
          </span>
        </div>
      </div>

      <button
        onClick={() => onInitiateExam(test)}
        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black py-3 rounded-2xl text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/10 active:scale-95"
      >
        Start CBT Examination
      </button>
    </div>
  );
}

export default function StudentDashboard({ student, tests = [], pastResults = [], onSelectExamWithDisclaimer, onUpdatePhoto, onLogout }) {
  const [activeTab, setActiveTab] = useState('tests'); // 'tests' | 'results'

  // Canvas Image Compression (Passport Size < 15KB) to prevent Quota Exceeded error
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 140;
        const MAX_HEIGHT = 140;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to lightweight JPEG base64 string
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        onUpdatePhoto(compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
      {/* Official Header */}
      <header className="flex justify-between items-center border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg">
            CBT
          </div>
          <div>
            <h1 className="text-xl font-black text-white">EXAMCBT Candidate Portal</h1>
            <p className="text-xs text-slate-400">Computer Based Assessment System</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="text-xs border border-slate-800 bg-slate-900 px-4 py-2 rounded-xl hover:bg-slate-800 text-slate-300 font-semibold transition"
        >
          Logout
        </button>
      </header>

      {/* Candidate Profile Card with Auto-Compressed Photo & Real Roll ID */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl flex flex-wrap justify-between items-center gap-6 shadow-xl">
        <div className="flex items-center space-x-5">
          {/* Candidate Profile Photo Upload Box */}
          <div className="relative group">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-emerald-500/50 bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 shadow-md">
              {student?.photo ? (
                <img src={student.photo} alt="Candidate" className="w-full h-full object-cover" />
              ) : (
                <span className="text-center text-[10px] p-1 text-slate-400 font-bold uppercase">Upload Photo</span>
              )}
            </div>
            <label className="absolute inset-0 bg-black/70 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-bold cursor-pointer transition">
              Change
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Verified Candidate
            </span>
            <h2 className="text-2xl font-black text-white">{student?.name || 'Candidate'}</h2>
            <p className="text-xs text-slate-400">{student?.email || 'student@examcbt.portal'}</p>
          </div>
        </div>

        {/* Unique Roll ID Card */}
        <div className="bg-slate-950 border border-emerald-500/30 px-6 py-4 rounded-2xl text-right shadow-inner">
          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Candidate Roll ID</span>
          <div className="text-2xl font-mono font-black text-emerald-400 tracking-wider">
            {student?.id || 'CBT-2026-0000'}
          </div>
          <span className="text-[10px] text-slate-500">Persistent Center Registration</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-4 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('tests')}
          className={`pb-2 text-sm font-bold transition ${activeTab === 'tests' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-white'}`}
        >
          Available Examination Series ({tests.length})
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`pb-2 text-sm font-bold transition ${activeTab === 'results' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-white'}`}
        >
          My Past Exam Results ({pastResults.length})
        </button>
      </div>

      {/* Tab 1: Available Tests */}
      {activeTab === 'tests' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tests.length === 0 ? (
            <div className="col-span-2 p-8 text-center text-slate-500 text-xs bg-slate-900/40 rounded-2xl border border-slate-800">
              Koi active test available nahi hai. Admin portal se naya test generate karein.
            </div>
          ) : (
            tests.map((test) => (
              <TestCard key={test.id} test={test} onInitiateExam={onSelectExamWithDisclaimer} />
            ))
          )}
        </div>
      )}

      {/* Tab 2: Past Results History */}
      {activeTab === 'results' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          {pastResults.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Aapne abhi tak koi mock test attempt nahi kiya hai. Ek mock test start karein!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-4">Test Title</th>
                    <th className="p-4">Date & Time</th>
                    <th className="p-4">Score</th>
                    <th className="p-4">Accuracy</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {pastResults.map((res, i) => (
                    <tr key={i} className="hover:bg-slate-800/40">
                      <td className="p-4 font-bold text-slate-100">{res.testTitle}</td>
                      <td className="p-4 text-slate-400">{res.date}</td>
                      <td className="p-4 font-mono font-bold text-emerald-400">{res.score}</td>
                      <td className="p-4 font-bold text-cyan-400">{res.accuracy}%</td>
                      <td className="p-4">
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          Submitted
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}