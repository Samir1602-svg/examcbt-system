import React, { useState, useEffect } from 'react';

export default function AdminDashboard({ onPublishTest, onUpdateExistingTest, onDeleteTest, onBackToHome, existingTests = [] }) {
  // Tabs: 'pdf' | 'live_tests' | 'students'
  const [activeTab, setActiveTab] = useState('live_tests'); // Opens tests directly when requested
  const [testTitle, setTestTitle] = useState('');
  const [duration, setDuration] = useState(60);
  const [pdfFile, setPdfFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [registeredStudents, setRegisteredStudents] = useState([]);

  // Selected Test for Editing
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [editingTest, setEditingTest] = useState(null);

  // Load students from localStorage
  useEffect(() => {
    const students = JSON.parse(localStorage.getItem('cbt_students') || '[]');
    setRegisteredStudents(students);
  }, []);

  // When a test is selected to edit
  const handleSelectTestToEdit = (test) => {
    setSelectedTestId(test.id);
    setEditingTest(JSON.parse(JSON.stringify(test))); // Deep clone
  };

  // Modify question field in editing test
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

  // Save changes to test & Real-Time Sync
  const handleSaveTestChanges = () => {
    editingTest.isRecentlyUpdated = true;
    onUpdateExistingTest(editingTest);
    alert(`✓ "${editingTest.title}" successfully updated and synced with Student Dashboard!`);
  };

  // PDF-to-CBT Uploader
  const handlePdfUpload = async () => {
    if (!pdfFile || !testTitle) {
      alert("Test Title aur PDF file dono provide karein!");
      return;
    }

    setUploading(true);
    setStatusMessage('Parsing PDF with Groq / TCS block parser...');

    const formData = new FormData();
    formData.append('file', pdfFile);

    try {
      const response = await fetch('http://localhost:8000/api/convert-pdf-to-cbt', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.status === 'success' && result.data) {
        const generatedQuestions = Array.isArray(result.data) 
          ? result.data 
          : result.data.questions || [];

        const newMockTest = {
          id: `mock-${Date.now()}`,
          title: testTitle,
          duration_mins: parseInt(duration) || 60,
          isRecentlyUpdated: true,
          questions: generatedQuestions.map((q, idx) => ({
            id: idx + 1,
            question_en: q.question_en,
            question_hi: q.question_hi || q.question_en,
            options_en: q.options_en || ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
            options_hi: q.options_hi || q.options_en,
            correct_option_index: q.correct_option_index || 0,
            subject: q.subject || 'General Studies'
          }))
        };

        onPublishTest(newMockTest);
        setStatusMessage('✓ Success! New mock test is generated & live on Student Dashboard.');
        setTestTitle('');
        setPdfFile(null);
        setActiveTab('live_tests');
      } else {
        setStatusMessage('Error parsing questions. Please check backend.');
      }
    } catch (err) {
      setStatusMessage('Error connecting to backend (http://localhost:8000). Ensure uvicorn is running.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Admin Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              Admin Portal
            </span>
            <h1 className="text-2xl font-black text-white mt-1">Control Center & Test Question Manager</h1>
          </div>
          <button
            onClick={onBackToHome}
            className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs px-4 py-2 rounded-xl font-bold transition"
          >
            ← Back to Student Dashboard
          </button>
        </div>

        {/* Top Metric Cards (CLICKABLE) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            onClick={() => setActiveTab('students')}
            className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-5 rounded-2xl cursor-pointer transition"
          >
            <span className="text-xs text-slate-400">Total Registered Students</span>
            <div className="text-3xl font-black text-amber-400 mt-1">{registeredStudents.length}</div>
            <span className="text-[10px] text-slate-500 block mt-1">Click to view roster →</span>
          </div>

          <div 
            onClick={() => setActiveTab('live_tests')}
            className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-5 rounded-2xl cursor-pointer transition"
          >
            <span className="text-xs text-slate-400">Total Live Tests</span>
            <div className="text-3xl font-black text-emerald-400 mt-1">{existingTests.length}</div>
            <span className="text-[10px] text-emerald-400 font-bold block mt-1">Click to view & edit questions →</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs text-slate-400">AI Engine Status</span>
            <div className="text-sm font-bold text-emerald-400 mt-2 flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>TCS Block Parser & Groq Active</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-3 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('live_tests')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'live_tests' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
          >
            📝 Manage Live Tests ({existingTests.length})
          </button>
          <button
            onClick={() => setActiveTab('pdf')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'pdf' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
          >
            📄 Upload & Sync New PDF
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'students' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
          >
            👥 Candidate Records ({registeredStudents.length})
          </button>
        </div>

        {/* TAB 1: MANAGE LIVE TESTS & EDIT QUESTIONS MANUALLY */}
        {activeTab === 'live_tests' && (
          <div className="space-y-6">
            {!editingTest ? (
              // List of all live tests
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
              // Test Question Editor View
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
                <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Editing Test Questions</span>
                    <h2 className="text-xl font-bold text-white">{editingTest.title}</h2>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setEditingTest(null)}
                      className="px-4 py-2 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800"
                    >
                      Close Editor
                    </button>
                    <button
                      onClick={handleSaveTestChanges}
                      className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-lg transition"
                    >
                      💾 Save & Real-Time Sync
                    </button>
                  </div>
                </div>

                {/* Test Meta Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1">Test Title</label>
                    <input
                      type="text"
                      value={editingTest.title}
                      onChange={(e) => setEditingTest({ ...editingTest, title: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1">Duration (Mins)</label>
                    <input
                      type="number"
                      value={editingTest.duration_mins}
                      onChange={(e) => setEditingTest({ ...editingTest, duration_mins: parseInt(e.target.value) || 60 })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm outline-none"
                    />
                  </div>
                </div>

                {/* Questions List */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-200">
                      Questions ({editingTest.questions?.length || 0})
                    </h3>
                    <button
                      onClick={handleAddNewQuestion}
                      className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 text-xs px-3 py-1.5 rounded-lg font-bold"
                    >
                      + Add Question
                    </button>
                  </div>

                  {editingTest.questions?.map((q, qIdx) => (
                    <div key={qIdx} className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-emerald-400">Q.{qIdx + 1}</span>
                        <button
                          onClick={() => handleDeleteQuestion(qIdx)}
                          className="text-rose-400 hover:text-rose-300 text-xs font-bold"
                        >
                          Remove
                        </button>
                      </div>

                      {/* Question Statement */}
                      <textarea
                        rows={2}
                        value={q.question_en}
                        onChange={(e) => handleQuestionTextChange(qIdx, 'question_en', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
                        placeholder="Question text..."
                      />

                      {/* 4 Options & Correct Answer Radio */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        {(q.options_en || []).map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            className={`flex items-center space-x-2 p-2 rounded-xl border ${
                              q.correct_option_index === optIdx 
                                ? 'border-emerald-500/50 bg-emerald-500/10' 
                                : 'border-slate-800 bg-slate-900'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`correct_${qIdx}`}
                              checked={q.correct_option_index === optIdx}
                              onChange={() => handleCorrectIndexChange(qIdx, optIdx)}
                              className="accent-emerald-400 cursor-pointer"
                              title="Set as correct answer"
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

                <div className="flex justify-end pt-4 border-t border-slate-800">
                  <button
                    onClick={handleSaveTestChanges}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-lg transition"
                  >
                    💾 Save All Changes & Sync
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: UPLOAD & SYNC NEW PDF */}
        {activeTab === 'pdf' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1">Test Title</label>
                <input
                  type="text"
                  placeholder="e.g. SSC CGL General Studies Full Mock 02"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1">Duration (Minutes)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <div className="border-2 border-dashed border-slate-700 hover:border-amber-500/50 p-8 rounded-2xl text-center cursor-pointer transition">
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
                  <p className="text-xs text-slate-500">TCS iON Response sheet parser auto extracts ✔ correct answers</p>
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
                className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg ${uploading ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 text-slate-950 transition'}`}
              >
                {uploading ? 'Parsing PDF Questions...' : 'Generate & Sync To Student Dashboard'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: CANDIDATE RECORDS */}
        {activeTab === 'students' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-200">Registered Students Roster</h3>
              <span className="text-xs text-slate-400">Total: {registeredStudents.length}</span>
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
                      <th className="p-3">Email Address</th>
                      <th className="p-3">Registration Date</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {registeredStudents.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono text-emerald-400 font-bold">{st.id}</td>
                        <td className="p-3 font-semibold text-slate-100">{st.name}</td>
                        <td className="p-3 text-slate-400">{st.email}</td>
                        <td className="p-3 text-slate-500">{st.createdAt}</td>
                        <td className="p-3">
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            Active
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
    </div>
  );
}