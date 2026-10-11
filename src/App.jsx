import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import HomePage from './pages/HomePage';
import LoadingPage from './pages/LoadingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TakeQuizPage from './pages/TakeQuizPage';
import QuestionsPage from './pages/QuestionsPage';
import ResultPage from './pages/ResultPage';
import PerformanceAnalysisPage from './pages/PerformanceAnalysisPage';
import HistoryPage from './pages/HistoryPage';
import RewardsPage from './pages/RewardsPage';


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
            <Routes>
              <Route path="/" element={<HomePage />} />
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