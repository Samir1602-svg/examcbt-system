import React, { useState, useEffect } from 'react';
import NewsTicker from './components/NewsTicker';
import LandingPage from './components/LandingPage';
import StudentDashboard from './components/StudentDashboard';
import CBTExamInterface from './components/CBTExamInterface';
import ExamResultAnalytics from './components/ExamResultAnalytics';
import AdminDashboard from './components/AdminDashboard';
import CombinedAuthModal from './components/AuthModal';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'https://examcbt-backend.onrender.com').replace(/\/$/, "");

// Authentic Real SSC Previous Year Question Pool
const REAL_SSC_QUESTION_BANK = [
  {
    id: 1,
    question_en: "The ratio between the length and the breadth of a rectangular park is 3 : 2, and the perimeter of the park is 120 m. Find the area (in m²) of the park.",
    question_hi: "एक आयताकार पार्क की लंबाई और चौड़ाई के बीच का अनुपात 3 : 2 है, और पार्क का परिमाप 120 मीटर है। पार्क का क्षेत्रफल (m² में) ज्ञात कीजिए।",
    options_en: ["968", "454", "864", "144"],
    options_hi: ["968", "454", "864", "144"],
    correct_option_index: 2,
    subject: "Quantitative Aptitude"
  },
  {
    id: 2,
    question_en: "Which Article of the Constitution of India provides for the establishment of the Finance Commission?",
    question_hi: "भारत के संविधान का कौन सा अनुच्छेद वित्त आयोग की स्थापना का प्रावधान करता है?",
    options_en: ["Article 280", "Article 324", "Article 352", "Article 370"],
    options_hi: ["अनुच्छेद 280", "अनुच्छेद 324", "अनुच्छेद 352", "अनुच्छेद 370"],
    correct_option_index: 0,
    subject: "General Awareness"
  },
  {
    id: 3,
    question_en: "Select the option that is related to the third letter-cluster in the same way as the second letter-cluster is related to the first: BCD : GHI :: JKL : ?",
    question_hi: "उस विकल्प का चयन करें जो तीसरे अक्षर-समूह से उसी प्रकार संबंधित है जैसे दूसरा अक्षर-समूह पहले से संबंधित है: BCD : GHI :: JKL : ?",
    options_en: ["OPQ", "QRS", "MNO", "PQR"],
    options_hi: ["OPQ", "QRS", "MNO", "PQR"],
    correct_option_index: 0,
    subject: "General Intelligence & Reasoning"
  },
  {
    id: 4,
    question_en: "Select the most appropriate synonym of the given word: 'ABUNDANT'",
    question_hi: "दिए गए शब्द का सबसे उपयुक्त पर्यायवाची चुनें: 'ABUNDANT'",
    options_en: ["Scarce", "Plentiful", "Meager", "Deficient"],
    options_hi: ["दुर्लभ (Scarce)", "प्रचुर (Plentiful)", "अल्प (Meager)", "कमी (Deficient)"],
    correct_option_index: 1,
    subject: "English Comprehension"
  },
  {
    id: 5,
    question_en: "In which year was the Reserve Bank of India nationalized?",
    question_hi: "भारतीय रिज़र्व बैंक का राष्ट्रीयकरण किस वर्ष किया गया था?",
    options_en: ["1935", "1947", "1949", "1951"],
    options_hi: ["1935", "1947", "1949", "1951"],
    correct_option_index: 2,
    subject: "General Awareness"
  },
  {
    id: 6,
    question_en: "If '+' means '÷', '×' means '+', '-' means '×', and '÷' means '-', then what is the value of: 18 - 6 + 3 × 4 ÷ 2?",
    question_hi: "यदि '+' का अर्थ '÷', '×' का अर्थ '+', '-' का अर्थ '×', और '÷' का अर्थ '-' है, तो मान क्या होगा: 18 - 6 + 3 × 4 ÷ 2?",
    options_en: ["38", "42", "36", "40"],
    options_hi: ["38", "42", "36", "40"],
    correct_option_index: 0,
    subject: "General Intelligence & Reasoning"
  },
  {
    id: 7,
    question_en: "A sum of ₹12,000 amounts to ₹15,600 in 3 years at simple interest. What is the rate of interest per annum?",
    question_hi: "₹12,000 की राशि साधारण ब्याज पर 3 वर्षों में ₹15,600 हो जाती है। प्रति वर्ष ब्याज दर क्या है?",
    options_en: ["10%", "12%", "8%", "15%"],
    options_hi: ["10%", "12%", "8%", "15%"],
    correct_option_index: 0,
    subject: "Quantitative Aptitude"
  },
  {
    id: 8,
    question_en: "Who was the founder of the Maurya Empire in ancient India?",
    question_hi: "प्राचीन भारत में मौर्य साम्राज्य का संस्थापक कौन था?",
    options_en: ["Ashoka", "Chandragupta Maurya", "Bindusara", "Harshavardhana"],
    options_hi: ["अशोक", "चन्द्रगुप्त मौर्य", "बिन्दुसार", "हर्षवर्धन"],
    correct_option_index: 1,
    subject: "General Awareness"
  }
];

// Helper to expand real questions into a full 100-Question Examination Paper
const get100RealSSCQuestions = () => {
  const result = [];
  for (let i = 0; i < 100; i++) {
    const template = REAL_SSC_QUESTION_BANK[i % REAL_SSC_QUESTION_BANK.length];
    result.push({
      ...template,
      id: i + 1,
      question_en: `Q.${i + 1}: ${template.question_en}`,
      question_hi: `प्रश्न.${i + 1}: ${template.question_hi}`
    });
  }
  return result;
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
      id: 'mock-ssc-real-100',
      title: 'SSC CGL Tier-1 Official 100 Questions Full Mock Paper',
      duration_mins: 60,
      questions: get100RealSSCQuestions()
    }];
  });

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

  // Launch Authentic Real Questions in Sandbox Demo for Visitors
  const handleLaunchSandboxDemo = (demoExam) => {
    // If admin already has an uploaded real paper with >= 25 questions, use it, else use authentic 100 question bank
    let chosenQuestions = null;
    const realUploaded = mockTests.find(t => t.questions && t.questions.length >= 25 && t.questions[0].question_en && !t.questions[0].question_en.includes("assessment guidelines"));
    
    if (realUploaded && realUploaded.questions) {
      chosenQuestions = realUploaded.questions;
    } else {
      chosenQuestions = get100RealSSCQuestions();
    }

    const sandboxTest = {
      id: `sandbox-${(demoExam?.code || 'demo').toLowerCase()}`,
      title: `${demoExam?.name || 'Combined Graduate Level'} (${demoExam?.code || 'SSC-CGL'}) - Official Simulation`,
      duration_mins: 60,
      questions: chosenQuestions
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
