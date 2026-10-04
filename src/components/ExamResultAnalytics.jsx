import React from 'react';

export default function ExamResultAnalytics({ results, testData, onBackToDashboard }) {
  let correct = 0;
  let incorrect = 0;
  let unattempted = 0;

  testData.questions.forEach((q) => {
    const resp = results[q.id];
    if (resp?.selectedOption === undefined) {
      unattempted++;
    } else if (resp.selectedOption === q.correct_option_index) {
      correct++;
    } else {
      incorrect++;
    }
  });

  const totalScore = (correct * 2.0) - (incorrect * 0.5);
  const accuracy = correct + incorrect > 0 ? ((correct / (correct + incorrect)) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation & Header Card */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-wrap justify-between items-center shadow-lg gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                Exam Performance Analysis
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100">{testData.title}</h1>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <span className="text-xs text-slate-400 block uppercase font-bold">Total Score</span>
              <div className="text-4xl font-black text-emerald-400">
                {totalScore} <span className="text-sm font-normal text-slate-400">/ {testData.questions.length * 2}</span>
              </div>
            </div>

            {/* Back to Home / Dashboard Button */}
            <button
              onClick={onBackToDashboard}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm transition shadow-lg flex items-center space-x-2"
            >
              <span>← Back to Dashboard</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center">
            <div className="text-3xl font-bold text-emerald-400">{correct}</div>
            <div className="text-xs text-slate-400 mt-1">Correct Answers (+{correct * 2})</div>
          </div>
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center">
            <div className="text-3xl font-bold text-rose-400">{incorrect}</div>
            <div className="text-xs text-slate-400 mt-1">Wrong Answers (-{incorrect * 0.5})</div>
          </div>
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center">
            <div className="text-3xl font-bold text-slate-400">{unattempted}</div>
            <div className="text-xs text-slate-400 mt-1">Unattempted</div>
          </div>
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center">
            <div className="text-3xl font-bold text-cyan-400">{accuracy}%</div>
            <div className="text-xs text-slate-400 mt-1">Net Accuracy</div>
          </div>
        </div>

        {/* AI Diagnostics Box */}
        <div className="bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/30 p-5 rounded-2xl shadow-md">
          <h3 className="text-base font-bold text-emerald-300 flex items-center space-x-2 mb-2">
            <span>✨ AI Weakness Detection & Revision Advice</span>
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Aapki accuracy <strong>{accuracy}%</strong> rahi. Sabhi incorrect aur skipped questions ko aapke <strong>"Revision Vault"</strong> me tag kar diya gaya hai. Real exam se pehle sirf inhi questions ko re-attempt karein.
          </p>
        </div>

        {/* Detailed Question Review */}
        <div className="space-y-4 pt-2">
          <h3 className="text-lg font-bold text-slate-200">Detailed Question Review</h3>
          {testData.questions.map((q, idx) => {
            const userAns = results[q.id]?.selectedOption;
            const isCorrect = userAns === q.correct_option_index;
            return (
              <div key={q.id} className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-400">Question {idx + 1} • {q.subject || 'General Studies'}</span>
                  <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                    userAns === undefined 
                      ? 'bg-slate-800 text-slate-400 border border-slate-700' 
                      : isCorrect 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  }`}>
                    {userAns === undefined ? 'Unattempted (0)' : isCorrect ? 'Correct (+2.0)' : 'Incorrect (-0.5)'}
                  </span>
                </div>

                <p className="text-sm font-medium text-slate-200">{q.question_en}</p>

                <div className="text-xs space-y-1.5 pt-2 border-t border-slate-800/80">
                  <div className="text-slate-300">
                    Your Response: <span className={`font-semibold ${userAns === undefined ? 'text-slate-400' : isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {userAns !== undefined ? q.options_en[userAns] : 'None'}
                    </span>
                  </div>
                  <div className="text-slate-300">
                    Correct Answer: <span className="font-semibold text-emerald-400">{q.options_en[q.correct_option_index]}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Back Button */}
        <div className="pt-4 text-center">
          <button
            onClick={onBackToDashboard}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-8 py-3 rounded-xl text-sm transition"
          >
            ← Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}