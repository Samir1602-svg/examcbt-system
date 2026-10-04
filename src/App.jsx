import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import StudentDashboard from './components/StudentDashboard';
import CBTExamInterface from './components/CBTExamInterface';
import ExamResultAnalytics from './components/ExamResultAnalytics';
import AdminDashboard from './components/AdminDashboard';
import AuthModal from './components/AuthModal';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'https://examcbt-backend.onrender.com').replace(/\/$/, "");

// Initial Default Mock Test
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
  // Navigation states: 'landing' | 'student_dashboard' | 'exam' | 'result' | 'admin'
  const [currentScreen, setCurrentScreen] = useState('landing');
  
  // Active Test and Exam Result
  const [activeTest, setActiveTest] = useState(null);
  const [examResultData, setExamResultData] = useState(null);

  // Student Authentication State
  const [currentStudent, setCurrentStudent] = useState(() => {
    const saved = localStorage.getItem('cbt_active_student');
    return saved ? JSON.parse(saved) : null;
  });

  // Admin Modal Auth State
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return localStorage.getItem('cbt_admin_logged') === 'true';
  });

  // Tests Repository State (Laptop + Phone Cross Sync)
  const [mockTests, setMockTests] = useState(() => {
    const saved = localStorage.getItem('cbt_mock_tests');
    return saved ? JSON.parse(saved) : DEFAULT_INITIAL_TESTS;
  });

  // Fetch Central Tests from Render Backend on App Load (Sync across Phone & PC)
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
        console.warn("Using offline/cached tests store:", err);
      }
    };

    fetchCentralCloudTests();
  }, []);

  // Save tests to local cache whenever modified
  useEffect(() => {
    localStorage.setItem('cbt_mock_tests', JSON.stringify(mockTests));
  }, [mockTests]);

  // Handle Publishing New Test (Admin to Cloud & Student Dashboard)
  const handlePublishNewTest = async (newTest) => {
    setMockTests((prev) => [newTest, ...prev]);

    // Send to central Render backend so phone gets it immediately
    try {
      await fetch(`${API_BASE_URL}/api/tests/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTest),
      });
    } catch (e) {
      console.warn("Could not sync to cloud immediately, saved locally:", e);
    }
  };

  // Handle Editing an Existing Test
  const handleUpdateExistingTest = async (updatedTest) => {
    setMockTests((prev) =>
      prev.map((t) => (t.id === updatedTest.id ? updatedTest : t))
    );

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

  // Handle Deleting a Test
  const handleDeleteTest = async (testId) => {
    if (!window.confirm("Kya aap sach me is test ko delete karna chahte hain?")) return;
    setMockTests((prev) => prev.filter((t) => t.id !== testId));

    try {
      await fetch(`${API_BASE_URL}/api/tests/${testId}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.warn("Cloud delete failed:", e);
    }
  };

  // Student Registration / Login
  const handleStudentAuthSuccess = (studentData) => {
    setCurrentStudent(studentData);
    localStorage.setItem('cbt_active_student', JSON.stringify(studentData));
    
    // Save to all students list for Admin roster
    const allStudents = JSON.parse(localStorage.getItem('cbt_students') || '[]');
    const exists = allStudents.some(s => s.id === studentData.id);
    if (!exists) {
      allStudents.unshift(studentData);
      localStorage.setItem('cbt_students', JSON.stringify(allStudents));
    }
  };

  const handleStudentLogout = () => {
    setCurrentStudent(null);
    localStorage.removeItem('cbt_active_student');
    setCurrentScreen('landing');
  };

  // Start CBT Exam
  const handleStartExam = (test) => {
    setActiveTest(test);
    setCurrentScreen('exam');
  };

  // Finish Exam & Show Analytics
  const handleExamFinish = (result) => {
    setExamResultData(result);
    setCurrentScreen('result');
  };

  // Admin Login Handler
  const handleAdminLoginSubmit = (email, pass) => {
    if (email === 'admin@examcbt.com' && pass === 'admin123') {
      setIsAdminLoggedIn(true);
      localStorage.setItem('cbt_admin_logged', 'true');
      setIsAdminAuthModalOpen(false);
      setCurrentScreen('admin');
    } else {
      alert("Invalid Admin Credentials! Use admin@examcbt.com / admin123");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* 1. Landing Screen */}
      {currentScreen === 'landing' && (
        <LandingPage
          onEnterDashboard={() => setCurrentScreen('student_dashboard')}
          onOpenAdmin={() => {
            if (isAdminLoggedIn) {
              setCurrentScreen('admin');
            } else {
              setIsAdminAuthModalOpen(true);
            }
          }}
        />
      )}

      {/* 2. Student Dashboard */}
      {currentScreen === 'student_dashboard' && (
        <StudentDashboard
          currentStudent={currentStudent}
          onStudentLogin={handleStudentAuthSuccess}
          onLogout={handleStudentLogout}
          mockTests={mockTests}
          onStartMock={handleStartExam}
          onBackHome={() => setCurrentScreen('landing')}
          onOpenAdmin={() => {
            if (isAdminLoggedIn) {
              setCurrentScreen('admin');
            } else {
              setIsAdminAuthModalOpen(true);
            }
          }}
        />
      )}

      {/* 3. Real TCS iON Exam Screen */}
      {currentScreen === 'exam' && activeTest && (
        <CBTExamInterface
          testData={activeTest}
          studentData={currentStudent}
          onFinishExam={handleExamFinish}
          onExitExam={() => setCurrentScreen('student_dashboard')}
        />
      )}

      {/* 4. Scorecard & Detailed Analytics */}
      {currentScreen === 'result' && examResultData && (
        <ExamResultAnalytics
          resultData={examResultData}
          studentData={currentStudent}
          onReattempt={() => setCurrentScreen('exam')}
          onGoToDashboard={() => setCurrentScreen('student_dashboard')}
        />
      )}

      {/* 5. Admin Control Center */}
      {currentScreen === 'admin' && (
        <AdminDashboard
          existingTests={mockTests}
          onPublishTest={handlePublishNewTest}
          onUpdateExistingTest={handleUpdateExistingTest}
          onDeleteTest={handleDeleteTest}
          onBackToHome={() => setCurrentScreen('student_dashboard')}
        />
      )}

      {/* Admin Login Modal */}
      {isAdminAuthModalOpen && (
        <AuthModal
          onClose={() => setIsAdminAuthModalOpen(false)}
          onLogin={handleAdminLoginSubmit}
        />
      )}
    </div>
  );
}
