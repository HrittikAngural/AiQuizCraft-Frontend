import { useMemo, useState } from 'react';
import { ArrowLeft, Check, CheckCircle2, CircleHelp, Home, SkipForward, X, XCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import './AnswerReviewPage.css';

const filters = ['all', 'correct', 'incorrect', 'skipped'];
const EMPTY_QUESTIONS = [];
const EMPTY_OPTIONS = {};

const getOutcome = (question, selected) => {
  if (selected === undefined || selected === null) return 'skipped';
  return selected === question.correctAnswer ? 'correct' : 'incorrect';
};

export default function AnswerReviewPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const questions = Array.isArray(state?.questions) ? state.questions : EMPTY_QUESTIONS;
  const topic = state?.topic || 'Quiz';
  const selectedOptions = state?.selectedOptions || EMPTY_OPTIONS;
  const outcomes = useMemo(() => questions.map((question, index) => {
    const selected = Array.isArray(selectedOptions) ? selectedOptions[index] : selectedOptions[index];
    return { question, index, selected, outcome: getOutcome(question, selected) };
  }), [questions, selectedOptions]);
  const counts = outcomes.reduce((count, item) => ({ ...count, [item.outcome]: count[item.outcome] + 1 }), {
    all: outcomes.length,
    correct: 0,
    incorrect: 0,
    skipped: 0,
  });
  const visible = filter === 'all' ? outcomes : outcomes.filter((item) => item.outcome === filter);

  if (!questions.length) {
    return (
      <main className="answer-review-page">
        <section className="answer-review-empty">
          <CircleHelp size={28} />
          <h1>Answer review unavailable</h1>
          <p>Review details are available from the results screen immediately after a quiz.</p>
          <button type="button" onClick={() => navigate('/subjects')}><Home size={16} /> Explore subjects</button>
        </section>
      </main>
    );
  }

  return (
    <main className="answer-review-page">
      <div className="answer-review-shell">
        <button className="answer-review-back" type="button" onClick={() => navigate('/result', { state })}>
          <ArrowLeft size={16} /> Back to results
        </button>
        <header className="answer-review-header">
          <span className="review-eyebrow">LEARN FROM EVERY QUESTION</span>
          <h1>Answer review</h1>
          <p>{topic} · {questions.length} questions · See your answers, correct answers, and explanations.</p>
        </header>

        <div className="answer-review-filters" role="tablist" aria-label="Filter answers">
          {filters.map((value) => (
            <button
              type="button"
              role="tab"
              aria-selected={filter === value}
              className={filter === value ? 'answer-review-filter answer-review-filter-active' : 'answer-review-filter'}
              key={value}
              onClick={() => setFilter(value)}
            >
              {value[0].toUpperCase() + value.slice(1)} <span>{counts[value]}</span>
            </button>
          ))}
        </div>

        <section className="answer-review-list" aria-label="Reviewed questions">
          {visible.map(({ question, index, selected, outcome }) => {
            const options = Array.isArray(question.options) ? question.options : [];
            const correctAnswer = Number(question.correctAnswer);
            const StatusIcon = outcome === 'correct' ? CheckCircle2 : outcome === 'incorrect' ? XCircle : SkipForward;
            return (
              <article className={`answer-review-card review-card-${outcome}`} key={`${index}-${question.question}`}>
                <div className="answer-review-question-heading">
                  <div>
                    <span className="review-question-number">QUESTION {String(index + 1).padStart(2, '0')}</span>
                    <h2>{question.question}</h2>
                  </div>
                  <span className={`review-status review-status-${outcome}`}><StatusIcon size={14} /> {outcome}</span>
                </div>
                <div className="review-answer-options">
                  {options.map((option, optionIndex) => {
                    const isCorrect = optionIndex === correctAnswer;
                    const isSelectedWrong = selected === optionIndex && !isCorrect;
                    return (
                      <div className={`review-answer-option${isCorrect ? ' review-answer-correct' : ''}${isSelectedWrong ? ' review-answer-wrong' : ''}`} key={`${optionIndex}-${option}`}>
                        <span className="review-option-letter">{String.fromCharCode(65 + optionIndex)}</span>
                        <span>{option}</span>
                        <span className="review-option-mark">
                          {isCorrect && <><Check size={14} /> Correct answer</>}
                          {isSelectedWrong && <><X size={14} /> Your answer</>}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="review-explanation">
                  <strong><CircleHelp size={15} /> Explanation</strong>
                  <p>{typeof question.explanation === 'string' && question.explanation.trim()
                    ? question.explanation
                    : 'No explanation was provided for this question.'}</p>
                </div>
              </article>
            );
          })}
          {!visible.length && <div className="answer-review-empty-filter">There are no {filter} answers in this quiz.</div>}
        </section>
      </div>
    </main>
  );
}
