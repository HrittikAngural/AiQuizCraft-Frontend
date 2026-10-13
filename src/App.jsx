import React, { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
const HomePage = lazy(() => import('./pages/HomePage'));
const LoadingPage = lazy(() => import('./pages/LoadingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TakeQuizPage = lazy(() => import('./pages/TakeQuizPage'));
const QuestionsPage = lazy(() => import('./pages/QuestionsPage'));
const ResultPage = lazy(() => import('./pages/ResultPage'));
const PerformanceAnalysisPage = lazy(() => import('./pages/PerformanceAnalysisPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const RewardsPage = lazy(() => import('./pages/RewardsPage'));
const SubjectExplorerPage = lazy(() => import('./pages/SubjectExplorerPage'));
const SubjectTopicsPage = lazy(() => import('./pages/SubjectTopicsPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const AnswerReviewPage = lazy(() => import('./pages/AnswerReviewPage'));


// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import './styles/dark-theme.css';

// Context
import { AuthProvider } from './context/AuthContext';

function AppLayout() {
  const location = useLocation();
  const isTakingQuiz = location.pathname === '/questions';
  const isQuizSetup = location.pathname === '/take-quiz';
  const [theme, setTheme] = useState(() => (
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
  ));
  const [showQuizFooter, setShowQuizFooter] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    try {
      localStorage.setItem('aiquizcraft-theme', theme);
    } catch (error) {
      console.error('Could not save the selected color theme:', error);
    }
  }, [theme]);

  const toggleTheme = () => {
    const root = document.documentElement;
    root.classList.add('theme-transition');
    window.setTimeout(() => root.classList.remove('theme-transition'), 450);
    setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    if (!isQuizSetup) {
      setShowQuizFooter(false);
      return undefined;
    }

    window.scrollTo(0, 0);
    setShowQuizFooter(false);
    const revealFooterOnScroll = () => setShowQuizFooter(window.scrollY > 32);
    window.addEventListener('scroll', revealFooterOnScroll, { passive: true });
    return () => window.removeEventListener('scroll', revealFooterOnScroll);
  }, [isQuizSetup]);

  return (
    <div className="flex min-h-screen flex-col">
      {!isTakingQuiz && <Navbar theme={theme} onToggleTheme={toggleTheme} />}
      <main className={`flex-grow${isTakingQuiz || isQuizSetup ? '' : ' pb-8'}`}>
        <Suspense fallback={<div className="flex min-h-[30vh] items-center justify-center text-sm text-slate-500" role="status">Loading page…</div>}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/subjects" element={<SubjectExplorerPage />} />
              <Route path="/subjects/:subjectSlug" element={<SubjectTopicsPage />} />
              <Route path="/loading" element={<LoadingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/take-quiz"
                element={
                  <ProtectedRoute>
                    <TakeQuizPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/questions" element={
                <ProtectedRoute>
                  <QuestionsPage />
                </ProtectedRoute>
              } />
              <Route
                path="/result"
                element={
                  <ProtectedRoute>
                    <ResultPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/answer-review"
                element={
                  <ProtectedRoute>
                    <AnswerReviewPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <ProtectedRoute>
                    <LeaderboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/performance-analysis"
                element={
                  <ProtectedRoute>
                    <PerformanceAnalysisPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <HistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/rewards" element={
                <ProtectedRoute>
                  <RewardsPage />
                </ProtectedRoute>
              } />
            </Routes>
        </Suspense>
      </main>
      {!isTakingQuiz && (!isQuizSetup || showQuizFooter) && <Footer />}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </Router>
  );
}

export default App;