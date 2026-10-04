import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import StudentDashboard from './components/StudentDashboard';
import CBTExamInterface from './components/CBTExamInterface';
import ExamResultAnalytics from './components/ExamResultAnalytics';
import AdminDashboard from './components/AdminDashboard';
import AuthModal from './components/AuthModal';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('landing');
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [examResults, setExamResults] = useState(null);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [pendingExam, setPendingExam] = useState(null);

  // Restore user session
  useEffect(() => {
    const saved = localStorage.getItem('cbt_logged_user');
    if (saved) setCurrentUser(JSON.parse(saved));
  }, []);

  // Update Photo Handler
  const handleUpdatePhoto = (photoData) => {
    const updated = { ...currentUser, photo: photoData };
    setCurrentUser(updated);
    localStorage.setItem('cbt_logged_user', JSON.stringify(updated));

    const students = JSON.parse(localStorage.getItem('cbt_students') || '[]');
    const modified = students.map((s) => (s.id === currentUser.id ? { ...s, photo: photoData } : s));
    localStorage.setItem('cbt_students', JSON.stringify(modified));
  };

  // Mock Tests State
  const [mockTests, setMockTests] = useState(() => {
    const saved = localStorage.getItem('cbt_all_tests');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'mock-101',
        title: 'TCS iON Pattern - General Studies Mock 1',
        duration_mins: 60,
        isRecentlyUpdated: false,
        questions: [
          {
            id: 1,
            question_en: "Which schedule of the Indian Constitution deals with the allocation of seats in the Rajya Sabha?",
            question_hi: "भारतीय संविधान की कौन सी अनुसूची राज्य सभा में सीटों के आवंटन से संबंधित है?",
            options_en: ["Third Schedule", "Fourth Schedule", "Fifth Schedule", "Sixth Schedule"],
            options_hi: ["तीसरी अनुसूची", "चौथी अनुसूची", "पाँचवीं अनुसूची", "छठी अनुसूची"],
            correct_option_index: 1,
            subject: "Indian Polity"
          },
          {
            id: 2,
            question_en: "Who has the authority to issue currency notes in India?",
            question_hi: "भारत में करेंसी नोट जारी करने का अधिकार किसके पास है?",
            options_en: ["Ministry of Finance", "Reserve Bank of India", "State Bank of India", "NITI Aayog"],
            options_hi: ["वित्त मंत्रालय", "भारतीय रिज़र्व बैंक", "भारतीय स्टेट बैंक", "नीति आयोग"],
            correct_option_index: 1,
            subject: "Economics"
          }
        ]
      }
    ];
  });

  // Past Results State
  const [pastResults, setPastResults] = useState(() => {
    return JSON.parse(localStorage.getItem('cbt_past_results') || '[]');
  });

  // Real-Time Test Handlers
  const handlePublishNewTest = (newTest) => {
    const up = [newTest, ...mockTests];
    setMockTests(up);
    localStorage.setItem('cbt_all_tests', JSON.stringify(up));
  };

  const handleUpdateExistingTest = (updatedTest) => {
    const up = mockTests.map((t) => (t.id === updatedTest.id ? updatedTest : t));
    setMockTests(up);
    localStorage.setItem('cbt_all_tests', JSON.stringify(up));
  };

  const handleDeleteTest = (testId) => {
    if (window.confirm("Are you sure you want to delete this test?")) {
      const up = mockTests.filter((t) => t.id !== testId);
      setMockTests(up);
      localStorage.setItem('cbt_all_tests', JSON.stringify(up));
    }
  };

  // Exam Launch flow
  const handleInitiateExam = (test) => {
    setPendingExam(test);
    setShowDisclaimerModal(true);
  };

  const handleConfirmStartExam = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) elem.requestFullscreen().catch(() => {});
    setSelectedExam(pendingExam);
    setShowDisclaimerModal(false);
    setCurrentScreen('exam');
  };

  const handleSubmitExam = (responses) => {
    let correct = 0;
    let incorrect = 0;
    selectedExam.questions.forEach((q) => {
      const resp = responses[q.id];
      if (resp?.selectedOption === q.correct_option_index) correct++;
      else if (resp?.selectedOption !== undefined) incorrect++;
    });

    const totalScore = (correct * 2.0) - (incorrect * 0.5);
    const accuracy = correct + incorrect > 0 ? ((correct / (correct + incorrect)) * 100).toFixed(1) : 0;

    const newRecord = {
      testId: selectedExam.id,
      testTitle: selectedExam.title,
      score: `${totalScore} / ${selectedExam.questions.length * 2}`,
      accuracy: accuracy,
      date: new Date().toLocaleString('en-GB')
    };

    const updatedResults = [newRecord, ...pastResults];
    setPastResults(updatedResults);
    localStorage.setItem('cbt_past_results', JSON.stringify(updatedResults));

    setExamResults(responses);
    setCurrentScreen('result');
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* 1. Landing Page */}
      {currentScreen === 'landing' && (
        <LandingPage
          onEnterDashboard={() => {
            if (currentUser) setCurrentScreen('dashboard');
            else setShowAuthModal(true);
          }}
          onOpenAdmin={() => setShowAuthModal(true)}
        />
      )}

      {/* 2. Student Dashboard */}
      {currentScreen === 'dashboard' && (
        <StudentDashboard
          student={currentUser}
          tests={mockTests}
          pastResults={pastResults}
          onSelectExamWithDisclaimer={handleInitiateExam}
          onUpdatePhoto={handleUpdatePhoto}
          onLogout={() => {
            localStorage.removeItem('cbt_logged_user');
            setCurrentUser(null);
            setCurrentScreen('landing');
          }}
        />
      )}

      {/* 3. Admin Dashboard */}
      {currentScreen === 'admin' && (
        <AdminDashboard
          existingTests={mockTests}
          onPublishTest={handlePublishNewTest}
          onUpdateExistingTest={handleUpdateExistingTest}
          onDeleteTest={handleDeleteTest}
          onBackToHome={() => setCurrentScreen('dashboard')}
        />
      )}

      {/* 4. CBT Exam Room */}
      {currentScreen === 'exam' && selectedExam && (
        <CBTExamInterface
          testData={selectedExam}
          student={currentUser}
          onSubmitExam={handleSubmitExam}
        />
      )}

      {/* 5. Results Screen */}
      {currentScreen === 'result' && selectedExam && examResults && (
        <ExamResultAnalytics
          testData={selectedExam}
          results={examResults}
          onBackToDashboard={() => {
            setSelectedExam(null);
            setExamResults(null);
            setCurrentScreen('dashboard');
          }}
        />
      )}

      {/* Login Modal */}
      {showAuthModal && (
        <AuthModal
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setShowAuthModal(false);
            setCurrentScreen('dashboard');
          }}
          onAdminLoginSuccess={() => {
            setShowAuthModal(false);
            setCurrentScreen('admin');
          }}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* Pre-Exam Disclaimer / Freeze Modal */}
      {showDisclaimerModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-3xl p-6 text-white shadow-2xl">
            <h2 className="text-xl font-black text-emerald-400 mb-2">Examination Hall Disclaimer & Full-Screen Lock</h2>
            <div className="text-xs text-slate-300 space-y-2 border-y border-slate-800 py-3 my-4 max-h-60 overflow-y-auto">
              <p>• "Begin Test" dabate hi screen full-screen mode me lock ho jayegi.</p>
              <p>• Tab switch ya refresh karne par test auto freeze ho sakta hai.</p>
              <p>• Right-top se kabhi bhi bhasha (Hindi/English) switch ki ja sakti hai.</p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDisclaimerModal(false)}
                className="px-4 py-2 border border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStartExam}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-lg"
              >
                I Agree & Begin Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}