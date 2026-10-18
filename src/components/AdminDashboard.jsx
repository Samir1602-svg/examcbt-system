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

  // Directorate Circulars Management with PDF Upload Support
  const [circulars, setCirculars] = useState(() => {
    return JSON.parse(localStorage.getItem('cbt_directorate_circulars') || '[]');
  });
  const [circularTitle, setCircularTitle] = useState('');
  const [circularPdfFile, setCircularPdfFile] = useState(null);
  const [circularBase64, setCircularBase64] = useState(null);

  // Payments / UTR Verifications State
  const [paymentsList, setPaymentsList] = useState([]);

  // Showcase Exams
  const [showcaseExams, setShowcaseExams] = useState(() => {
    return JSON.parse(localStorage.getItem('cbt_showcase_exams') || JSON.stringify([
      { code: "SSC-CGL", name: "Combined Graduate Level", pattern: "Tier-1 (100 Qs / 60 Min)", status: "Active Mock Matrix" },
      { code: "SSC-CHSL", name: "Combined Higher Secondary", pattern: "Tier-1 (100 Qs / 60 Min)", status: "Simulation Ready" },
      { code: "RRB-NTPC", name: "Non-Technical Popular", pattern: "CBT-1 (100 Qs / 60 Min)", status: "TCS Engine Active" },
      { code: "SSC-CPO", name: "Central Police Organization", pattern: "Paper-1 (100 Qs / 60 Min)", status: "Certified Setup" }
    ]));
  });
  const [newShowcaseCode, setNewShowcaseCode] = useState('');
  const [newShowcaseName, setNewShowcaseName] = useState('');
  const [newShowcasePattern, setNewShowcasePattern] = useState('');
  const [newShowcaseStatus, setNewShowcaseStatus] = useState('Simulation Ready');

  // Grievance / Feedback Desk Management States
  const [grievances, setGrievances] = useState([]);

  // Selected Test for Editing
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [editingTest, setEditingTest] = useState(null);

  // Official AI PDF Extraction Prompt
  const aiExtractionPrompt = `Analyze the attached examination question paper PDF and extract all questions into a pure, valid UTF-8 JSON array strictly adhering to this structure. Do not output any markdown notes, preamble, or conversational commentary outside the JSON array:

[
  {
    "question": "Exact question text in Hindi or English (Preserve all formulas, indices, equations, and unicode symbols)",
    "options": [
      "Option 1 text",
      "Option 2 text",
      "Option 3 text",
      "Option 4 text"
    ],
    "correct_option_index": 0,
    "subject": "Mathematical Abilities / Reasoning / General Studies / English"
  }
]

Crucial Formatting Rules:
1. "correct_option_index" must be an integer: 0 for Option 1, 1 for Option 2, 2 for Option 3, or 3 for Option 4.
2. Escape all internal double quotes inside sentences using \\" (e.g., \\"sample text\\").
3. Ensure Hindi unicode characters and mathematical symbols are cleanly preserved without truncation.`;

  const handleCopyAIPrompt = () => {
    navigator.clipboard.writeText(aiExtractionPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 3000);
  };

  // Pure Central Cloud Database Sync (Zero Local Merging)
  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/students`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success' && Array.isArray(data.students)) {
          setRegisteredStudents(data.students);
          localStorage.setItem('cbt_students', JSON.stringify(data.students));
        }
      }
    } catch (e) {
      console.warn("Could not fetch remote students from central cloud DB:", e);
    }
  };

  const fetchGrievances = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/grievances`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success' && Array.isArray(data.grievances)) {
          setGrievances(data.grievances);
          localStorage.setItem('cbt_user_feedbacks', JSON.stringify(data.grievances));
        }
      }
    } catch (e) {
      console.warn("Could not fetch remote grievances from central cloud DB:", e);
    }
  };

  // Central Payment / UTR Requests Sync
  const fetchPayments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/payments`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success' && Array.isArray(data.payments)) {
          setPaymentsList(data.payments);
        }
      }
    } catch (e) {
      console.warn("Could not fetch central payment requests:", e);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchGrievances();
    fetchPayments();
  }, [activeTab]);

  // Approve Payment and Activate Tier
  const handleApprovePayment = async (paymentId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/payments/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: paymentId }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        alert(data.message || "Payment approved and candidate tier activated!");
        fetchPayments();
        fetchStudents();
      } else {
        alert(data.detail || "Error approving payment.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error approving payment.");
    }
  };

  // Reject Payment
  const handleRejectPayment = async (paymentId) => {
    if (!window.confirm("Are you sure you want to reject this payment receipt?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/payments/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: paymentId }),
      });
      if (res.ok) {
        fetchPayments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveGrievance = async (gId) => {
    const updated = grievances.map(g => g.id === gId ? { ...g, status: 'RESOLVED' } : g);
    setGrievances(updated);
    try {
      await fetch(`${API_BASE_URL}/api/grievances/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: gId })
      });
      fetchGrievances();
    } catch (e) {
      console.warn("Remote resolve status sync error:", e);
    }
  };

  const handleDeleteGrievance = (gId) => {
    if (window.confirm("Are you sure you want to permanently delete this grievance record?")) {
      const updated = grievances.filter(g => g.id !== gId);
      setGrievances(updated);
      localStorage.setItem('cbt_user_feedbacks', JSON.stringify(updated));
    }
  };

  const handleSelectTestToEdit = (test) => {
    setSelectedTestId(test.id);
    setEditingTest(JSON.parse(JSON.stringify(test)));
  };

  const handleQuestionTextChange = (qIndex, value) => {
    const updated = { ...editingTest };
    updated.questions[qIndex].question = value;
    updated.questions[qIndex].question_en = value;
    updated.questions[qIndex].question_hi = value;
    setEditingTest(updated);
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const updated = { ...editingTest };
    if (!updated.questions[qIndex].options) updated.questions[qIndex].options = [];
    updated.questions[qIndex].options[optIndex] = value;
    if (updated.questions[qIndex].options_en) updated.questions[qIndex].options_en[optIndex] = value;
    if (updated.questions[qIndex].options_hi) updated.questions[qIndex].options_hi[optIndex] = value;
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

  // Manual Diagram Upload, Clipboard Paste (Ctrl+V), Remove & Option Figure Helpers
  const handleQuestionImageUpdate = (qIndex, base64Data) => {
    const updated = { ...editingTest };
    updated.questions[qIndex].image = base64Data;
    setEditingTest(updated);
  };

  const handleQuestionImageFileChange = (qIndex, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      handleQuestionImageUpdate(qIndex, reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleQuestionImagePaste = (qIndex, e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        e.preventDefault();
        const blob = items[i].getAsFile();
        const reader = new FileReader();
        reader.onloadend = () => {
          handleQuestionImageUpdate(qIndex, reader.result);
        };
        reader.readAsDataURL(blob);
        break;
      }
    }
  };

  const handleSetStandardFigureOptions = (qIndex) => {
    const updated = { ...editingTest };
    const stdEn = ["Option 1", "Option 2", "Option 3", "Option 4"];
    const stdHi = ["विकल्प 1", "विकल्प 2", "विकल्प 3", "विकल्प 4"];
    updated.questions[qIndex].options = [...stdEn];
    updated.questions[qIndex].options_en = [...stdEn];
    updated.questions[qIndex].options_hi = [...stdHi];
    setEditingTest(updated);
  };

  const handleOptionImageFileChange = (qIndex, optIndex, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const mdImg = `![Option ${optIndex + 1}](${reader.result})`;
      handleOptionChange(qIndex, optIndex, mdImg);
    };
    reader.readAsDataURL(file);
  };

  const handleAddNewQuestion = () => {
    const updated = { ...editingTest };
    const newQ = {
      id: updated.questions.length + 1,
      question: "New Question Statement",
      question_en: "New Question Statement",
      question_hi: "नया प्रश्न विवरण",
      options: ["Option 1", "Option 2", "Option 3", "Option 4"],
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
    alert(`Success: "${editingTest.title}" has been updated successfully.`);
  };

  // Bulletproof Auto-Repairing JSON Parser
  const sanitizeAndParseJSON = (rawStr) => {
    let clean = rawStr.trim();
    if (clean.startsWith("```json")) clean = clean.slice(7);
    if (clean.startsWith("```")) clean = clean.slice(3);
    if (clean.endsWith("```")) clean = clean.slice(0, -3);
    clean = clean.trim();

    if (!clean.startsWith("[") && clean.endsWith("]")) {
      clean = "[" + clean;
    } else if (clean.startsWith("[") && !clean.endsWith("]")) {
      clean = clean + "]";
    } else if (!clean.startsWith("[") && !clean.endsWith("]")) {
      clean = "[" + clean + "]";
    }

    clean = clean.replace(/[\u201C\u201D]/g, '"');
    clean = clean.replace(/[\u2018\u2019]/g, "'");
    clean = clean.replace(/,\s*([\]}])/g, '$1');

    try {
      return JSON.parse(clean);
    } catch (e1) {
      try {
        const sanitized = clean.replace(/("(?:question|subject)":\s*")([\s\S]*?)("(?=,\s*"\w+":|\s*}))/g, (match, prefix, content, suffix) => {
          const safeContent = content.replace(/(?<!\\)"/g, '\\"');
          return `${prefix}${safeContent}${suffix}`;
        });
        return JSON.parse(sanitized);
      } catch (e2) {
        throw new Error("JSON Parse Error");
      }
    }
  };

  const handleGeminiJsonImport = () => {
    if (!testTitle.trim()) {
      alert("Validation Error: Please enter a Test Title before proceeding.");
      return;
    }
    if (!jsonInput.trim()) {
      alert("Validation Error: Please paste the JSON question array.");
      return;
    }

    try {
      const parsed = sanitizeAndParseJSON(jsonInput);
      const qList = Array.isArray(parsed) ? parsed : (parsed.questions || [parsed]);

      if (qList.length === 0) {
        throw new Error("No valid questions found");
      }

      const newMock = {
        id: `mock-${Date.now()}`,
        title: testTitle.trim(),
        duration_mins: parseInt(duration) || 60,
        questions: qList.map((q, idx) => {
          const mainText = q.question || q.question_hi || q.question_en || `Question ${idx + 1}`;
          const optionsArr = q.options || q.options_hi || q.options_en || ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
          
          return {
            id: idx + 1,
            question: mainText,
            question_hi: q.question_hi || mainText,
            question_en: q.question_en || mainText,
            image: q.image || null,
            options: optionsArr,
            options_hi: q.options_hi || optionsArr,
            options_en: q.options_en || optionsArr,
            correct_option_index: typeof q.correct_option_index === 'number' ? q.correct_option_index : 0,
            subject: q.subject || 'Standard Examination Paper'
          };
        })
      };

      onPublishTest(newMock);
      setStatusMessage(`Success: ${newMock.questions.length} questions imported cleanly.`);
      setTestTitle('');
      setJsonInput('');
      setActiveTab('live_tests');
      alert(`Success: "${newMock.title}" containing ${newMock.questions.length} questions has been successfully published.`);
    } catch (e) {
      alert("JSON Syntax Error: Please check your JSON format.");
    }
  };

  const handlePdfUpload = async () => {
    if (!pdfFile || !testTitle) {
      alert("Validation Error: Both Test Title and PDF file are required.");
      return;
    }

    setUploading(true);
    setStatusMessage('Uploading document to server and parsing questions...');

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
          title: testTitle.trim(),
          duration_mins: parseInt(duration) || 60,
          questions: generatedQuestions.map((q, idx) => ({
            id: idx + 1,
            question: q.question_en,
            question_en: q.question_en,
            question_hi: q.question_hi || q.question_en,
            image: q.image || null,
            options: q.options_en || ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
            options_en: q.options_en || ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
            options_hi: q.options_hi || q.options_en,
            correct_option_index: q.correct_option_index || 0,
            subject: q.subject || 'SSC CGL Examination'
          }))
        };

        onPublishTest(newMockTest);
        setTestTitle('');
        setPdfFile(null);
        setActiveTab('live_tests');
        alert(`Success: "${newMockTest.title}" published with ${newMockTest.questions.length} questions.`);
      }
    } catch (err) {
      setStatusMessage(`PDF Font Encoding Error: Please use the "AI / JSON" tab for Unicode Hindi papers.`);
    } finally {
      setUploading(false);
    }
  };

  const handleAddShowcaseExam = (e) => {
    e.preventDefault();
    if (!newShowcaseCode.trim() || !newShowcaseName.trim()) return;

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
    alert("Success: Demo showcase card successfully added.");
  };

  const handleDeleteShowcaseExam = (index) => {
    if (window.confirm("Are you sure you want to remove this showcase exam?")) {
      const updated = showcaseExams.filter((_, idx) => idx !== index);
      setShowcaseExams(updated);
      localStorage.setItem('cbt_showcase_exams', JSON.stringify(updated));
    }
  };

  // Circular PDF File Reader (Converts to Data URL for instant viewing)
  const handleCircularPdfSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCircularPdfFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setCircularBase64(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Publish Circular with PDF Support
  const handlePublishCircular = (e) => {
    e.preventDefault();
    if (!circularTitle.trim()) {
      alert("Please provide the Circular Notice Title.");
      return;
    }

    const newCircular = {
      id: `circ-${Date.now()}`,
      title: circularTitle.trim(),
      fileName: circularPdfFile ? circularPdfFile.name : "Notice_Document.pdf",
      pdfUrl: circularBase64 || null,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    };

    const updated = [newCircular, ...circulars];
    setCirculars(updated);
    localStorage.setItem('cbt_directorate_circulars', JSON.stringify(updated));
    setCircularTitle('');
    setCircularPdfFile(null);
    setCircularBase64(null);
    alert("Success: Directorate circular with PDF attachment published to announcements!");
  };

  const handleDeleteCircular = (circId) => {
    if (window.confirm("Are you sure you want to delete this circular announcement?")) {
      const updated = circulars.filter(c => c.id !== circId);
      setCirculars(updated);
      localStorage.setItem('cbt_directorate_circulars', JSON.stringify(updated));
    }
  };

  const handleOpenCircularPdf = (pdfUrl, title) => {
    if (!pdfUrl) {
      alert("No PDF document was attached to this circular.");
      return;
    }
    const pdfWindow = window.open("");
    pdfWindow.document.write(
      `<title>${title || 'Directorate Circular'}</title><iframe width='100%' height='100%' style='border:none;' src='${pdfUrl}'></iframe>`
    );
  };

  const handleRevokeStudent = (studentId) => {
    if (window.confirm("Are you sure you want to permanently revoke authorization for this candidate?")) {
      const updated = registeredStudents.filter(s => s.id !== studentId);
      setRegisteredStudents(updated);
      localStorage.setItem('cbt_students', JSON.stringify(updated));
      alert("Candidate access has been revoked.");
    }
  };

  const pendingGrievancesCount = grievances.filter(g => g.status !== 'RESOLVED').length;
  const pendingPaymentsCount = paymentsList.filter(p => p.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              Directorate Operations Console
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">Control Center & Test Question Manager</h1>
          </div>
          <button
            onClick={onBackToHome}
            className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs px-4 py-2 rounded-xl font-bold transition"
          >
            ← Back to Student Dashboard
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 sm:gap-4">
          
          {/* Payments Approvals Metric */}
          <div onClick={() => setActiveTab('payments')} className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-2xl cursor-pointer transition">
            <span className="text-xs text-slate-400">Payment Approvals</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
              {pendingPaymentsCount} <span className="text-xs text-slate-500 font-normal">Pending</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold block mt-1">Verify UPI UTR receipts →</span>
          </div>

          <div onClick={() => setActiveTab('grievances')} className="bg-slate-900 border border-slate-800 hover:border-rose-500/50 p-4 rounded-2xl cursor-pointer transition">
            <span className="text-xs text-slate-400">Support Grievances</span>
            <div className="text-2xl sm:text-3xl font-black text-rose-400 mt-1">{pendingGrievancesCount} <span className="text-xs text-slate-500 font-normal">Pending</span></div>
            <span className="text-[10px] text-rose-400 font-bold block mt-1">Resolve candidate tickets →</span>
          </div>

          <div onClick={() => setActiveTab('students')} className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-4 rounded-2xl cursor-pointer transition">
            <span className="text-xs text-slate-400">Total Registered</span>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">{registeredStudents.length}</div>
            <span className="text-[10px] text-slate-500 block mt-1">View roster →</span>
          </div>

          <div onClick={() => setActiveTab('live_tests')} className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-2xl cursor-pointer transition">
            <span className="text-xs text-slate-400">Live Mock Tests</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">{existingTests.length}</div>
            <span className="text-[10px] text-emerald-400 font-bold block mt-1">Edit questions →</span>
          </div>

          <div onClick={() => setActiveTab('showcase')} className="bg-slate-900 border border-slate-800 hover:border-teal-500/50 p-4 rounded-2xl cursor-pointer transition">
            <span className="text-xs text-slate-400">Demo Showcase</span>
            <div className="text-2xl sm:text-3xl font-black text-teal-400 mt-1">{showcaseExams.length}</div>
            <span className="text-[10px] text-teal-400 font-bold block mt-1">Landing cards →</span>
          </div>

          <div onClick={() => setActiveTab('circulars')} className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 p-4 rounded-2xl cursor-pointer transition">
            <span className="text-xs text-slate-400">Circulars</span>
            <div className="text-2xl sm:text-3xl font-black text-purple-400 mt-1">{circulars.length}</div>
            <span className="text-[10px] text-purple-400 font-bold block mt-1">Announcements & PDFs →</span>
          </div>
        </div>

        {/* Tab Header */}
        <div className="flex space-x-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('pdf')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${activeTab === 'pdf' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
          >
            ⚡ Add / Import New Paper
          </button>

          <button
            onClick={() => { setActiveTab('payments'); fetchPayments(); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${activeTab === 'payments' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
          >
            💳 UPI Payment Approvals ({pendingPaymentsCount > 0 ? `${pendingPaymentsCount} PENDING` : paymentsList.length})
          </button>

          <button
            onClick={() => setActiveTab('live_tests')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${activeTab === 'live_tests' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
          >
            📝 Manage Live Tests ({existingTests.length})
          </button>

          <button
            onClick={() => { setActiveTab('grievances'); fetchGrievances(); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${activeTab === 'grievances' ? 'bg-rose-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
          >
            📩 Grievances & Support ({grievances.length})
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
            📢 Directorate Circulars & PDFs ({circulars.length})
          </button>

          <button
            onClick={() => { setActiveTab('students'); fetchStudents(); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${activeTab === 'students' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
          >
            👥 Candidate Records ({registeredStudents.length})
          </button>
        </div>

        {/* TAB: UPI PAYMENT APPROVALS & UTR VERIFICATIONS */}
        {activeTab === 'payments' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="font-black text-base text-white">Direct UPI Payment Verifications & UTR Ledger</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Payments received at <strong className="text-emerald-400 font-mono">dcgamers00876@okicici</strong>. Verify the 12-digit UTR in your bank app and approve access.
                </p>
              </div>
              <button 
                onClick={fetchPayments} 
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-xl font-bold transition"
              >
                🔄 Refresh Ledger
              </button>
            </div>

            {paymentsList.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs bg-slate-950 rounded-xl border border-slate-800">
                No payment requests or UTR submissions registered yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[11px]">
                    <tr>
                      <th className="p-3">Candidate</th>
                      <th className="p-3">Requested Tier</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Submitted UTR / Ref No</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-sans">
                    {paymentsList.map((p) => {
                      const isPending = p.status === 'PENDING';
                      return (
                        <tr key={p.id} className="hover:bg-slate-950/40 transition">
                          <td className="p-3">
                            <span className="font-bold text-white block">{p.name}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{p.studentId} • {p.email}</span>
                          </td>
                          <td className="p-3 font-semibold text-amber-300">
                            {p.tierName || (p.tier === 'ADVANCED' ? 'Advanced Pro Vault' : 'Standard Premium')}
                          </td>
                          <td className="p-3 font-black text-emerald-400 text-sm">
                            ₹{p.amount}.00
                          </td>
                          <td className="p-3">
                            <span className="font-mono bg-slate-950 px-2 py-1 rounded text-amber-400 border border-slate-800 select-all font-bold">
                              {p.utr}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400 font-mono text-[11px]">{p.date}</td>
                          <td className="p-3">
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                              p.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                              p.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' :
                              'bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-2 whitespace-nowrap">
                            {isPending ? (
                              <>
                                <button
                                  onClick={() => handleApprovePayment(p.id)}
                                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-3 py-1.5 rounded-lg text-xs shadow-md transition active:scale-95"
                                  title="Approve payment & activate candidate subscription immediately"
                                >
                                  ✓ Approve & Activate
                                </button>
                                <button
                                  onClick={() => handleRejectPayment(p.id)}
                                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold px-2.5 py-1.5 rounded-lg text-xs transition"
                                  title="Reject invalid UTR"
                                >
                                  ✕ Reject
                                </button>
                              </>
                            ) : (
                              <span className="text-[11px] text-slate-500 italic">Settled</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB: UPLOAD / IMPORT PAPER */}
        {activeTab === 'pdf' && (
          <div className="space-y-5">
            <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 max-w-md mx-auto">
              <button
                onClick={() => setUploadMethod('gemini_json')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${uploadMethod === 'gemini_json' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
              >
                ✨ AI / JSON (Clean Unicode Hindi)
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
                <label className="text-xs text-slate-400 font-bold block mb-1">Test Title *</label>
                <input
                  type="text"
                  placeholder="e.g. SSC CGL Tier-1 Hindi Shift Assessment"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1">Duration (Minutes) *</label>
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
                
                {/* AI Extraction Prompt Helper Card */}
                <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-2xl space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <span>🤖</span> AI Prompt for PDF Extraction (Upload PDF to ChatGPT/Gemini with this prompt):
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyAIPrompt}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-lg shadow transition active:scale-95 shrink-0"
                    >
                      {copiedPrompt ? "✓ Copied to Clipboard!" : "📋 Copy AI Extraction Prompt"}
                    </button>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl font-mono text-[11px] text-slate-300 whitespace-pre-wrap select-all max-h-36 overflow-y-auto">
                    {aiExtractionPrompt}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">Paste JSON Array Data *</label>
                  <textarea
                    rows={10}
                    placeholder='Paste sanitized JSON array here... e.g. [{"question": "...", "options": [...], "correct_option_index": 0}]'
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-slate-200 outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  onClick={handleGeminiJsonImport}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg transition active:scale-95"
                >
                  🚀 Publish Validated Questions to Portal
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
                  {uploading ? 'Processing Document on Server...' : 'Generate & Publish Paper'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB: MANAGE LIVE TESTS */}
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
                        ✏️ Edit Questions
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
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Editing Active Assessment</span>
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
                    <div
                      key={qIdx}
                      onPaste={(e) => handleQuestionImagePaste(qIdx, e)}
                      className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3 focus-within:border-emerald-500/40 transition"
                    >
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <span className="text-xs font-bold text-emerald-400">Q.{qIdx + 1}</span>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleSetStandardFigureOptions(qIdx)}
                            className="bg-slate-900 hover:bg-slate-800 text-teal-400 border border-teal-500/30 px-2.5 py-1 rounded-lg text-[10px] font-bold transition"
                            title="Reset options to Option 1, Option 2, Option 3, Option 4"
                          >
                            ⚡ Set Figure Options (1-4)
                          </button>
                          <label className="bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition">
                            🖼️ {q.image ? "Replace Diagram" : "Upload Diagram"}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleQuestionImageFileChange(qIdx, e)}
                              className="hidden"
                            />
                          </label>
                          {q.image && (
                            <button
                              type="button"
                              onClick={() => handleQuestionImageUpdate(qIdx, null)}
                              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-1 rounded-lg text-[10px] font-bold transition"
                            >
                              🗑️ Remove Diagram
                            </button>
                          )}
                          <button onClick={() => handleDeleteQuestion(qIdx)} className="text-rose-400 text-xs font-bold pl-2">Remove Q</button>
                        </div>
                      </div>

                      <textarea
                        rows={3}
                        value={q.question || q.question_hi || q.question_en}
                        onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                        placeholder="Question text (Tip: You can also press Ctrl+V here to paste a snipped diagram image directly)"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none"
                      />

                      {/* Question Diagram Preview & Paste Zone */}
                      {q.image ? (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col items-center space-y-2">
                          <img src={q.image} alt={`Q.${qIdx + 1} Diagram`} className="max-h-48 object-contain rounded bg-white p-1" />
                          <span className="text-[10px] text-slate-400">Tip: Click this question card and press Ctrl+V to replace with a new snipped screenshot</span>
                        </div>
                      ) : (
                        <div className="border border-dashed border-slate-800 rounded-xl p-2 text-center text-[10px] text-slate-500">
                          💡 Snipping Tool Tip: Take a screenshot (<kbd className="bg-slate-900 px-1 py-0.5 rounded text-slate-300">Win + Shift + S</kbd>), click anywhere on this question card, and press <kbd className="bg-slate-900 px-1 py-0.5 rounded text-slate-300">Ctrl + V</kbd> to attach diagram.
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {(q.options || q.options_hi || q.options_en || []).map((opt, optIdx) => (
                          <div key={optIdx} className={`flex items-center space-x-2 p-2 rounded-xl border ${q.correct_option_index === optIdx ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-slate-800 bg-slate-900'}`}>
                            <input
                              type="radio"
                              name={`correct_${qIdx}`}
                              checked={q.correct_option_index === optIdx}
                              onChange={() => handleCorrectIndexChange(qIdx, optIdx)}
                              className="accent-emerald-400 cursor-pointer shrink-0"
                            />
                            <span className="text-slate-400 font-bold shrink-0">{String.fromCharCode(65 + optIdx)}:</span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                              className="w-full bg-transparent outline-none text-slate-200 text-xs"
                            />
                            <label
                              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                              title="Upload image for this option"
                            >
                              🖼️
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleOptionImageFileChange(qIdx, optIdx, e)}
                                className="hidden"
                              />
                            </label>
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

        {/* TAB: GRIEVANCES */}
        {activeTab === 'grievances' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-4">
            <h3 className="font-bold text-sm text-slate-200 mb-3">Candidate Grievances & Resolution Desk ({grievances.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400">
                  <tr>
                    <th className="p-3">Candidate</th>
                    <th className="p-3">Grievance Statement</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {grievances.map((item) => (
                    <tr key={item.id}>
                      <td className="p-3 font-semibold">{item.fullName} ({item.email})</td>
                      <td className="p-3 text-slate-300">{item.feedback}</td>
                      <td className="p-3 font-bold">{item.status}</td>
                      <td className="p-3 text-right">
                        {item.status !== 'RESOLVED' && (
                          <button onClick={() => handleResolveGrievance(item.id)} className="bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded text-xs font-bold mr-2">✓ Resolve</button>
                        )}
                        <button onClick={() => handleDeleteGrievance(item.id)} className="text-rose-400 text-xs">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: PUBLIC SHOWCASE EXAMS */}
        {activeTab === 'showcase' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <h3 className="text-lg font-black text-white">Manage Landing Page Showcase Cards</h3>
            <form onSubmit={handleAddShowcaseExam} className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <input type="text" placeholder="Exam Code (e.g. SSC-CGL)" value={newShowcaseCode} onChange={(e) => setNewShowcaseCode(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
              <input type="text" placeholder="Exam Full Title" value={newShowcaseName} onChange={(e) => setNewShowcaseName(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
              <input type="text" placeholder="Pattern Structure (e.g. Tier-1 (100 Qs / 60 Min))" value={newShowcasePattern} onChange={(e) => setNewShowcasePattern(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
              <button type="submit" className="bg-teal-500 text-slate-950 font-black py-2 rounded-xl text-xs sm:col-span-2">+ Add Showcase Card</button>
            </form>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {showcaseExams.map((exam, idx) => (
                <div key={idx} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-mono text-teal-400">{exam.code}</span>
                    <h5 className="font-bold text-xs text-white">{exam.name}</h5>
                  </div>
                  <button onClick={() => handleDeleteShowcaseExam(idx)} className="text-rose-400 text-xs font-bold">Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: CIRCULARS WITH PDF UPLOAD & CLICK-TO-VIEW */}
        {activeTab === 'circulars' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-lg font-black text-white">Publish Directorate Circulars & Policy PDFs</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload official notification notices with attached PDF documents for public candidate verification.
              </p>
            </div>

            <form onSubmit={handlePublishCircular} className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">Circular Notice Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Examination Cancellation / Re-scheduling Directorate Circular 2026"
                  value={circularTitle}
                  onChange={(e) => setCircularTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">Attach Official PDF Document</label>
                <div className="border border-dashed border-slate-700 p-4 rounded-xl text-center bg-slate-900/50">
                  <input
                    type="file"
                    accept="application/pdf"
                    id="circular-pdf-file"
                    onChange={handleCircularPdfSelect}
                    className="hidden"
                  />
                  <label htmlFor="circular-pdf-file" className="cursor-pointer block">
                    <span className="text-2xl block mb-1">📑</span>
                    <span className="text-xs text-purple-400 font-bold hover:underline">
                      {circularPdfFile ? circularPdfFile.name : "Click to select and attach Circular PDF document"}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Format: PDF (Max size 5MB recommended)</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-purple-600/20 active:scale-95"
              >
                Publish Circular Notice & PDF →
              </button>
            </form>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Published Directorate Circulars ({circulars.length})</h4>
              {circulars.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
                  No circular notifications published yet.
                </div>
              ) : (
                circulars.map((c) => (
                  <div key={c.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
                          {c.date}
                        </span>
                        {c.pdfUrl && (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            PDF Attached
                          </span>
                        )}
                      </div>
                      <h5 className="font-bold text-sm text-white">{c.title}</h5>
                      <span className="text-[11px] text-slate-500 font-mono block">{c.fileName}</span>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-auto">
                      {c.pdfUrl ? (
                        <button
                          type="button"
                          onClick={() => handleOpenCircularPdf(c.pdfUrl, c.title)}
                          className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-bold px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5"
                        >
                          <span>📄</span> Open PDF
                        </button>
                      ) : (
                        <span className="text-xs text-slate-600 italic">No PDF</span>
                      )}
                      <button
                        onClick={() => handleDeleteCircular(c.id)}
                        className="text-rose-400 hover:text-rose-300 text-xs font-bold p-1.5"
                        title="Delete circular"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB: CANDIDATE RECORDS */}
        {activeTab === 'students' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-4">
            <h3 className="font-bold text-sm text-slate-200 mb-3">Registered Candidates Roster ({registeredStudents.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400">
                  <tr>
                    <th className="p-3">Roll ID</th>
                    <th className="p-3">Candidate Name</th>
                    <th className="p-3">Registered Email</th>
                    <th className="p-3">Access Tier</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {registeredStudents.map((st) => (
                    <tr key={st.id}>
                      <td className="p-3 font-mono text-emerald-400">{st.id}</td>
                      <td className="p-3 font-semibold">{st.name}</td>
                      <td className="p-3 text-slate-400">{st.email}</td>
                      <td className="p-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          st.tier === 'ADVANCED' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                          st.tier === 'BASIC' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {st.tier || 'FREE'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button onClick={() => handleRevokeStudent(st.id)} className="text-rose-400 text-xs font-bold">Revoke Access</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
