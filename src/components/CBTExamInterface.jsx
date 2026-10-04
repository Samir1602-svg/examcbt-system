import React, { useState, useEffect } from 'react';

export default function CBTExamInterface({ testData, student, onSubmitExam }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [language, setLanguage] = useState('en');
  const [timeLeft, setTimeLeft] = useState((testData?.duration_mins || 60) * 60);
  const [responses, setResponses] = useState({});

  // Tab Switching Anti-Cheat Lockdown
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        alert("Warning: Anti-Cheat Lockdown Active. Please do not switch tabs during examination!");
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Timer Countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQ = testData?.questions?.[currentIdx] || {
    id: 1,
    question_en: "No question found",
    options_en: ["-", "-", "-", "-"],
    correct_option_index: 0
  };

  const selectedOpt = responses[currentQ.id]?.selectedOption;

  const handleSelectOption = (idx) => {
    setResponses((prev) => ({
      ...prev,
      [currentQ.id]: {
        ...prev[currentQ.id],
        selectedOption: idx,
        state: prev[currentQ.id]?.state === 'marked_review' ? 'answered_marked' : 'answered'
      }
    }));
  };

  const handleSaveAndNext = () => {
    setResponses((prev) => ({
      ...prev,
      [currentQ.id]: {
        ...prev[currentQ.id],
        state: selectedOpt !== undefined ? 'answered' : 'not_answered'
      }
    }));
    if (currentIdx < (testData?.questions?.length || 1) - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handleMarkForReview = () => {
    setResponses((prev) => ({
      ...prev,
      [currentQ.id]: {
        ...prev[currentQ.id],
        state: selectedOpt !== undefined ? 'answered_marked' : 'marked_review'
      }
    }));
    if (currentIdx < (testData?.questions?.length || 1) - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handleClearResponse = () => {
    setResponses((prev) => ({
      ...prev,
      [currentQ.id]: {
        ...prev[currentQ.id],
        selectedOption: undefined,
        state: 'not_answered'
      }
    }));
  };

  const handleSubmit = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    onSubmitExam(responses);
  };

  const getPaletteBadgeClass = (qId, idx) => {
    const s = responses[qId]?.state;
    if (idx === currentIdx) return 'ring-2 ring-black font-black scale-105';
    if (s === 'answered') return 'bg-[#28a745] text-white';
    if (s === 'not_answered') return 'bg-[#dc3545] text-white';
    if (s === 'marked_review') return 'bg-[#6f42c1] text-white';
    if (s === 'answered_marked') {
      return 'bg-[#6f42c1] text-white relative after:content-[""] after:w-2 after:h-2 after:bg-green-400 after:rounded-full after:absolute after:bottom-0.5 after:right-0.5';
    }
    return 'bg-[#e9ecef] text-gray-800 border border-gray-300';
  };

  const qText = language === 'en' 
    ? (currentQ.question_en || currentQ.question_hi) 
    : (currentQ.question_hi || currentQ.question_en);

  const qOptions = (language === 'en' 
    ? (currentQ.options_en || currentQ.options_hi) 
    : (currentQ.options_hi || currentQ.options_en)) || [];

  return (
    <div className="h-screen w-screen flex flex-col bg-[#f5f5f5] font-sans select-none overflow-hidden text-gray-900">
      {/* Official Top Bar */}
      <header className="h-14 bg-[#3277ae] text-white flex items-center justify-between px-4 text-sm font-semibold shadow">
        <div className="text-base font-bold tracking-wide truncate max-w-lg">
          EXAMCBT: {testData?.title}
        </div>
        <div className="flex items-center space-x-6">
          <div className="bg-red-600 px-3.5 py-1 rounded text-white font-mono text-base font-bold shadow-inner">
            Time Left: {formatTimer(timeLeft)}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold">Language:</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-white text-gray-900 text-xs px-2 py-1 rounded font-bold outline-none cursor-pointer"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Question Panel */}
        <section className="flex-1 flex flex-col border-r border-gray-300 bg-white">
          <div className="px-6 py-2.5 bg-[#e9ecef] border-b border-gray-300 flex justify-between items-center text-xs font-bold text-gray-700">
            <span>Question No. {currentIdx + 1} of {testData?.questions?.length || 100}</span>
            <span>Marks: +2.0, -0.5</span>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            {/* Multi-line question text support */}
            <h3 className="text-base font-medium leading-relaxed mb-4 whitespace-pre-line text-gray-900">
              {qText}
            </h3>

            {/* Embedded Diagram / Figure rendering */}
            {currentQ.image && (
              <div className="my-4 p-2 bg-slate-50 border border-gray-300 rounded-xl max-w-lg">
                <img 
                  src={currentQ.image} 
                  alt="Question Diagram" 
                  className="max-h-64 mx-auto object-contain rounded" 
                />
              </div>
            )}

            {/* Options List */}
            <div className="space-y-3 pt-2">
              {qOptions.map((opt, i) => (
                <label
                  key={i}
                  onClick={() => handleSelectOption(i)}
                  className={`flex items-center space-x-3.5 p-3 rounded-lg border text-sm cursor-pointer transition ${
                    selectedOpt === i 
                      ? 'border-[#3277ae] bg-[#ebf3f9] shadow-sm font-medium' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`q_${currentQ.id}`}
                    checked={selectedOpt === i}
                    readOnly
                    className="accent-[#3277ae] w-4 h-4 cursor-pointer"
                  />
                  <span className="leading-snug">{opt}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Bar */}
          <div className="h-14 bg-[#f8f9fa] border-t border-gray-300 px-4 flex items-center justify-between">
            <div className="space-x-2">
              <button
                onClick={handleMarkForReview}
                className="bg-[#6f42c1] hover:bg-[#5a32a3] text-white text-xs px-3.5 py-2 rounded font-bold transition shadow-sm"
              >
                Mark for Review & Next
              </button>
              <button
                onClick={handleClearResponse}
                className="bg-white border border-gray-400 hover:bg-gray-100 text-gray-700 text-xs px-3.5 py-2 rounded font-bold transition"
              >
                Clear Response
              </button>
            </div>
            <button
              onClick={handleSaveAndNext}
              className="bg-[#28a745] hover:bg-[#218838] text-white text-xs px-6 py-2 rounded font-bold shadow transition"
            >
              Save & Next
            </button>
          </div>
        </section>

        {/* Right Candidate Profile & TCS iON Palette */}
        <aside className="w-80 bg-[#f4f7f9] flex flex-col justify-between border-l border-gray-300">
          <div className="p-3 overflow-y-auto">
            {/* Candidate Photo & Roll ID */}
            <div className="flex items-center space-x-3 p-2 bg-white rounded-lg border border-gray-300 mb-3 shadow-sm">
              <div className="w-14 h-14 bg-slate-200 rounded border border-gray-300 overflow-hidden flex items-center justify-center font-bold text-gray-500 text-xs shrink-0">
                {student?.photo ? (
                  <img src={student.photo} alt="Candidate" className="w-full h-full object-cover" />
                ) : (
                  <span>PHOTO</span>
                )}
              </div>
              <div className="text-xs truncate">
                <div className="font-bold text-gray-800 truncate">{student?.name || 'Candidate'}</div>
                <div className="text-gray-500 font-mono text-[11px] font-bold text-emerald-700">
                  Roll: {student?.id || 'CBT-2026-0000'}
                </div>
              </div>
            </div>

            {/* TCS Status Legend */}
            <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-700 bg-white p-2.5 rounded border border-gray-200 mb-3">
              <div className="flex items-center space-x-1.5"><span className="w-3.5 h-3.5 bg-[#28a745] rounded-sm inline-block"/><span>Answered</span></div>
              <div className="flex items-center space-x-1.5"><span className="w-3.5 h-3.5 bg-[#dc3545] rounded-sm inline-block"/><span>Not Answered</span></div>
              <div className="flex items-center space-x-1.5"><span className="w-3.5 h-3.5 bg-[#e9ecef] border border-gray-400 rounded-sm inline-block"/><span>Not Visited</span></div>
              <div className="flex items-center space-x-1.5"><span className="w-3.5 h-3.5 bg-[#6f42c1] rounded-sm inline-block"/><span>Marked Review</span></div>
            </div>

            {/* Complete 100 Questions Palette */}
            <div className="text-xs font-bold text-gray-700 mb-2">Question Palette:</div>
            <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto p-1">
              {(testData?.questions || []).map((q, idx) => (
                <button
                  key={q.id || idx}
                  onClick={() => setCurrentIdx(idx)}
                  className={`w-10 h-10 rounded text-xs font-semibold flex items-center justify-center transition ${getPaletteBadgeClass(q.id, idx)}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Test Button */}
          <div className="p-3 bg-white border-t border-gray-300">
            <button
              onClick={handleSubmit}
              className="w-full bg-[#007bff] hover:bg-[#0069d9] text-white py-2.5 rounded font-bold text-sm shadow transition"
            >
              Submit Examination
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}