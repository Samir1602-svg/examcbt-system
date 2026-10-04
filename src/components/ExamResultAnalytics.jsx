import React, { useEffect, useState } from 'react';

export default function ExamResultAnalytics({ resultData, studentData, onReattempt, onGoToDashboard }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'correct' | 'wrong' | 'unattempted'

  // Safety exit fullscreen to prevent blackout / freeze
  useEffect(() => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (e) {
      // Ignored safely
    }
  }, []);

  // Safe defaults against null / undefined to completely prevent crash & blackout
  const testTitle = resultData?.testTitle || "SSC Examination Tier-1";
  const totalQuestions = resultData?.totalQuestions || resultData?.questions?.length || 0;
  const correct = resultData?.correct ?? 0;
  const wrong = resultData?.wrong ?? 0;
  const unattempted = resultData?.unattempted ?? Math.max(0, totalQuestions - (correct + wrong));
  const finalScore = resultData?.finalScore !== undefined ? resultData.finalScore : ((correct * 2) - (wrong * 0.5)).toFixed(2);
  const timeSpentMins = resultData?.timeSpentMins ?? 0;
  const questions = Array.isArray(resultData?.questions) ? resultData.questions : [];
  const selectedAnswers = resultData?.selectedAnswers || {};

  const maxMarks = totalQuestions * 2;
  const accuracy = (correct + wrong) > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0;
  const candidateName = studentData?.name || "Verified Candidate";
  const candidateRoll = studentData?.id || "CBT-2026-0000";

  // Filtered questions list
  const filteredQuestions = questions.filter((q, idx) => {
    const userAns = selectedAnswers[idx];
    if (filter === 'correct') return userAns !== undefined && userAns === q.correct_option_index;
    if (filter === 'wrong') return userAns !== undefined && userAns !== q.correct_option_index;
    if (filter === 'unattempted') return userAns === undefined;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8 font-sans selection:bg-emerald-500 selection:text-slate-950">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                Assessment Certified
              </span>
              <span className="text-xs text-slate-400 font-mono">TCS iON Standard</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">{testTitle}</h1>
            <p className="text-xs text-slate-400">
              Candidate: <span className="text-slate-200 font-semibold">{candidateName}</span> ({candidateRoll})
            </p>
          </div>

          <div className="flex space-x-3 self-end sm:self-auto">
            {onReattempt && (
              <button
                onClick={onReattempt}
                className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs px-4 py-2.5 rounded-xl font-bold transition"
              >
                Reattempt Test
              </button>
            )}
            <button
              onClick={onGoToDashboard}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition"
            >
              Candidate Dashboard →
            </button>
          </div>
        </div>

        {/* Primary Metric Score Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Final Score */}
          <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-medium">Aggregate Score</span>
            <div className="my-2">
              <span className="text-2xl sm:text-4xl font-black text-emerald-400">{finalScore}</span>
              <span className="text-xs text-slate-500 ml-1">/ {maxMarks}</span>
            </div>
            <span className="text-[10px] text-slate-500">Tier-1 (+2 / -0.50 Mark)</span>
          </div>

          {/* Accuracy */}
          <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-medium">Accuracy Rate</span>
            <div className="my-2">
              <span className="text-2xl sm:text-4xl font-black text-teal-400">{accuracy}%</span>
            </div>
            <span className="text-[10px] text-slate-500">{correct} of {correct + wrong} attempted</span>
          </div>

          {/* Correct / Incorrect */}
          <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-medium">Correct / Wrong</span>
            <div className="my-2 flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400">✓ {correct}</span>
              <span className="text-lg sm:text-2xl font-black text-rose-400">✗ {wrong}</span>
            </div>
            <span className="text-[10px] text-slate-500">Unattempted: {unattempted}</span>
          </div>

          {/* Time Spent */}
          <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-medium">Time Taken</span>
            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-black text-amber-400">{timeSpentMins}m</span>
            </div>
            <span className="text-[10px] text-slate-500">Total duration pacing</span>
          </div>
        </div>

        {/* Detailed Review Section */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white">Question Review & Official Answer Keys</h2>
              <p className="text-xs text-slate-400">Review each question statement, your marked response, and correct options.</p>
            </div>

            {/* Filter Pills */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${filter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                All ({questions.length})
              </button>
              <button
                onClick={() => setFilter('correct')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${filter === 'correct' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'}`}
              >
                ✓ Correct ({correct})
              </button>
              <button
                onClick={() => setFilter('wrong')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${filter === 'wrong' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400 hover:text-white'}`}
              >
                ✗ Wrong ({wrong})
              </button>
              <button
                onClick={() => setFilter('unattempted')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${filter === 'unattempted' ? 'bg-slate-800 text-slate-300' : 'text-slate-400 hover:text-white'}`}
              >
                Skipped ({unattempted})
              </button>
            </div>
          </div>

          {/* Question List Display */}
          {filteredQuestions.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Is filter ke under koi questions nahi hain.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((q, idx) => {
                const originalQIndex = questions.findIndex(orig => orig.id === q.id);
                const userChoice = selectedAnswers[originalQIndex];
                const isCorrect = userChoice !== undefined && userChoice === q.correct_option_index;
                const isSkipped = userChoice === undefined;

                return (
                  <div
                    key={q.id || idx}
                    className={`p-4 rounded-2xl border ${
                      isCorrect
                        ? 'border-emerald-500/30 bg-emerald-950/10'
                        : isSkipped
                        ? 'border-slate-800 bg-slate-950/60'
                        : 'border-rose-500/30 bg-rose-950/10'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-slate-300">
                        Q.{originalQIndex + 1} • <span className="text-slate-500 font-normal">{q.subject || 'General Section'}</span>
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isCorrect
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : isSkipped
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        {isCorrect ? '+2.00 Correct' : isSkipped ? '0.00 Skipped' : '-0.50 Incorrect'}
                      </span>
                    </div>

                    {/* Question text */}
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium mb-3 whitespace-pre-line">
                      {q.question_en}
                    </p>

                    {/* Diagram Display if exists */}
                    {q.image && (
                      <div className="mb-3 max-w-sm border border-slate-700 rounded-lg p-2 bg-slate-900">
                        <img src={q.image} alt="Question figure" className="max-h-48 object-contain rounded" />
                      </div>
                    )}

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {(q.options_en || []).map((opt, optIdx) => {
                        const isThisCorrect = optIdx === q.correct_option_index;
                        const isThisSelected = userChoice === optIdx;

                        let style = "bg-slate-900 border-slate-800 text-slate-400";
                        if (isThisCorrect) {
                          style = "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold";
                        } else if (isThisSelected) {
                          style = "bg-rose-500/20 border-rose-500 text-rose-300 font-bold";
                        }

                        return (
                          <div key={optIdx} className={`p-2.5 rounded-xl border flex items-center justify-between ${style}`}>
                            <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                            {isThisCorrect && <span className="text-[10px] text-emerald-400 font-black">✓ Correct Key</span>}
                            {isThisSelected && !isThisCorrect && <span className="text-[10px] text-rose-400 font-black">✗ Your Choice</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
