import React, { useState, useEffect } from 'react';
import NewsTicker from './components/NewsTicker';
import LandingPage from './components/LandingPage';
import StudentDashboard from './components/StudentDashboard';
import CBTExamInterface from './components/CBTExamInterface';
import ExamResultAnalytics from './components/ExamResultAnalytics';
import AdminDashboard from './components/AdminDashboard';
import CombinedAuthModal from './components/AuthModal';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'https://examcbt-backend.onrender.com').replace(/\/$/, "");

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('landing');
  const [activeTest, setActiveTest] = useState(null);
  const [examResultData, setExamResultData] = useState(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(() => {
    const saved = localStorage.getItem('cbt_active_student');
    if (saved) {
      const parsed = JSON.parse(saved);
      const rollPhoto = localStorage.getItem(`cbt_photo_${parsed.id}`);
      return { ...parsed, avatar: parsed.avatar || rollPhoto || null };
    }
    return null;
  });

  const [mockTests, setMockTests] = useState(() => {
    const saved = localStorage.getItem('cbt_mock_tests');
    return saved ? JSON.parse(saved) : [];
  });

  // Central backend sync
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
    const storedPhoto = localStorage.getItem(`cbt_photo_${studentObj.id}`);
    const resolvedStudent = {
      ...studentObj,
      avatar: studentObj.avatar || storedPhoto || null
    };

    setCurrentStudent(resolvedStudent);
    localStorage.setItem('cbt_active_student', JSON.stringify(resolvedStudent));
    setIsAuthModalOpen(false);
    setCurrentScreen('student_dashboard');
  };

  const handleUpdateStudentProfile = (updatedStudent) => {
    setCurrentStudent(updatedStudent);
    localStorage.setItem('cbt_active_student', JSON.stringify(updatedStudent));
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
    const updatedTests = [newTest, ...mockTests];
    setMockTests(updatedTests);
    localStorage.setItem('cbt_mock_tests', JSON.stringify(updatedTests));
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
    const updated = mockTests.map((t) => (t.id === updatedTest.id ? updatedTest : t));
    setMockTests(updated);
    localStorage.setItem('cbt_mock_tests', JSON.stringify(updated));
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
    if (!window.confirm("Are you sure you want to delete this test?")) return;
    const remaining = mockTests.filter((t) => t.id !== testId);
    setMockTests(remaining);
    localStorage.setItem('cbt_mock_tests', JSON.stringify(remaining));
    try {
      await fetch(`${API_BASE_URL}/api/tests/${testId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn("Cloud delete failed:", e);
    }
  };

  // Launch Demo Trial Directly using matching Mock Test or existing questions
  const handleLaunchSandboxDemo = (demoExam) => {
    // Check if a test exists matching this code/name or use the default available test
    const matchedTest = mockTests.find(t => 
      t.title?.toLowerCase().includes((demoExam?.code || '').toLowerCase()) ||
      t.id?.toLowerCase().includes((demoExam?.code || '').toLowerCase())
    ) || mockTests[0] || {
      id: `sandbox-${(demoExam?.code || 'demo').toLowerCase()}`,
      title: `${demoExam?.name || 'Combined Examination'} (${demoExam?.code || 'DEMO'}) - Official Trial`,
      duration_mins: 60,
      questions: []
    };

    setActiveTest(matchedTest);
    setCurrentStudent({
      id: "SANDBOX-VISITOR",
      name: "Demo Candidate",
      email: "visitor@assessment.gov.in",
      tier: "FREE",
      avatar: null
    });
    setCurrentScreen('exam');
  };

  const handleExamFinish = (result) => {
    setExamResultData(result);

    if (currentStudent?.id && currentStudent.id !== "SANDBOX-VISITOR") {
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
      <NewsTicker />

      {/* 1. Landing Screen */}
      {currentScreen === 'landing' && (
        <LandingPage
          onOpenLoginModal={() => {
            if (currentStudent && currentStudent.id !== "SANDBOX-VISITOR") {
              setCurrentScreen('student_dashboard');
            } else {
              setIsAuthModalOpen(true);
            }
          }}
          onLaunchSandboxDemo={handleLaunchSandboxDemo}
        />
      )}

      {/* 2. Student Dashboard */}
      {currentScreen === 'student_dashboard' && (
        <StudentDashboard
          currentStudent={currentStudent}
          onStudentLogin={handleStudentLoginSuccess}
          onUpdateStudentProfile={handleUpdateStudentProfile}
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
          onExitExam={() => setCurrentScreen(currentStudent?.id === "SANDBOX-VISITOR" ? 'landing' : 'student_dashboard')}
        />
      )}

      {/* 4. Scorecard Analytics */}
      {currentScreen === 'result' && examResultData && (
        <ExamResultAnalytics
          resultData={examResultData}
          studentData={currentStudent}
          onReattempt={() => setCurrentScreen('exam')}
          onGoToDashboard={() => setCurrentScreen(currentStudent?.id === "SANDBOX-VISITOR" ? 'landing' : 'student_dashboard')}
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
