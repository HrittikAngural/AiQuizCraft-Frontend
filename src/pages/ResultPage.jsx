import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Award,
  Check,
  CheckCircle2,
  CircleHelp,
  Clock3,
  ExternalLink,
  Eye,
  EyeOff,
  Home,
  Medal,
  RotateCcw,
  SkipForward,
  Trophy,
  X,
  XCircle,
} from 'lucide-react';
import './ResultPage.css';

const FILTERS = [
  { id: 'all', label: 'All questions' },
  { id: 'incorrect', label: 'Incorrect' },
  { id: 'correct', label: 'Correct' },
  { id: 'skipped', label: 'Skipped' },
];

const EMPTY_QUESTIONS = [];

const getOutcome = (question, selectedOption) => {
  if (selectedOption === undefined || selectedOption === null) return 'skipped';
  return selectedOption === question.correctAnswer ? 'correct' : 'incorrect';
};

const formatDuration = (seconds) => {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}m ${String(remainingSeconds).padStart(2, '0')}s`;
};

const getPerformanceMessage = (score, correct, total) => {
  if (!total) return 'No questions were available for this quiz.';
  if (score >= 90) return 'Outstanding work. You’ve mastered this topic.';
  if (score >= 70) return 'Great progress. Review a few answers to sharpen your skills.';
  if (correct > 0) return 'Good effort. Reviewing the explanations will help strengthen your understanding.';
  return 'Every quiz is a fresh start. Review the answers and try again.';
};

function OutcomeIcon({ outcome, size = 17 }) {
  if (outcome === 'correct') return <CheckCircle2 size={size} aria-hidden="true" />;
  if (outcome === 'incorrect') return <XCircle size={size} aria-hidden="true" />;
  return <SkipForward size={size} aria-hidden="true" />;
}

function QuestionReviewCard({ question, topic, index, selectedOption, expanded, onToggle }) {
  const outcome = getOutcome(question, selectedOption);
  const options = Array.isArray(question.options) ? question.options : [];
  const explanation = typeof question.explanation === 'string' ? question.explanation.trim() : '';
  const topicSearch = encodeURIComponent(`${topic} ${question.question || ''}`.trim());

  return (
    <article className={`result-question-card result-question-${outcome}`}>
      <div className="result-question-heading">
        <span className={`result-outcome-icon result-outcome-${outcome}`}>
          <OutcomeIcon outcome={outcome} size={17} />
        </span>
        <div className="result-question-heading-copy">
          <span className="result-question-number">QUESTION {String(index + 1).padStart(2, '0')}</span>
          <h3>{question.question}</h3>
        </div>
        <span className={`result-status-pill result-status-${outcome}`}>
          {outcome === 'correct' ? 'Correct' : outcome === 'incorrect' ? 'Incorrect' : 'Skipped'}
        </span>
      </div>

      <div className="result-answer-list">
        {options.map((option, optionIndex) => {
          const isSelected = selectedOption === optionIndex;
          const isCorrectAnswer = question.correctAnswer === optionIndex;
          const answerState = isCorrectAnswer ? 'correct' : isSelected ? 'incorrect' : 'neutral';

          return (
            <div className={`result-answer result-answer-${answerState}`} key={`${optionIndex}-${option}`}>
              <span className="result-answer-letter">{String.fromCharCode(65 + optionIndex)}</span>
              <span className="result-answer-text">{option}</span>
              <span className="result-answer-tags">
                {isSelected && <span className="result-answer-tag">Your answer</span>}
                {isCorrectAnswer && (
                  <span className="result-answer-correct-mark">
                    <Check size={14} /> Correct answer
                  </span>
                )}
                {isSelected && !isCorrectAnswer && (
                  <span className="result-answer-wrong-mark">
                    <X size={14} /> Your answer
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      <div className={`result-your-answer result-your-answer-${outcome}`}>
        <span>{outcome === 'skipped' ? 'You skipped this question' : 'Your answer'}</span>
        <strong>{outcome === 'skipped' ? 'No answer selected' : options[selectedOption] ?? 'Answer unavailable'}</strong>
      </div>

      {explanation ? (
        <div className={`result-explanation${expanded ? ' result-explanation-open' : ''}`}>
          <button
            type="button"
            className="result-explanation-toggle"
            onClick={onToggle}
            aria-expanded={expanded}
          >
            <span><CircleHelp size={16} /> Explanation</span>
            <span className="result-explanation-toggle-action">
              {expanded ? 'Hide explanation' : 'View explanation'}
              {expanded ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
            </span>
          </button>
          {expanded && (
            <>
              <p className="result-explanation-copy">{explanation}</p>
              <a
                className="result-explanation-more-link"
                href={`https://www.google.com/search?q=${topicSearch}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Read more about this topic <ExternalLink size={14} aria-hidden="true" />
              </a>
            </>
          )}
        </div>
      ) : (
        <div className="result-explanation result-explanation-unavailable">
          <span><CircleHelp size={16} /> Explanation</span>
          <p className="result-explanation-copy">An explanation wasn’t provided for this question.</p>
        </div>
      )}
    </article>
  );
}

export default function ResultPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [collapsedExplanations, setCollapsedExplanations] = useState(() => new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const hasSavedRef = useRef(false);

  const questions = Array.isArray(state?.questions) ? state.questions : EMPTY_QUESTIONS;
  const selectedOptions = state?.selectedOptions;
  const topic = state?.topic || 'Quiz';
  const totalTime = Number(state?.totalTime) || 0;
  const timeLeft = Number(state?.timeLeft) || 0;
  const reward = state?.reward || '';

  const selectedOptionsArray = useMemo(
    () => questions.map((_, index) => (
      Array.isArray(selectedOptions)
        ? selectedOptions[index]
        : selectedOptions?.[index]
    )),
    [questions, selectedOptions],
  );

  const correctCount = useMemo(
    () => questions.reduce((count, question, index) => (
      count + (getOutcome(question, selectedOptionsArray[index]) === 'correct' ? 1 : 0)
    ), 0),
    [questions, selectedOptionsArray],
  );
  const attemptedCount = useMemo(
    () => selectedOptionsArray.filter((option) => option !== undefined && option !== null).length,
    [selectedOptionsArray],
  );
  const skippedCount = questions.length - attemptedCount;
  const incorrectCount = attemptedCount - correctCount;
  const scorePercentage = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;
  const timeTaken = Number.isFinite(Number(state?.timeTaken))
    ? Number(state.timeTaken)
    : Math.max(0, totalTime * 60 - timeLeft);

  useEffect(() => {
    if (!state || !Array.isArray(state.questions) || state.questions.length === 0) {
      navigate('/', { replace: true });
    }
  }, [navigate, state]);

  useEffect(() => {
    if (!state || questions.length === 0 || hasSavedRef.current) return undefined;

    const saveQuizResult = async () => {
      const authToken = localStorage.getItem('token');
      if (!authToken) {
        setSaveError('Sign in to save this result to your quiz history.');
        return;
      }

      hasSavedRef.current = true;
      setIsSaving(true);
      setSaveError('');

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/results/saveresult`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              topic,
              score: correctCount,
              totalQuestions: questions.length,
              attempted: attemptedCount,
              timeTaken,
              reward,
            }),
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to save your quiz result.');
        }

        setSaveSuccess(true);
      } catch (error) {
        console.error('Could not save quiz result:', error);
        setSaveError(error.message || 'Could not save your quiz result.');
      } finally {
        setIsSaving(false);
      }
    };

    saveQuizResult();
    return undefined;
  }, [state, questions.length, topic, correctCount, attemptedCount, timeTaken, reward]);

  const outcomeCounts = {
    all: questions.length,
    incorrect: incorrectCount,
    correct: correctCount,
    skipped: skippedCount,
  };

  const visibleQuestions = questions
    .map((question, index) => ({ question, index }))
    .filter(({ question, index }) => (
      activeFilter === 'all' || getOutcome(question, selectedOptionsArray[index]) === activeFilter
    ));

  const toggleExplanation = (index) => {
    setCollapsedExplanations((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const rewardDetails = {
    gold: { label: 'Gold reward earned', Icon: Medal },
    silver: { label: 'Silver reward earned', Icon: Award },
    bronze: { label: 'Bronze reward earned', Icon: Trophy },
  };
  const earnedReward = rewardDetails[reward];
  const showMissingState = !state || questions.length === 0;

  if (showMissingState) return null;

  return (
    <main className="result-page">
      <div className="result-page-shell">
        <header className="result-page-heading">
          <div className="result-eyebrow">QUIZ REVIEW</div>
          <h1>Your results</h1>
          <p>Review your answers and keep building your understanding.</p>
        </header>

        <section className="result-summary-card" aria-labelledby="result-topic">
          <div className="result-summary-topline">
            <div>
              <span className="result-summary-label">YOUR PERFORMANCE</span>
              <h2 id="result-topic">{topic}</h2>
            </div>
            {earnedReward && (
              <span className={`result-reward-badge result-reward-${reward}`}>
                <earnedReward.Icon size={16} />
                {earnedReward.label}
              </span>
            )}
          </div>

          <div className="result-score-row">
            <div className="result-score">
              <strong>{scorePercentage}<span>%</span></strong>
              <span>overall score</span>
            </div>
            <div className="result-score-progress" role="progressbar" aria-label="Overall quiz score" aria-valuenow={scorePercentage} aria-valuemin="0" aria-valuemax="100">
              <span style={{ width: `${scorePercentage}%` }} />
            </div>
            <p className="result-performance-message">
              {getPerformanceMessage(scorePercentage, correctCount, questions.length)}
            </p>
          </div>

          <div className="result-stat-grid">
            <div className="result-stat result-stat-correct">
              <span className="result-stat-icon"><CheckCircle2 size={17} /></span>
              <div><strong>{correctCount}</strong><span>Correct</span></div>
            </div>
            <div className="result-stat result-stat-incorrect">
              <span className="result-stat-icon"><XCircle size={17} /></span>
              <div><strong>{incorrectCount}</strong><span>Incorrect</span></div>
            </div>
            <div className="result-stat result-stat-skipped">
              <span className="result-stat-icon"><SkipForward size={17} /></span>
              <div><strong>{skippedCount}</strong><span>Skipped</span></div>
            </div>
            <div className="result-stat result-stat-time">
              <span className="result-stat-icon"><Clock3 size={17} /></span>
              <div><strong>{formatDuration(timeTaken)}</strong><span>Time taken</span></div>
            </div>
          </div>
        </section>

        <section className="result-review-section" aria-labelledby="review-heading">
          <div className="result-review-heading">
            <div>
              <span className="result-summary-label">LEARN FROM EVERY QUESTION</span>
              <h2 id="review-heading">Answer review</h2>
            </div>
            <span className="result-review-total">{questions.length} questions</span>
          </div>

          <div className="result-filter-list" role="tablist" aria-label="Filter questions by result">
            {FILTERS.map((filter) => (
              <button
                type="button"
                key={filter.id}
                role="tab"
                aria-selected={activeFilter === filter.id}
                className={`result-filter-button result-filter-${filter.id}${activeFilter === filter.id ? ' result-filter-active' : ''}`}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
                <span>{outcomeCounts[filter.id]}</span>
              </button>
            ))}
          </div>

          {visibleQuestions.length ? (
            <div className="result-question-list">
              {visibleQuestions.map(({ question, index }) => {
                const outcome = getOutcome(question, selectedOptionsArray[index]);
                const expandedByDefault = outcome !== 'correct';
                const expanded = collapsedExplanations.has(index) ? !expandedByDefault : expandedByDefault;

                return (
                  <QuestionReviewCard
                    key={`${index}-${question.question}`}
                    question={question}
                    topic={topic}
                    index={index}
                    selectedOption={selectedOptionsArray[index]}
                    expanded={expanded}
                    onToggle={() => toggleExplanation(index)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="result-filter-empty">
              <CircleHelp size={21} />
              <p>No {activeFilter} answers in this quiz.</p>
            </div>
          )}
        </section>

        {isSaving && <p className="result-save-status" role="status">Saving your result…</p>}
        {saveSuccess && <p className="result-save-success" role="status"><Check size={15} /> Result saved to your quiz history.</p>}
        {saveError && (
          <p className="result-save-error" role="status">
            <X size={15} /> {saveError}
            <button type="button" onClick={() => navigate('/login')}>Sign in</button>
          </p>
        )}

        <footer className="result-actions">
          <button type="button" className="result-home-button" onClick={() => navigate('/')}>
            <Home size={17} /> Return home
          </button>
          <button type="button" className="result-retry-button" onClick={() => navigate('/take-quiz', { state: { trendingTopic: topic } })}>
            <RotateCcw size={16} /> Try another quiz
          </button>
        </footer>
      </div>
    </main>
  );
}
