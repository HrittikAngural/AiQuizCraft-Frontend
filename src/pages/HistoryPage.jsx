import { useEffect, useState } from 'react';
import { Check, ChevronDown, CircleHelp, Clock3, Trophy, X } from 'lucide-react';
import api from '../utils/api';

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString();
};

function AnswerDetails({ item }) {
  if (!Array.isArray(item.answerDetails) || item.answerDetails.length === 0) {
    return (
      <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        Question-by-question answers are not available for this older quiz.
      </p>
    );
  }

  return (
    <div className="mt-4 grid gap-4">
      {item.answerDetails.map((detail, index) => (
        <article
          className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
          key={`${item._id || item.createdAt}-${index}`}
        >
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            <span className="mr-2 text-sm font-medium text-slate-500">Q{index + 1}.</span>
            {detail.question}
          </h3>
          <div className="mt-3 grid gap-2">
            {detail.options.map((option, optionIndex) => {
              const isCorrect = optionIndex === detail.correctAnswer;
              const isWrongSelection = optionIndex === detail.selectedOption && !isCorrect;
              const optionStyle = isCorrect
                ? 'border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950/40 dark:text-green-200'
                : isWrongSelection
                  ? 'border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200'
                  : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300';

              return (
                <div
                  className={`flex min-w-0 items-start gap-3 rounded-lg border px-3 py-2.5 text-sm ${optionStyle}`}
                  key={`${optionIndex}-${option}`}
                >
                  <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-black/5 text-xs font-bold dark:bg-white/10">
                    {String.fromCharCode(65 + optionIndex)}
                  </span>
                  <span className="min-w-0 flex-1 break-words">{option}</span>
                  {isCorrect && <span className="flex flex-none items-center gap-1 text-xs font-semibold"><Check size={15} /> Correct</span>}
                  {isWrongSelection && <span className="flex flex-none items-center gap-1 text-xs font-semibold"><X size={15} /> Your answer</span>}
                  {optionIndex === detail.selectedOption && isCorrect && (
                    <span className="flex flex-none items-center gap-1 text-xs font-semibold">Your answer</span>
                  )}
                </div>
              );
            })}
            {detail.selectedOption === null || detail.selectedOption === undefined ? (
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">You skipped this question.</p>
            ) : null}
          </div>
          {detail.explanation && (
            <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              <CircleHelp className="mt-0.5 flex-none" size={16} aria-hidden="true" />
              <span>{detail.explanation}</span>
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRecord, setExpandedRecord] = useState(null);

  useEffect(() => {
    let active = true;
    api.get('/api/results/history')
      .then(({ data }) => {
        if (!Array.isArray(data)) throw new Error('The quiz history response was invalid.');
        if (active) setHistory(data);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.response?.data?.message || requestError.message || 'Quiz history could not be loaded.');
          console.error('Error fetching history:', requestError);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-7">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
          <Clock3 size={16} aria-hidden="true" /> Your learning journey
        </p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 sm:text-4xl">Quiz History</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Select a topic to review its questions, your answers, and the correct answers.
        </p>
      </header>

      {loading ? (
        <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300" role="status">
          Loading quiz history…
        </p>
      ) : error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200" role="alert">
          {error}
        </p>
      ) : history.length ? (
        <section className="grid gap-4" aria-label="Past quizzes">
          {history.map((item, index) => {
            const recordId = item._id || `${item.createdAt}-${index}`;
            const isExpanded = expandedRecord === recordId;
            const detailCount = Array.isArray(item.answerDetails) ? item.answerDetails.length : 0;

            return (
              <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900" key={recordId}>
                <button
                  type="button"
                  className="flex w-full min-w-0 items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 dark:hover:bg-slate-800 sm:p-5"
                  onClick={() => setExpandedRecord(isExpanded ? null : recordId)}
                  aria-expanded={isExpanded}
                  aria-controls={`history-details-${index}`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 items-center gap-2">
                      <Trophy size={17} className="flex-none text-amber-500" aria-hidden="true" />
                      <span className="truncate text-base font-semibold text-slate-900 dark:text-slate-100 sm:text-lg">{item.topic || 'Quiz'}</span>
                    </span>
                    <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{formatDate(item.createdAt)}</span>
                  </span>
                  <span className="flex flex-none items-center gap-3">
                    <span className="text-right">
                      <span className="block text-sm font-bold text-slate-800 dark:text-slate-200">{item.score ?? 0}/{item.totalQuestions ?? 0}</span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400">{detailCount ? `${detailCount} questions` : 'View quiz'}</span>
                    </span>
                    <ChevronDown
                      size={18}
                      className={`text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </span>
                </button>

                <div id={`history-details-${index}`} hidden={!isExpanded} className="border-t border-slate-200 px-4 pb-4 sm:px-5 sm:pb-5 dark:border-slate-700">
                  {isExpanded && (
                    <>
                      <dl className="grid grid-cols-2 gap-3 py-4 text-sm sm:grid-cols-4">
                        <div><dt className="text-xs text-slate-500 dark:text-slate-400">Attempted</dt><dd className="mt-1 font-medium text-slate-800 dark:text-slate-200">{item.attempted ?? 0}</dd></div>
                        <div><dt className="text-xs text-slate-500 dark:text-slate-400">Time taken</dt><dd className="mt-1 font-medium text-slate-800 dark:text-slate-200">{item.timeTaken ?? 0}s</dd></div>
                        <div><dt className="text-xs text-slate-500 dark:text-slate-400">Reward</dt><dd className="mt-1 font-medium capitalize text-slate-800 dark:text-slate-200">{item.reward || 'No reward'}</dd></div>
                        <div><dt className="text-xs text-slate-500 dark:text-slate-400">Answer key</dt><dd className="mt-1 flex items-center gap-2"><span className="text-xs font-semibold text-green-700 dark:text-green-300">Correct</span><span className="text-xs font-semibold text-red-700 dark:text-red-300">Wrong</span></dd></div>
                      </dl>
                      <AnswerDetails item={item} />
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          No quiz history found yet. Complete a quiz to see it here.
        </p>
      )}
    </main>
  );
}
