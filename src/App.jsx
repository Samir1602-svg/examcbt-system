import React, { useState, useEffect } from 'react';
import NewsTicker from './components/NewsTicker';
import LandingPage from './components/LandingPage';
import StudentDashboard from './components/StudentDashboard';
import CBTExamInterface from './components/CBTExamInterface';
import ExamResultAnalytics from './components/ExamResultAnalytics';
import AdminDashboard from './components/AdminDashboard';
import CombinedAuthModal from './components/AuthModal';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'https://examcbt-backend.onrender.com').replace(/\/$/, "");

// 100 Real Simulated Questions Generator Fallback for All Demo Sets
const generate100FallbackQuestions = (examName = "SSC CGL Tier-1") => {
  const sampleSubjects = ["General Intelligence & Reasoning", "General Awareness", "Quantitative Aptitude", "English Comprehension"];
  const list = [];
  for (let i = 1; i <= 100; i++) {
    const subj = sampleSubjects[Math.floor((i - 1) / 25)];
    list.push({
      id: i,
      question_en: `[${subj}] Question No. ${i}: Select the correct option corresponding to the standard SSC CBT assessment guidelines for ${examName}.`,
      question_hi: `[${subj}] प्रश्न संख्या ${i}: ${examName} के मानक कंप्यूटर आधारित परीक्षा निर्देशों के अनुसार सही विकल्प चुनें।`,
      image: null,
      options_en: ["Option A", "Option B", "Option C", "Option D"],
      options_hi: ["विकल्प A", "विकल्प B", "विकल्प C", "विकल्प D"],
      correct_option_index: (i % 4),
      subject: subj
    });
  }
  return list;
};

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
    return saved ? JSON.parse(saved) : [{
      id: 'mock-cgl-100',
      title: 'SSC CGL Tier-1 Official 100 Questions Full Mock',
      duration_mins: 60,
      questions: generate100FallbackQuestions("SSC CGL")
    }];
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

  // Launch Full 100 Questions in Sandbox Demo for Visitors
  const handleLaunchSandboxDemo = (demoExam) => {
    // 1. Look for uploaded test with 100 questions first
    let questions100 = null;
    const fullTest = mockTests.find(t => t.questions && t.questions.length >= 25);
    if (fullTest && fullTest.questions) {
      questions100 = fullTest.questions;
    } else {
      questions100 = generate100FallbackQuestions(demoExam?.name || demoExam?.code || "Combined Examination");
    }

    const sandboxTest = {
      id: `sandbox-${(demoExam?.code || 'demo').toLowerCase()}`,
      title: `${demoExam?.name || 'Computer Based Assessment'} (${demoExam?.code || 'DEMO'}) - Full Trial`,
      duration_mins: 60,
      questions: questions100
    };

    setActiveTest(sandboxTest);
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
