import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import StudentDashboard from './components/StudentDashboard';
import CBTExamInterface from './components/CBTExamInterface';
import ExamResultAnalytics from './components/ExamResultAnalytics';
import AdminDashboard from './components/AdminDashboard';
import CombinedAuthModal from './components/AuthModal';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'https://examcbt-backend.onrender.com').replace(/\/$/, "");

const DEFAULT_INITIAL_TESTS = [
  {
    id: 'mock-cgl-default',
    title: 'TCS iON Pattern - General Studies Mock 1',
    duration_mins: 60,
    questions: [
      {
        id: 1,
        question_en: "Which Article of the Indian Constitution provides for the establishment of the Finance Commission?",
        question_hi: "भारतीय संविधान का कौन सा अनुच्छेद वित्त आयोग की स्थापना का प्रावधान करता है?",
        image: null,
        options_en: ["Article 280", "Article 324", "Article 352", "Article 370"],
        options_hi: ["अनुच्छेद 280", "अनुच्छेद 324", "अनुच्छेद 352", "अनुच्छेद 370"],
        correct_option_index: 0,
        subject: "General Awareness"
      },
      {
        id: 2,
        question_en: "Select the most appropriate synonym of the given word: Feeble",
        question_hi: "दिए गए शब्द का सबसे उपयुक्त पर्यायवाची चुनें: Feeble",
        image: null,
        options_en: ["Unheedful", "Strong", "Weak", "Baneful"],
        options_hi: ["Unheedful", "Strong", "Weak", "Baneful"],
        correct_option_index: 2,
        subject: "English Language"
      }
    ]
  }
];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('landing');
  const [activeTest, setActiveTest] = useState(null);
  const [examResultData, setExamResultData] = useState(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(() => {
    const saved = localStorage.getItem('cbt_active_student');
    return saved ? JSON.parse(saved) : null;
  });

  const [mockTests, setMockTests] = useState(() => {
    const saved = localStorage.getItem('cbt_mock_tests');
    return saved ? JSON.parse(saved) : DEFAULT_INITIAL_TESTS;
  });

  // Cloud backend sync
  useEffect(() => {
    const fetchCentralCloudTests = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/tests`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success' && Array.isArray(data.tests) && data.tests.length > 0) {
            setMockTests(data.tests);
            localStorage.setItem('cbt_mock_tests', JSON.stringify(data.tests));
          }
        }
      } catch (err) {
        console.warn("Using offline tests fallback");
      }
    };
    fetchCentralCloudTests();
  }, []);

  const handleStudentLoginSuccess = (studentObj) => {
    setCurrentStudent(studentObj);
    localStorage.setItem('cbt_active_student', JSON.stringify(studentObj));
    setIsAuthModalOpen(false);
    setCurrentScreen('student_dashboard');
  };

  const handleAdminLoginSuccess = () => {
    setIsAuthModalOpen(false);
    setCurrentScreen('admin');
  };

  const handleStudentLogout = () => {
    setCurrentStudent(null);
    localStorage.removeItem('cbt_active_student');
    setCurrentScreen('landing');
  };

  const handlePublishNewTest = async (newTest) => {
    setMockTests((prev) => [newTest, ...prev]);
    try {
      await fetch(`${API_BASE_URL}/api/tests/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTest),
      });
    } catch (e) {
      console.warn("Cloud sync error:", e);
    }
  };

  const handleUpdateExistingTest = async (updatedTest) => {
    setMockTests((prev) => prev.map((t) => (t.id === updatedTest.id ? updatedTest : t)));
    try {
      await fetch(`${API_BASE_URL}/api/tests/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTest),
      });
    } catch (e) {
      console.warn("Cloud update failed:", e);
    }
  };

  const handleDeleteTest = async (testId) => {
    if (!window.confirm("Kya aap is test ko delete karna chahte hain?")) return;
    setMockTests((prev) => prev.filter((t) => t.id !== testId));
    try {
      await fetch(`${API_BASE_URL}/api/tests/${testId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn("Cloud delete failed:", e);
    }
  };

  // Exam Finish & Persistent Result Save
  const handleExamFinish = (result) => {
    setExamResultData(result);

    // Save result against this candidate's Roll ID
    if (currentStudent?.id) {
      const studentHistoryKey = `cbt_results_${currentStudent.id}`;
      const pastResults = JSON.parse(localStorage.getItem(studentHistoryKey) || '[]');
      
      const recordItem = {
        id: `res-${Date.now()}`,
        testTitle: result.testTitle,
        finalScore: result.finalScore,
        totalQuestions: result.totalQuestions,
        correct: result.correct,
        wrong: result.wrong,
        unattempted: result.unattempted,
        timeSpentMins: result.timeSpentMins,
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      };

      pastResults.unshift(recordItem);
      localStorage.setItem(studentHistoryKey, JSON.stringify(pastResults));
    }

    setCurrentScreen('result');
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans">
      {/* 1. Landing Screen */}
      {currentScreen === 'landing' && (
        <LandingPage
          onOpenLoginModal={() => {
            if (currentStudent) {
              setCurrentScreen('student_dashboard');
            } else {
              setIsAuthModalOpen(true);
            }
          }}
        />
      )}

      {/* 2. Student Dashboard */}
      {currentScreen === 'student_dashboard' && (
        <StudentDashboard
          currentStudent={currentStudent}
          onStudentLogin={handleStudentLoginSuccess}
          onLogout={handleStudentLogout}
          mockTests={mockTests}
          onStartMock={(test) => {
            setActiveTest(test);
            setCurrentScreen('exam');
          }}
          onBackHome={() => setCurrentScreen('landing')}
          onOpenAdmin={() => setIsAuthModalOpen(true)}
        />
      )}

      {/* 3. TCS iON Exam Screen */}
      {currentScreen === 'exam' && activeTest && (
        <CBTExamInterface
          testData={activeTest}
          studentData={currentStudent}
          onFinishExam={handleExamFinish}
          onExitExam={() => setCurrentScreen('student_dashboard')}
        />
      )}

      {/* 4. Scorecard Analytics */}
      {currentScreen === 'result' && examResultData && (
        <ExamResultAnalytics
          resultData={examResultData}
          studentData={currentStudent}
          onReattempt={() => setCurrentScreen('exam')}
          onGoToDashboard={() => setCurrentScreen('student_dashboard')}
        />
      )}

      {/* 5. Admin Dashboard */}
      {currentScreen === 'admin' && (
        <AdminDashboard
          existingTests={mockTests}
          onPublishTest={handlePublishNewTest}
          onUpdateExistingTest={handleUpdateExistingTest}
          onDeleteTest={handleDeleteTest}
          onBackToHome={() => setCurrentScreen('landing')}
        />
      )}

      {/* Unified Login Modal */}
      {isAuthModalOpen && (
        <CombinedAuthModal
          onClose={() => setIsAuthModalOpen(false)}
          onStudentLogin={handleStudentLoginSuccess}
          onAdminLogin={handleAdminLoginSuccess}
        />
      )}
    </div>
  );
}
