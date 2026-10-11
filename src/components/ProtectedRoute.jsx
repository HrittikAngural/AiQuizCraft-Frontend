import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import Loader from './ui/Loader';
import '../pages/DashboardPage.css';

const TakeQuizLoadingCard = () => (
  <div className="take-quiz-stage take-quiz-loading-stage">
    <section className="take-quiz-card take-quiz-loading-card" aria-label="Loading quiz setup">
      <h2 className="quiz-setup-title">
        <span className="quiz-setup-icon"><BookOpen size={19} /></span>
        Take a Quiz
      </h2>
      <div className="quiz-setup-form" aria-hidden="true">
        <div className="quiz-loading-field">
          <span />
          <div />
        </div>
        <div className="quiz-loading-field">
          <span />
          <div />
        </div>
        <div className="quiz-loading-field">
          <span />
          <div />
        </div>
        <div className="quiz-loading-timer" />
        <div className="quiz-loading-submit" />
      </div>
    </section>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading && !isAuthenticated) {
    if (location.pathname === '/dashboard') {
      return (
        <div className="dashboard-loading" role="status" aria-live="polite">
          <span className="dashboard-loading-indicator" aria-hidden="true" />
          <span>Restoring your learning dashboard…</span>
        </div>
      );
    }

    if (location.pathname === '/take-quiz') {
      return <TakeQuizLoadingCard />;
    }

    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;