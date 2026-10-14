import React, { useState, useEffect } from 'react';

// Markdown (![alt](url)) and HTML (<img>) Parser with Responsive Styling
function RenderFormattedContent({ content, onImageClick }) {
  if (!content) return null;
  if (typeof content !== 'string') return <span>{content}</span>;

  const tokenRegex = /(!\[.*?\]\(.*?\)|<img\s+[^>]*src=["'][^"']+["'][^>]*\/?>)/gi;
  const parts = content.split(tokenRegex);

  return (
    <span className="inline">
      {parts.map((part, idx) => {
        if (!part) return null;

        // 1. Markdown Image: ![alt](url)
        const mdMatch = part.match(/^!\[(.*?)\]\((.*?)\)$/);
        if (mdMatch) {
          const altText = mdMatch[1] || 'Diagram';
          const srcUrl = mdMatch[2];
          return (
            <span key={idx} className="block my-2">
              <img
                src={srcUrl}
                alt={altText}
                onClick={(e) => {
                  e.stopPropagation();
                  onImageClick(srcUrl, altText);
                }}
                className="max-w-full h-auto max-h-64 object-contain rounded-lg border border-slate-300 p-1 bg-white cursor-zoom-in hover:shadow-md transition mx-auto"
              />
            </span>
          );
        }

        // 2. Raw HTML <img> Tag
        const htmlMatch = part.match(/<img\s+[^>]*src=["']([^"']+)["'][^>]*\/?>/i);
        if (htmlMatch) {
          const srcUrl = htmlMatch[1];
          const altMatch = part.match(/alt=["']([^"']+)["']/i);
          const altText = altMatch ? altMatch[1] : 'Diagram';
          return (
            <span key={idx} className="block my-2">
              <img
                src={srcUrl}
                alt={altText}
                onClick={(e) => {
                  e.stopPropagation();
                  onImageClick(srcUrl, altText);
                }}
                className="max-w-full h-auto max-h-64 object-contain rounded-lg border border-slate-300 p-1 bg-white cursor-zoom-in hover:shadow-md transition mx-auto"
              />
            </span>
          );
        }

        // 3. Regular Text
        return <span key={idx}>{part}</span>;
      })}
    </span>
  );
}

export default function CBTExamInterface({ testData, studentData, onFinishExam, onExitExam }) {
  const questions = testData?.questions || [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [language, setLanguage] = useState('en'); // 'en' for English, 'hi' for Hindi
  const [timeLeft, setTimeLeft] = useState((testData?.duration_mins || 60) * 60);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Image Zoom & Pop-up Preview Modal State
  const [previewImage, setPreviewImage] = useState(null);
  const [zoomScale, setZoomScale] = useState(1);

  // Candidate Photo Lookup
  const candidateRoll = studentData?.id || 'CBT-2026-0000';
  const candidatePhoto = studentData?.avatar || studentData?.photo || localStorage.getItem(`cbt_photo_${candidateRoll}`) || null;

  // Countdown Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      handleFinalSubmission();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQ = questions[currentIdx] || {};

  // Bilingual Question Text Resolver
  const getDisplayQuestion = () => {
    if (language === 'hi') {
      return currentQ.question_hi || currentQ.question || currentQ.question_en || "प्रश्न उपलब्ध नहीं है।";
    }
    return currentQ.question_en || currentQ.question || currentQ.question_hi || "Question text not available.";
  };

  // Bilingual Options Resolver
  const getDisplayOptions = () => {
    if (language === 'hi') {
      const optsHi = currentQ.options_hi || currentQ.options;
      if (Array.isArray(optsHi) && optsHi.length > 0) return optsHi;
    }
    return currentQ.options_en || currentQ.options || ["Option A", "Option B", "Option C", "Option D"];
  };

  const displayQuestionText = getDisplayQuestion();
  const displayOptions = getDisplayOptions();

  const handleOpenImagePreview = (src, alt = 'Diagram Preview') => {
    setPreviewImage({ src, alt });
    setZoomScale(1);
  };

  const handleCloseImagePreview = () => {
    setPreviewImage(null);
    setZoomScale(1);
  };

  const handleSelectOption = (optIdx) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIdx]: optIdx
    }));
  };

  const handleSaveAndNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handleMarkReviewAndNext = () => {
    setMarkedForReview((prev) => ({
      ...prev,
      [currentIdx]: true
    }));
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handleClearResponse = () => {
    setSelectedAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentIdx];
      return copy;
    });
  };

  const getQuestionStatus = (idx) => {
    const isAnswered = selectedAnswers[idx] !== undefined;
    const isMarked = markedForReview[idx] === true;

    if (isAnswered && isMarked) return 'marked-answered';
    if (isMarked) return 'marked';
    if (isAnswered) return 'answered';
    if (idx === currentIdx) return 'current';
    return 'not-answered';
  };

  const handleFinalSubmission = () => {
    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let unattemptedCount = 0;

    questions.forEach((q, idx) => {
      const userAns = selectedAnswers[idx];
      if (userAns === undefined) {
        unattemptedCount++;
      } else if (userAns === q.correct_option_index) {
        correctCount++;
        score += 2.0;
      } else {
        wrongCount++;
        score -= 0.50;
      }
    });

    const resultData = {
      testTitle: testData?.title || "SSC Mock Exam",
      totalQuestions: questions.length,
      correct: correctCount,
      wrong: wrongCount,
      unattempted: unattemptedCount,
      finalScore: score.toFixed(2),
      timeSpentMins: Math.floor(((testData?.duration_mins || 60) * 60 - timeLeft) / 60),
      questions,
      selectedAnswers
    };

    onFinishExam(resultData);
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const markedCount = Object.keys(markedForReview).length;
  const notVisitedCount = Math.max(0, questions.length - answeredCount);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans select-none">
      
      {/* 1. Header */}
      <header className="bg-[#245d8b] text-white px-3 sm:px-6 py-2.5 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-sm sm:text-base tracking-wide truncate max-w-[180px] sm:max-w-md">
            {testData?.title || 'EXAMCBT Assessment'}
          </span>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-6">
          <div className="bg-red-600 px-3 py-1 rounded text-center shadow-sm">
            <span className="text-[10px] uppercase font-bold block leading-none text-red-200">Time Left</span>
            <span className="font-mono text-sm sm:text-lg font-bold leading-tight">{formatTimer(timeLeft)}</span>
          </div>

          {/* Bilingual Switcher Dropdown */}
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="hidden sm:inline text-slate-200 font-semibold">View in:</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-white text-slate-800 rounded px-2 py-1 font-bold text-xs outline-none cursor-pointer shadow-sm"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी (Hindi)</option>
            </select>
          </div>
        </div>
      </header>

      {/* 2. Main Question & Palette Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left: Question Box */}
        <div className="flex-1 flex flex-col justify-between bg-white border-r border-slate-300 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2 text-xs">
              <span className="font-black text-slate-700 text-sm">
                Question No. {currentIdx + 1} of {questions.length}
              </span>
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded text-[11px]">
                Marks: +2.0, -0.5
              </span>
            </div>

            {/* Question Text (Supports Markdown & HTML Images) */}
            <div className="text-sm sm:text-base font-medium text-slate-900 leading-relaxed whitespace-pre-line font-sans">
              <RenderFormattedContent
                content={displayQuestionText}
                onImageClick={handleOpenImagePreview}
              />
            </div>

            {/* Question Image/Diagram Canvas (Responsive + Click to Zoom) */}
            {currentQ.image && (
              <div className="my-3 border border-slate-300 rounded-xl p-3 bg-slate-50 max-w-2xl mx-auto shadow-inner flex flex-col items-center justify-center overflow-hidden">
                <img
                  src={currentQ.image}
                  alt={`Question ${currentIdx + 1} Graphic`}
                  onClick={() => handleOpenImagePreview(currentQ.image, `Question ${currentIdx + 1} Graphic`)}
                  className="max-w-full h-auto max-h-72 object-contain rounded cursor-zoom-in hover:opacity-95 transition"
                />
                <span className="text-[10px] text-slate-500 mt-1.5 font-medium">🔍 Tap / Click diagram to zoom</span>
              </div>
            )}

            {/* Options List (Supports Markdown & HTML Images) */}
            <div className="space-y-2.5 pt-2 max-w-3xl">
              {displayOptions.map((opt, optIdx) => {
                const isSelected = selectedAnswers[currentIdx] === optIdx;
                return (
                  <label
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`flex items-center space-x-3.5 p-3 rounded-xl border-2 cursor-pointer transition ${
                      isSelected ? 'border-[#245d8b] bg-sky-50 font-bold text-[#245d8b]' : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question_${currentIdx}`}
                      checked={isSelected}
                      onChange={() => handleSelectOption(optIdx)}
                      className="accent-[#245d8b] w-4 h-4 cursor-pointer shrink-0"
                    />
                    <span className="text-xs sm:text-sm font-mono font-bold text-slate-500 mr-1 shrink-0">
                      {String.fromCharCode(65 + optIdx)}.
                    </span>
                    <div className="text-xs sm:text-sm flex-1 overflow-hidden">
                      <RenderFormattedContent
                        content={opt}
                        onImageClick={handleOpenImagePreview}
                      />
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-4 border-t border-slate-200 flex flex-wrap gap-2 justify-between items-center bg-slate-50 p-2.5 rounded-xl">
            <div className="flex gap-2">
              <button
                onClick={handleMarkReviewAndNext}
                className="bg-[#6f42c1] hover:bg-[#5a32a3] text-white text-xs font-bold px-3 sm:px-4 py-2 rounded-lg shadow transition"
              >
                Mark for Review & Next
              </button>
              <button
                onClick={handleClearResponse}
                className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold px-3 sm:px-4 py-2 rounded-lg transition"
              >
                Clear Response
              </button>
            </div>

            <button
              onClick={handleSaveAndNext}
              className="bg-[#28a745] hover:bg-[#218838] text-white text-xs font-black px-6 py-2.5 rounded-lg shadow transition active:scale-95"
            >
              Save & Next →
            </button>
          </div>
        </div>

        {/* Right: Candidate Info & Question Palette */}
        <div className="w-full lg:w-80 bg-slate-50 border-t lg:border-t-0 border-slate-300 flex flex-col justify-between p-4">
          <div className="space-y-4">
            
            {/* Candidate Identity Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center space-x-3 shadow-sm">
              <div className="w-14 h-16 bg-slate-200 border border-slate-300 rounded-lg overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                {candidatePhoto ? (
                  <img src={candidatePhoto} alt="Candidate" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-slate-500 font-bold uppercase">PHOTO</span>
                )}
              </div>
              <div className="overflow-hidden">
                <span className="text-xs font-bold text-slate-900 block truncate">
                  {studentData?.name || 'Verified Candidate'}
                </span>
                <span className="text-[10px] font-mono text-slate-500 block truncate">
                  Roll: {candidateRoll}
                </span>
                <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">
                  Biometric Verified
                </span>
              </div>
            </div>

            {/* Legend Indicators */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200">
              <div className="flex items-center space-x-1.5">
                <span className="w-3.5 h-3.5 bg-[#28a745] rounded-sm text-white flex items-center justify-center text-[9px] font-bold">✓</span>
                <span>Answered</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3.5 h-3.5 bg-red-500 rounded-sm"></span>
                <span>Not Answered</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3.5 h-3.5 bg-slate-200 border border-slate-300 rounded-sm"></span>
                <span>Not Visited</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3.5 h-3.5 bg-[#6f42c1] rounded-sm"></span>
                <span>Marked Review</span>
              </div>
            </div>

            {/* Question Palette Matrix */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-700">Question Palette:</span>
                <span className="text-[11px] font-mono font-bold text-slate-500">{questions.length} Total</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 max-h-56 lg:max-h-80 overflow-y-auto p-1 bg-white border border-slate-200 rounded-xl">
                {questions.map((_, idx) => {
                  const status = getQuestionStatus(idx);
                  let colorClass = 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200';

                  if (status === 'answered') {
                    colorClass = 'bg-[#28a745] text-white font-bold border-[#1e7e34]';
                  } else if (status === 'marked' || status === 'marked-answered') {
                    colorClass = 'bg-[#6f42c1] text-white font-bold border-[#5a32a3]';
                  } else if (idx === currentIdx) {
                    colorClass = 'bg-red-500 text-white font-bold border-red-700 ring-2 ring-red-300';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentIdx(idx)}
                      className={`h-8 rounded-lg text-xs border font-medium transition active:scale-90 ${colorClass}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-200 space-y-2">
            <button
              onClick={() => setShowSubmitModal(true)}
              className="w-full bg-[#007bff] hover:bg-[#0069d9] text-white font-black py-2.5 rounded-xl text-xs sm:text-sm uppercase tracking-wider shadow-md active:scale-95 transition"
            >
              Submit Examination
            </button>
            <button
              onClick={onExitExam}
              className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 rounded-xl text-xs transition"
            >
              Exit Exam Hall
            </button>
          </div>
        </div>
      </div>

      {/* Pop-up Image Zoom & Preview Modal */}
      {previewImage && (
        <div
          onClick={handleCloseImagePreview}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-slate-100 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-700 truncate">{previewImage.alt}</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setZoomScale((z) => Math.max(0.5, z - 0.25))}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs font-bold hover:bg-slate-50"
                >
                  −
                </button>
                <span className="text-xs font-mono font-bold w-12 text-center">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  onClick={() => setZoomScale((z) => Math.min(3, z + 0.25))}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs font-bold hover:bg-slate-50"
                >
                  +
                </button>
                <button
                  onClick={() => setZoomScale(1)}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs font-semibold hover:bg-slate-50"
                >
                  Reset
                </button>
                <button
                  onClick={handleCloseImagePreview}
                  className="ml-2 w-7 h-7 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center hover:bg-slate-900"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-slate-50 flex items-center justify-center touch-pan-x touch-pan-y">
              <img
                src={previewImage.src}
                alt={previewImage.alt}
                style={{ transform: `scale(${zoomScale})`, transformOrigin: 'center center' }}
                className="max-w-full h-auto object-contain transition-transform duration-150"
              />
            </div>
          </div>
        </div>
      )}

      {/* Final Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            
            <h3 className="text-base font-black text-slate-900">Are you sure you want to finish the exam?</h3>
            
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-emerald-600 font-bold block text-base">{answeredCount}</span>
                <span className="text-slate-500 text-[10px]">Answered</span>
              </div>
              <div>
                <span className="text-purple-600 font-bold block text-base">{markedCount}</span>
                <span className="text-slate-500 text-[10px]">Review</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block text-base">{notVisitedCount}</span>
                <span className="text-slate-500 text-[10px]">Remaining</span>
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-
