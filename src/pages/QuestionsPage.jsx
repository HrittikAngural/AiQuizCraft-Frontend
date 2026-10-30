import React, { useEffect, useRef, useState } from 'react';
import { useBlocker, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, ChevronLeft, ChevronRight, Coins } from 'lucide-react';
import api from '../utils/api';
import './QuestionsPage.css';

export default function QuestionsPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const questions = Array.isArray(state?.questions) ? state.questions : [];
  const totalTime = Number(state?.totalTime) || 1;
  const topic = state?.topic || 'Quiz';
  const subject = state?.subject || '';
  const isSubjectQuiz = Boolean(state?.isSubjectQuiz && subject);
  const difficulty = ['Easy', 'Medium', 'Hard'].find(
    (level) => level.toLowerCase() === String(state?.difficulty || '').toLowerCase()
  ) || 'Medium';
  const pointsPerCorrectAnswer = isSubjectQuiz
    ? { Easy: 1, Medium: 2, Hard: 4 }[difficulty]
    : 1;
  const topicTransition = Boolean(state?.topicTransition);
  const showPoints = Boolean(state?.showPointsOnQuestions);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [activeOptionIndex, setActiveOptionIndex] = useState(0);
  const [currentPoints, setCurrentPoints] = useState(null);
  const [timeLeft, setTimeLeft] = useState(totalTime * 60); // Convert to seconds
  const [startTime] = useState(Date.now()); // Track quiz start time
  const hasSubmitted = useRef(false);
  const submitQuizRef = useRef(null);
  const optionButtonRefs = useRef([]);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => (
    questions.length > 0 &&
    !hasSubmitted.current &&
    currentLocation.pathname === '/questions' &&
    nextLocation.pathname !== currentLocation.pathname
  ));

  useEffect(() => {
    if (questions.length === 0) {
      navigate('/take-quiz', { replace: true });
    }
  }, [navigate, questions.length]);

  useEffect(() => {
    if (questions.length === 0) return undefined;

    const warnBeforeLeaving = (event) => {
      if (hasSubmitted.current) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [questions.length]);

  useEffect(() => {
    const options = questions[currentQuestionIndex]?.options;
    if (!Array.isArray(options) || options.length === 0) return undefined;

    const savedOption = selectedOptions[currentQuestionIndex];
    const initialOptionIndex = Number.isInteger(savedOption) && savedOption >= 0 && savedOption < options.length
      ? savedOption
      : 0;

    setActiveOptionIndex(initialOptionIndex);
    const focusFrame = requestAnimationFrame(() => {
      optionButtonRefs.current[initialOptionIndex]?.focus({ preventScroll: true });
    });

    return () => cancelAnimationFrame(focusFrame);
  }, [currentQuestionIndex, questions, selectedOptions]);

  useEffect(() => {
    if (blocker.state === 'blocked') blocker.reset();
  }, [blocker]);

  useEffect(() => {
    if (!showPoints) return undefined;

    let active = true;
    api.get('/api/results/leaderboard?period=all')
      .then(({ data }) => {
        if (active) setCurrentPoints(Number(data.currentUser?.allTimePoints) || 0);
      })
      .catch((error) => {
        if (active) {
          setCurrentPoints(null);
          console.error('Could not load the current point total:', error);
        }
      });

    return () => { active = false; };
  }, [showPoints]);

  const handleOptionSelect = (optionIndex) => {
    setActiveOptionIndex(optionIndex);
    setSelectedOptions(prev => ({
      ...prev,
      [currentQuestionIndex]: optionIndex
    }));
  };

  const handleNext = () => {
    setCurrentQuestionIndex(index => Math.min(index + 1, questions.length - 1));
  };

  const handlePrevious = () => {
    setCurrentQuestionIndex(index => Math.max(index - 1, 0));
  };

  const handleSubmit = (answers = selectedOptions) => {
    if (hasSubmitted.current) return;

    hasSubmitted.current = true;
    const endTime = Date.now();
    const timeTakenInSeconds = Math.floor((endTime - startTime) / 1000);
    
    const correctCount = questions.reduce((acc, question, index) => {
      return acc + (answers[index] === question.correctAnswer ? 1 : 0);
    }, 0);
    
    // Calculate reward
    const accuracy = (correctCount / questions.length) * 100;
    let reward = '';
    if (accuracy >= 95) reward = 'gold';
    else if (accuracy >= 80) reward = 'silver';
    else if (accuracy >= 65) reward = 'bronze';

    const resultState = {
      questions: questions.map(q => ({
        ...q,
        correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : q.answer
      })),
      selectedOptions: answers,
      topic,
      subject,
      isSubjectQuiz,
      quizAttemptId: state?.quizAttemptId,
      difficulty,
      totalTime,
      timeLeft, // Remaining time in seconds
      timeTaken: timeTakenInSeconds, // Actual time spent
      reward // Add reward to state
    };
    navigate('/result', { replace: true, state: resultState });
  };
  submitQuizRef.current = handleSubmit;

  const handleQuizKeyDown = (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    const target = event.target;
    if (target.closest?.('input, textarea, select, [contenteditable="true"]')) return;

    const options = questions[currentQuestionIndex]?.options;
    if (!Array.isArray(options) || options.length === 0) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const focusedOption = target.closest?.('.question-option');
      const focusedIndex = Number(focusedOption?.dataset.optionIndex);
      const currentOptionIndex = Number.isInteger(focusedIndex) ? focusedIndex : activeOptionIndex;
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      const nextOptionIndex = (currentOptionIndex + direction + options.length) % options.length;

      setActiveOptionIndex(nextOptionIndex);
      optionButtonRefs.current[nextOptionIndex]?.focus({ preventScroll: true });
      return;
    }

    if (event.key !== 'Enter') return;

    const focusedOption = target.closest?.('.question-option');
    const optionIndex = Number(focusedOption?.dataset.optionIndex);
    if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= options.length) return;

    event.preventDefault();
    event.stopPropagation();
    const nextAnswers = { ...selectedOptions, [currentQuestionIndex]: optionIndex };
    setActiveOptionIndex(optionIndex);
    setSelectedOptions(nextAnswers);

    if (currentQuestionIndex === questions.length - 1) handleSubmit(nextAnswers);
    else handleNext();
  };

  useEffect(() => {
    if (questions.length === 0 || hasSubmitted.current) return undefined;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [questions.length]);

  useEffect(() => {
    if (timeLeft === 0) submitQuizRef.current?.();
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (questions.length === 0) return null;

  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="questions-page" onKeyDown={handleQuizKeyDown}>
      <div className={`questions-workspace${showPoints ? '' : ' questions-workspace-single'}`}>
      <section className="questions-card" aria-label={`${topic} quiz`}>
        <div className="questions-topline">
          <div>
            <p className="questions-breadcrumb">
              {subject ? `${subject}  >  ` : ''}{topic}
            </p>
            <p
              className="questions-topic"
              style={topicTransition ? { viewTransitionName: 'quiz-topic' } : undefined}
            >
              {topic} Quiz
            </p>
          </div>
          <div className="questions-topline-actions">
            <p className={`questions-timer${timeLeft <= 30 ? ' questions-timer-low' : ''}`} aria-live="off">
              Time left: {formatTime(timeLeft)}
            </p>
          </div>
        </div>

        <div className="questions-progress-row">
          <h2>Question {currentQuestionIndex + 1}</h2>
          <span>{currentQuestionIndex + 1} of {questions.length}</span>
        </div>
        <div className="questions-progress-track" aria-hidden="true">
          <div style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }} />
        </div>

        <div className="questions-content" key={currentQuestionIndex}>
          <h3 className="questions-prompt">{questions[currentQuestionIndex].question}</h3>
          <div className="questions-options">
            {questions[currentQuestionIndex].options.map((option, index) => {
              const isSelected = selectedOptions[currentQuestionIndex] === index;
              return (
                <button
                  key={index}
                  ref={(button) => { optionButtonRefs.current[index] = button; }}
                  type="button"
                  aria-pressed={isSelected}
                  data-option-index={index}
                  onFocus={() => setActiveOptionIndex(index)}
                  onClick={() => handleOptionSelect(index)}
                  className={`question-option${isSelected ? ' question-option-selected' : ''}${activeOptionIndex === index ? ' question-option-keyboard-active' : ''}`}
                >
                  <span className="question-option-marker">{String.fromCharCode(65 + index)}</span>
                  <span>{option}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="questions-navigation">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="question-nav-button question-nav-previous"
          >
            <ChevronLeft size={18} /> Previous
          </button>

          {!isLastQuestion ? (
            <button type="button" onClick={handleNext} className="question-nav-button question-nav-next">
              Next <ChevronRight size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="question-nav-button question-nav-finish"
            >
              <CheckCircle size={18} /> Finish Quiz
            </button>
          )}
        </div>
      </section>
      {showPoints && (
        <aside className="questions-points-card">
          <span className="questions-points-icon"><Coins size={19} /></span>
          <span className="questions-points-label">Your points</span>
          <strong>{currentPoints === null ? '—' : currentPoints}</strong>
          <span>earned from correct answers</span>
          <div className="questions-points-divider" />
          <span className="questions-points-label">This quiz</span>
          <strong className="questions-points-possible">{questions.length * pointsPerCorrectAnswer} <small>max points</small></strong>
          <span>{pointsPerCorrectAnswer} point{pointsPerCorrectAnswer === 1 ? '' : 's'} for each correct answer</span>
        </aside>
      )}
      </div>
    </div>
  );
}
