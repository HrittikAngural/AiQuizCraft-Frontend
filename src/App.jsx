import React, { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createBrowserRouter, Outlet, RouterProvider, useLocation, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

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

const readReservedMainHeight = (path) => {
  try {
    return Number(sessionStorage.getItem(`aiquizcraft-main-height:${path}`)) || 0;
  } catch (error) {
    console.error('Could not restore the previous page layout:', error);
    return 0;
  }
};

const swipeRoutes = ['/', '/subjects', '/take-quiz'];

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isTakingQuiz = location.pathname === '/questions';
  const isQuizSetup = location.pathname === '/take-quiz';
  const isResultPage = location.pathname === '/result';
  const mainRef = useRef(null);
  const touchStart = useRef(null);
  const [swipeDirection, setSwipeDirection] = useState(0);
  const [reservedMainHeight, setReservedMainHeight] = useState(() => {
    return {
      path: location.pathname,
      height: readReservedMainHeight(location.pathname),
    };
  });
  const [theme, setTheme] = useState(() => (
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
  ));
  const [showQuizFooter, setShowQuizFooter] = useState(false);

  useLayoutEffect(() => {
    const height = readReservedMainHeight(location.pathname);
    setReservedMainHeight({ path: location.pathname, height });
  }, [location.pathname]);

  useEffect(() => {
    const main = mainRef.current;
    if (!main || typeof ResizeObserver === 'undefined') return undefined;

    const saveHeight = () => {
      const height = Math.ceil(main.getBoundingClientRect().height);
      if (!height) return;
      try {
        sessionStorage.setItem(`aiquizcraft-main-height:${location.pathname}`, String(height));
      } catch (error) {
        console.error('Could not preserve the page layout for reload:', error);
      }
    };
    const observer = new ResizeObserver(saveHeight);
    observer.observe(main);
    saveHeight();
    return () => observer.disconnect();
  }, [location.pathname]);

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

  const handleTouchStart = (event) => {
    if (window.innerWidth > 768) return;
    if (event.touches.length !== 1) {
      touchStart.current = null;
      return;
    }
    if (!swipeRoutes.includes(location.pathname)) {
      touchStart.current = null;
      return;
    }

    const { clientX, clientY } = event.touches[0];
    touchStart.current = { clientX, clientY, path: location.pathname };
  };

  const handleTouchEnd = (event) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || window.innerWidth > 768) return;

    const touch = event.changedTouches[0];
    if (!touch) return;

    const deltaX = touch.clientX - start.clientX;
    const deltaY = touch.clientY - start.clientY;
    if (Math.abs(deltaX) < 75 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;

    const currentIndex = swipeRoutes.indexOf(start.path);
    const direction = deltaX < 0 ? 1 : -1;
    const nextPath = swipeRoutes[currentIndex + direction];
    if (!nextPath) return;

    setSwipeDirection(direction);
    window.scrollTo(0, 0);
    navigate(nextPath);
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
      <main
        ref={mainRef}
        className={`${isResultPage ? 'flex-none' : 'flex-1'}${isTakingQuiz || isQuizSetup || isResultPage ? '' : ' pb-8'}${swipeDirection === 1 ? ' mobile-page-swipe-forward' : swipeDirection === -1 ? ' mobile-page-swipe-back' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={() => { touchStart.current = null; }}
        onAnimationEnd={(event) => {
          if (event.target === event.currentTarget) setSwipeDirection(0);
        }}
        style={{
          minHeight: isResultPage ? undefined : (reservedMainHeight.path === location.pathname
            ? reservedMainHeight.height
            : readReservedMainHeight(location.pathname)) || undefined,
        }}
      >
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </main>
      {!isTakingQuiz && (!isQuizSetup || showQuizFooter) && <Footer />}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

const protectedPage = (Page) => React.createElement(
  ProtectedRoute,
  null,
  React.createElement(Page)
);

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/subjects', element: <SubjectExplorerPage /> },
      { path: '/subjects/:subjectSlug', element: <SubjectTopicsPage /> },
      { path: '/loading', element: <LoadingPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/dashboard', element: protectedPage(DashboardPage) },
      { path: '/take-quiz', element: protectedPage(TakeQuizPage) },
      { path: '/questions', element: protectedPage(QuestionsPage) },
      { path: '/result', element: protectedPage(ResultPage) },
      { path: '/answer-review', element: protectedPage(AnswerReviewPage) },
      { path: '/leaderboard', element: protectedPage(LeaderboardPage) },
      { path: '/performance-analysis', element: protectedPage(PerformanceAnalysisPage) },
      { path: '/history', element: protectedPage(HistoryPage) },
      { path: '/rewards', element: protectedPage(RewardsPage) }
    ]
  }
]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
