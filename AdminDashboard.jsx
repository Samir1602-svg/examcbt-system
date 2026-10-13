import React, { useState, useEffect } from 'react';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'https://examcbt-backend.onrender.com').replace(/\/$/, "");

export default function AdminDashboard({ onPublishTest, onUpdateExistingTest, onDeleteTest, onBackToHome, existingTests = [] }) {
  const [activeTab, setActiveTab] = useState('pdf');
  const [uploadMethod, setUploadMethod] = useState('gemini_json');
  
  const [testTitle, setTestTitle] = useState('');
  const [duration, setDuration] = useState(60);
  const [pdfFile, setPdfFile] = useState(null);
  const [jsonInput, setJsonInput] = useState('');
  
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Directorate Circulars Management States
  const [circulars, setCirculars] = useState(() => {
    return JSON.parse(localStorage.getItem('cbt_directorate_circulars') || '[]');
  });
  const [circularTitle, setCircularTitle] = useState('');
  const [circularFile, setCircularFile] = useState(null);

  // Point 10: Public Trial & Demo Showcase Management States
  const [showcaseExams, setShowcaseExams] = useState(() => {
    return JSON.parse(localStorage.getItem('cbt_showcase_exams') || JSON.stringify([
      { code: "SSC-CGL", name: "Combined Graduate Level", pattern: "Tier-1 (100 Qs / 60 Min)", status: "Active Mock Matrix" },
      { code: "SSC-CHSL", name: "Combined Higher Secondary", pattern: "Tier-1 (100 Qs / 60 Min)", status: "Simulation Ready" },
      { code: "RRB-NTPC", name: "Non-Technical Popular", pattern: "CBT-1 (100 Qs / 90 Min)", status: "TCS Engine Active" },
      { code: "SSC-CPO", name: "Central Police Organization", pattern: "Paper-1 (200 Qs / 120 Min)", status: "Certified Setup" }
    ]));
  });
  const [newShowcaseCode, setNewShowcaseCode] = useState('');
  const [newShowcaseName, setNewShowcaseName] = useState('');
  const [newShowcasePattern, setNewShowcasePattern] = useState('');
  const [newShowcaseStatus, setNewShowcaseStatus] = useState('Simulation Ready');

  // Selected Test for Editing
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [editingTest, setEditingTest] = useState(null);

  const geminiPromptText = `Please analyze this attached SSC/TCS official question paper PDF and extract all questions into the exact JSON format below. Do not write any explanations, markdown notes or text outside the JSON array:

[
  {
    "question": "Exact question text in English or Hindi",
    "options": ["Option 1 text", "Option 2 text", "Option 3 text", "Option 4 text"],
    "correct_option_index": 0,
    "subject": "General Studies"
  }
]

Note: correct_option_index must be 0 for Option 1, 1 for Option 2, 2 for Option 3, or 3 for Option 4 based on the green tick or chosen/correct answer indicated in the answer key.`;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(geminiPromptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 3000);
  };

  const fetchStudents = async () => {
    let combined = [];
    try {
      const res = await fetch(`${API_BASE_URL}/api/students`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success' && Array.isArray(data.students)) {
          combined = data.students;
        }
      }
    } catch (e) {
      console.warn("Could not fetch remote students:", e);
    }

    const local = JSON.parse(localStorage.getItem('cbt_students') || '[]');
    local.forEach(locS => {
      if (!combined.some(c => c.id === locS.id)) {
        combined.push(locS);
      }
    });

    setRegisteredStudents(combined);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleRevokeStudent = (studentId) => {
    if (window.confirm("Are you sure you want to permanently revoke and remove this student from the portal?")) {
      const updatedList = registeredStudents.filter(s => s.id !== studentId);
      setRegisteredStudents(updatedList);
      localStorage.setItem('cbt_students', JSON.stringify(updatedList));
      alert("Student access successfully revoked and record removed.");
    }
  };

  // Handle Publishing Directorate Circulars
  const handlePublishCircular = (e) => {
    e.preventDefault();
    if (!circularTitle.trim()) {
      alert("Kripya circular ka title enter karein!");
      return;
    }

    const newCircular = {
      id: `circ-${Date.now()}`,
      title: circularTitle.trim(),
      fileName: circularFile ? circularFile.name : "Official_Directorate_Circular.pdf",
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      link: "#"
    };

    const updatedCirculars = [newCircular, ...circulars];
    setCirculars(updatedCirculars);
    localStorage.setItem('cbt_directorate_circulars', JSON.stringify(updatedCirculars));
    setCircularTitle('');
    setCircularFile(null);
    alert("Directorate circular successfully published to portal announcements!");
  };

  const handleDeleteCircular = (circId) => {
    if (window.confirm("Are you sure you want to delete this circular?")) {
      const updated = circulars.filter(c => c.id !== circId);
      setCirculars(updated);
      localStorage.setItem('cbt_directorate_circulars', JSON.stringify(updated));
    }
  };

  // Point 10: CRUD Controls for Public Showcase Exams
  const handleAddShowcaseExam = (e) => {
    e.preventDefault();
    if (!newShowcaseCode.trim() || !newShowcaseName.trim()) {
      alert("Kripya Exam Code aur Name enter karein!");
      return;
    }

    const newExam = {
      code: newShowcaseCode.trim().toUpperCase(),
      name: newShowcaseName.trim(),
      pattern: newShowcasePattern.trim() || "Tier-1 (100 Qs / 60 Min)",
      status: newShowcaseStatus
    };

    const updated = [newExam, ...showcaseExams];
    setShowcaseExams(updated);
    localStorage.setItem('cbt_showcase_exams', JSON.stringify(updated));
    setNewShowcaseCode('');
    setNewShowcaseName('');
    setNewShowcasePattern('');
    alert("Demo showcase exam successfully added to landing page!");
  };

  const handleDeleteShowcaseExam = (index) => {
    if (window.confirm("Are you sure you want to remove this exam from the landing showcase?")) {
      const updated = showcaseExams.filter((_, idx) => idx !== index);
      setShowcaseExams(updated);
      localStorage.setItem('cbt_showcase_exams', JSON.stringify(updated));
    }
  };

  const handleSelectTestToEdit = (test) => {
    setSelectedTestId(test.id);
    setEditingTest(JSON.parse(JSON.stringify(test)));
  };

  const handleQuestionTextChange = (qIndex, field, value) => {
    const updated = { ...editingTest };
    updated.questions[qIndex][field] = value;
    setEditingTest(updated);
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const updated = { ...editingTest };
    updated.questions[qIndex].options_en[optIndex] = value;
    if (updated.questions[qIndex].options_hi) {
      updated.questions[qIndex].options_hi[optIndex] = value;
    }
    setEditingTest(updated);
  };

  const handleCorrectIndexChange = (qIndex, correctIdx) => {
    const updated = { ...editingTest };
    updated.questions[qIndex].correct_option_index = correctIdx;
    setEditingTest(updated);
  };

  const handleDeleteQuestion = (qIndex) => {
    const updated = { ...editingTest };
    updated.questions.splice(qIndex, 1);
    setEditingTest(updated);
  };

  const handleAddNewQuestion = () => {
    const updated = { ...editingTest };
    const newQ = {
      id: updated.questions.length + 1,
      question_en: "New Question Statement",
      question_hi: "नया प्रश्न",
      options_en: ["Option 1", "Option 2", "Option 3", "Option 4"],
      options_hi: ["विकल्प 1", "विकल्प 2", "विकल्प 3", "विकल्प 4"],
      correct_option_index: 0,
      subject: "General Studies"
    };
    updated.questions.push(newQ);
    setEditingTest(updated);
  };

  const handleSaveTestChanges = () => {
    editingTest.isRecentlyUpdated = true;
    onUpdateExistingTest(editingTest);
    alert(`✓ "${editingTest.title}" updated successfully!`);
  };

  const handleGeminiJsonImport = () => {
    if (!testTitle.trim()) {
      alert("Kripya Test Title dalein!");
      return;
    }
    if (!jsonInput.trim()) {
      alert("Kripya Gemini ka JSON data paste karein!");
      return;
    }

    try {
      let clean = jsonInput.trim();
      if (clean.startsWith("```json")) clean = clean.slice(7);
      if (clean.startsWith("```")) clean = clean.slice(3);
      if (clean.endsWith("```")) clean = clean.slice(0, -3);

      const parsed = JSON.parse(clean.trim());
      const qList = Array.isArray(parsed) ? parsed : (parsed.questions || []);

      if (qList.length === 0) {
        throw new Error("No valid questions found");
      }

      const newMock = {
        id: `mock-${Date.now()}`,
        title: testTitle,
        duration_mins: parseInt(duration) || 60,
        questions: qList.map((q, idx) => ({
          id: idx + 1,
          question_en: q.question || q.question_en || `Question ${idx + 1}`,
          question_hi: q.question_hi || q.question || q.question_en,
          image: q.image || null,
          options_en: q.options || q.options_en || ['Option A', 'Option B', 'Option C', 'Option D'],
          options_hi: q.options_hi || q.options || q.options_en,
          correct_option_index: typeof q.correct_option_index === 'number' ? q.correct_option_index : 0,
          subject: q.subject || 'SSC CGL Examination'
        }))
      };

      onPublishTest(newMock);
      setStatusMessage(`✓ Success! ${newMock.questions.length} Questions imported cleanly via AI.`);
      setTestTitle('');
      setJsonInput('');
      setActiveTab('live_tests');
    } catch (e) {
      alert("Invalid JSON format! Kripya Gemini se generated valid JSON paste karein.");
    }
  };

  const handlePdfUpload = async () => {
    if (!pdfFile || !testTitle) {
      alert("Kripya Test Title aur PDF file dono select karein!");
      return;
    }

    setUploading(true);
    setStatusMessage('Uploading to Backend & parsing questions...');

    const formData = new FormData();
    formData.append('file', pdfFile);

    try {
      const response = await fetch(`${API_BASE_URL}/api/convert-pdf-to-cbt`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`Backend Status: ${response.status}`);

      const result = await response.json();
      if (result.status === 'success' && result.data) {
        const generatedQuestions = Array.isArray(result.data) ? result.data : result.data.questions || [];

        const newMockTest = {
          id: `mock-${Date.now()}`,
          title: testTitle,
          duration_mins: parseInt(duration) || 60,
          questions: generatedQuestions.map((q, idx) => ({
            id: idx + 1,
            question_en: q.question_en,
            question_hi: q.question_hi || q.question_en,
            image: q.image || null,
            options_en: q.options_en || ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
            options_hi: q.options_hi || q.options_en,
            correct_option_index: q.correct_option_index || 0,
            subject: q.subject || 'SSC CGL Examination'
          }))
        };

        onPublishTest(newMockTest);
        setStatusMessage(`✓ Success! ${newMockTest.questions.length} Questions parsed and synced!`);
        setTestTitle('');
        setPdfFile(null);
        setActiveTab('live_tests');
      } else {
        setStatusMessage('Error parsing questions. Try the "Gemini AI JSON" method.');
      }
    } catch (err) {
      setStatusMessage(`Backend connection timed out. Tip: Use "Gemini AI JSON Importer" above for 100% instant sync!`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              Admin Portal
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">Control Center & Test Question Manager</h1>
          </div>
          <button
            onClick={onBackToHome}
            className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs px-4 py-2 rounded-xl font-bold transition self-end sm:self-auto"
          >
            ← Back to Student Dashboard
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 sm:gap-4">
          <div onClick={() => setActiveTab('students')} className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-4 rounded-2xl cursor-pointer transition">
            <span className="text-xs text-slate-400">Total Registered Students</span>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">{registeredStudents.length}</div>
            <span className="text-[10px] text-slate-500 block mt-1">Click to view roster →</span>
          </div>
          <div onClick={() => setActiveTab('live_tests')} className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-2xl cursor-pointer transition">
            <span className="text-xs text-slate-400">Total Live Tests</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">{existingTests.length}</div>
            <span className="text-[10px] text-emerald-400 font-bold block mt-1">Click to edit questions →</span>
          </div>
          <div onClick={() => setActiveTab('showcase')} className="bg-slate-900 border border-slate-800 hover:border-teal-500/50 p-4 rounded-2xl cursor-pointer transition">
            <span className="text-xs text-slate-400">Demo Showcase Exams</span>
            <div className="text-2xl sm:text-3xl font-black text-teal-400 mt-1">{showcaseExams.length}</div>
            <span className="text-[10px] text-teal-400 font-bold block mt-1">Manage landing cards →</span>
          </div>
          <div onClick={() => setActiveTab('circulars')} className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 p-4 rounded-2xl cursor-pointer transition">
            <span className="text-xs text-slate-400">Active Circulars</span>
            <div className="text-2xl sm:text-3xl font-black text-purple-400 mt-1">{circulars.length}</div>
            <span className="text-[10px] text-purple-400 font-bold block mt-1">Manage announcements →</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <span className="text-xs text-slate-400">AI Engine Support</span>
            <div className="text-xs sm:text-sm font-bold text-emerald-400 mt-2 flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Direct PDF + Gemini JSON Dual Mode</span>
            </div>
          </div>
        </div>

        {/* Tab Header */}
        <div className="flex space-x-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('live_tests')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${activeTab === 'live_tests' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
          >
            📝 Manage Live Tests ({existingTests.length})
          </button>
          <button
            onClick={() => setActiveTab('pdf')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${activeTab === 'pdf' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
          >
            ⚡ Add / Import New Paper
          </button>
          <button
            onClick={() => setActiveTab('showcase')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${activeTab === 'showcase' ? 'bg-teal-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
          >
            🎯 Public Demo Showcase ({showcaseExams.length})
          </button>
          <button
            onClick={() => setActiveTab('circulars')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${activeTab === 'circulars' ? 'bg-purple-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
          >
            📢 Directorate Circulars ({circulars.length})
          </button>
          <button
            onClick={() => { setActiveTab('students'); fetchStudents(); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${activeTab === 'students' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
          >
            👥 Candidate Records ({registeredStudents.length})
          </button>
        </div>

        {/* TAB 1: MANAGE LIVE TESTS */}
        {activeTab === 'live_tests' && (
          <div className="space-y-6">
            {!editingTest ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {existingTests.map((t) => (
                  <div key={t.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-base text-slate-100 mb-1">{t.title}</h3>
                      <div className="text-xs text-slate-400 space-x-3 mb-4">
                        <span>📝 {t.questions?.length || 0} Questions</span>
                        <span>⏱️ {t.duration_mins} Minutes</span>
                      </div>
                    </div>
                    <div className="flex space-x-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => handleSelectTestToEdit(t)}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 rounded-xl text-xs transition"
                      >
                        ✏️ Edit Questions & Key
                      </button>
                      <button
                        onClick={() => onDeleteTest(t.id)}
                        className="bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 px-3 py-2 rounded-xl text-xs font-bold transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Editing Test Questions</span>
                    <h2 className="text-xl font-bold text-white">{editingTest.title}</h2>
                  </div>
                  <div className="flex space-x-3">
                    <button onClick={() => setEditingTest(null)} className="px-3 py-2 border border-slate-700 rounded-xl text-xs font-bold text-slate-300">Close</button>
                    <button onClick={handleSaveTestChanges} className="px-4 py-2 bg-emerald-500 text-slate-950 font-black rounded-xl text-xs">💾 Save Changes</button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-200">Questions ({editingTest.questions?.length || 0})</h3>
                    <button onClick={handleAddNewQuestion} className="bg-slate-800 border border-slate-700 text-emerald-400 text-xs px-3 py-1.5 rounded-lg font-bold">+ Add Question</button>
                  </div>

                  {editingTest.questions?.map((q, qIdx) => (
                    <div key={qIdx} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-emerald-400">Q.{qIdx + 1}</span>
                        <button onClick={() => handleDeleteQuestion(qIdx)} className="text-rose-400 text-xs font-bold">Remove</button>
                      </div>

                      <textarea
                        rows={2}
                        value={q.question_en}
                        onChange={(e) => handleQuestionTextChange(qIdx, 'question_en', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {(q.options_en || []).map((opt, optIdx) => (
                          <div key={optIdx} className={`flex items-center space-x-2 p-2 rounded-xl border ${q.correct_option_index === optIdx ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-slate-800 bg-slate-900'}`}>
                            <input
                              type="radio"
                              name={`correct_${qIdx}`}
                              checked={q.correct_option_index === optIdx}
                              onChange={() => handleCorrectIndexChange(qIdx, optIdx)}
                              className="accent-emerald-400 cursor-pointer"
                            />
                            <span className="text-slate-400 font-bold">{String.fromCharCode(65 + optIdx)}:</span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                              className="w-full bg-transparent outline-none text-slate-200 text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: UPLOAD & SYNC */}
        {activeTab === 'pdf' && (
          <div className="space-y-5">
            <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 max-w-md mx-auto">
              <button
                onClick={() => setUploadMethod('gemini_json')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${uploadMethod === 'gemini_json' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
              >
                ✨ AI / Gemini JSON (100% Instant)
              </button>
              <button
                onClick={() => setUploadMethod('pdf')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${uploadMethod === 'pdf' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
              >
                📄 Raw PDF Upload
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1">Test Title</label>
                <input
                  type="text"
                  placeholder="e.g. SSC CGL 2024 Tier-1 Official Shift 1"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1">Duration (Minutes)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            {uploadMethod === 'gemini_json' ? (
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-2xl space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <span>💡</span> PDF Extract Prompt (Copy & Paste in Gemini with PDF):
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyPrompt}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-3 py-1.5 rounded-lg shadow transition active:scale-95 shrink-0"
                    >
                      {copiedPrompt ? "✓ Copied to Clipboard!" : "📋 Copy Prompt"}
                    </button>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl font-mono text-[11px] text-slate-300 whitespace-pre-wrap select-all max-h-36 overflow-y-auto">
                    {geminiPromptText}
                  </div>
                </div>

                <textarea
                  rows={8}
                  placeholder="Paste Gemini-generated JSON array here..."
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-slate-200 outline-none focus:border-emerald-500"
                />

                <button
                  onClick={handleGeminiJsonImport}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg transition active:scale-95"
                >
                  🚀 Instant Sync Questions to Student Dashboard
                </button>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                <div className="border-2 border-dashed border-slate-700 p-6 rounded-2xl text-center cursor-pointer">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setPdfFile(e.target.files[0])}
                    className="hidden"
                    id="admin-pdf-upload"
                  />
                  <label htmlFor="admin-pdf-upload" className="cursor-pointer block space-y-2">
                    <div className="text-4xl">📥</div>
                    <div className="text-sm font-semibold text-slate-200">
                      {pdfFile ? pdfFile.name : "Click to select Question Paper PDF"}
                    </div>
                  </label>
                </div>

                {statusMessage && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs rounded-xl font-medium">
                    {statusMessage}
                  </div>
                )}

                <button
                  onClick={handlePdfUpload}
                  disabled={uploading}
                  className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg ${uploading ? 'bg-slate-700 text-slate-400' : 'bg-amber-500 hover:bg-amber-600 text-slate-950'}`}
                >
                  {uploading ? 'Processing PDF on Render Backend...' : 'Generate & Sync To Student Dashboard'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PUBLIC TRIAL SHOWCASE EXAMS (Point 10) */}
        {activeTab === 'showcase' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
            <div>
              <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-500/10 border border-teal-500/30 px-2 py-0.5 rounded">
                Public Landing Frameworks
              </span>
              <h3 className="text-lg font-black text-white mt-2">Manage Featured Trial & Demo Exams</h3>
              <p className="text-xs text-slate-400 mt-1">
                Add or remove demo exams shown on the public landing page. Unregistered visitors can click on these to launch sandbox CBT tests instantly.
              </p>
            </div>

            <form onSubmit={handleAddShowcaseExam} className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Exam Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SSC-CGL"
                  value={newShowcaseCode}
                  onChange={(e) => setNewShowcaseCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs uppercase font-mono text-white outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Exam Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Combined Graduate Level"
                  value={newShowcaseName}
                  onChange={(e) => setNewShowcaseName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Pattern Details</label>
                <input
                  type="text"
                  placeholder="e.g. Tier-1 (100 Qs / 60 Min)"
                  value={newShowcasePattern}
                  onChange={(e) => setNewShowcasePattern(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Engine Status Badge</label>
                <select
                  value={newShowcaseStatus}
                  onChange={(e) => setNewShowcaseStatus(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-teal-500"
                >
                  <option value="Active Mock Matrix">Active Mock Matrix</option>
                  <option value="Simulation Ready">Simulation Ready</option>
                  <option value="TCS Engine Active">TCS Engine Active</option>
                  <option value="Certified Setup">Certified Setup</option>
                </select>
              </div>

              <div className="sm:col-span-2 pt-2">
                <button
                  type="submit"
                  className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-black py-2.5 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-teal-500/20"
                >
                  + Add Trial Showcase Exam
                </button>
              </div>
            </form>

            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Featured Showcase Exams ({showcaseExams.length})</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {showcaseExams.map((exam, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                        {exam.code}
                      </span>
                      <h5 className="font-bold text-xs text-white mt-1.5">{exam.name}</h5>
                      <p className="text-[10px] text-slate-400 mt-0.5">{exam.pattern}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteShowcaseExam(idx)}
                      className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DIRECTORATE CIRCULARS */}
        {activeTab === 'circulars' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
            <div>
              <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded">
                Official Announcements Engine
              </span>
              <h3 className="text-lg font-black text-white mt-2">Publish Directorate Circular or Notification</h3>
              <p className="text-xs text-slate-400 mt-1">
                Upload official circulars via PDF or JSON format. These will appear instantly as dynamic announcement blocks above the external website links on the portal.
              </p>
            </div>

            <form onSubmit={handlePublishCircular} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Circular Title / Announcement *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Directorate Notice: Revised Normalization Formula for SSC CGL 2026"
                  value={circularTitle}
                  onChange={(e) => setCircularTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Upload Circular Document (PDF / JSON)</label>
                <input
                  type="file"
                  accept=".pdf,.json"
                  onChange={(e) => setCircularFile(e.target.files[0])}
                  className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-500 file:text-slate-950 hover:file:bg-purple-400 cursor-pointer bg-slate-950 border border-slate-800 rounded-xl p-2"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-3 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-purple-500/20 transition"
              >
                📢 Broadcast Circular to Portal Announcements →
              </button>
            </form>

            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Published Active Circulars ({circulars.length})</h4>
              {circulars.length === 0 ? (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center text-slate-500 text-xs">
                  No active circulars published. The announcement block will remain hidden on the portal.
                </div>
              ) : (
                <div className="space-y-2">
                  {circulars.map((circ) => (
                    <div key={circ.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                          {circ.date}
                        </span>
                        <h5 className="font-bold text-xs text-white mt-1">{circ.title}</h5>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">File: {circ.fileName}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteCircular(circ.id)}
                        className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: CANDIDATE RECORDS */}
        {activeTab === 'students' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-200">Registered Students Roster & Operations</h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={fetchStudents}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold px-3 py-1.5 rounded-lg border border-slate-700 transition"
                >
                  ↻ Refresh Roster
                </button>
                <span className="text-xs text-slate-400">Total: {registeredStudents.length}</span>
              </div>
            </div>
            {registeredStudents.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">Abhi tak koi naya student register nahi hua hai.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3">Roll ID</th>
                      <th className="p-3">Candidate Name</th>
                      <th className="p-3">Email & Phone</th>
                      <th className="p-3">Registered Date</th>
                      <th className="p-3">Current Tier</th>
                      <th className="p-3 text-right">Action Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {registeredStudents.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono text-emerald-400 font-bold">{st.id}</td>
                        <td className="p-3 font-semibold text-slate-100">{st.name}</td>
                        <td className="p-3 text-slate-400">
                          <div>{st.email}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{st.phone || 'N/A'}</div>
                        </td>
                        <td className="p-3 text-slate-500">{st.createdAt || 'N/A'}</td>
                        <td className="p-3">
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            {st.tier || 'FREE'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleRevokeStudent(st.id)}
                            className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-xl font-bold transition text-[11px]"
                          >
                            🗑️ Revoke / Delete
                          </button>
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
    </div>
  );
}
