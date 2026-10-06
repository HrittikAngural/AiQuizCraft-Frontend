import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import './QuestionsPage.css';

export default function QuestionsPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const questions = Array.isArray(state?.questions) ? state.questions : [];
  const totalTime = Number(state?.totalTime) || 1;
  const topic = state?.topic || 'Quiz';
  const topicTransition = Boolean(state?.topicTransition);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [timeLeft, setTimeLeft] = useState(totalTime * 60); // Convert to seconds
  const [startTime] = useState(Date.now()); // Track quiz start time
  const hasSubmitted = useRef(false);
  const submitQuizRef = useRef(null);

  useEffect(() => {
    if (questions.length === 0) {
      navigate('/take-quiz', { replace: true });
    }
  }, [navigate, questions.length]);

  const handleOptionSelect = (optionIndex) => {
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

  const handleSubmit = () => {
    if (hasSubmitted.current) return;

    hasSubmitted.current = true;
    const endTime = Date.now();
    const timeTakenInSeconds = Math.floor((endTime - startTime) / 1000);
    
    const correctCount = questions.reduce((acc, question, index) => {
      return acc + (selectedOptions[index] === question.correctAnswer ? 1 : 0);
    }, 0);
    
    // Calculate reward
    const accuracy = (correctCount / questions.length) * 100;
    let reward = '';
    if (accuracy >= 95) reward = 'gold';
    else if (accuracy >= 80) reward = 'silver';
    else if (accuracy >= 65) reward = 'bronze';

    navigate('/result', {
      state: {
        questions: questions.map(q => ({
          ...q,
          correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : q.answer
        })),
        selectedOptions,
        topic,
        totalTime,
        timeLeft, // Remaining time in seconds
        timeTaken: timeTakenInSeconds, // Actual time spent
        reward // Add reward to state
      }
    });
  };
  submitQuizRef.current = handleSubmit;

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

  useEffect(() => {
    if (questions.length === 0) return undefined;

    const keepQuizHistoryEntry = () => {
      window.history.pushState(window.history.state, '', window.location.href);
    };
    const preventLeavingQuiz = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    keepQuizHistoryEntry();
    window.addEventListener('popstate', keepQuizHistoryEntry);
    window.addEventListener('beforeunload', preventLeavingQuiz);

    return () => {
      window.removeEventListener('popstate', keepQuizHistoryEntry);
      window.removeEventListener('beforeunload', preventLeavingQuiz);
    };
  }, [questions.length]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (questions.length === 0) return null;

  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="questions-page">
      <section className="questions-card" aria-label={`${topic} quiz`}>
        <div className="questions-topline">
          <p
            className="questions-topic"
            style={topicTransition ? { viewTransitionName: 'quiz-topic' } : undefined}
          >
            {topic} Quiz
          </p>
          <p className="questions-timer" aria-live="off">Time left: {formatTime(timeLeft)}</p>
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
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => handleOptionSelect(index)}
                  className={`question-option${isSelected ? ' question-option-selected' : ''}`}
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
    </div>
  );
}