import { createElement, useContext, useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Search, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { subjectCatalog } from '../data/subjectCatalog';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import './ExplorePages.css';

export default function SubjectExplorerPage() {
  const [search, setSearch] = useState('');
  const [history, setHistory] = useState([]);
  const [historyError, setHistoryError] = useState('');
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  useEffect(() => {
    if (!isAuthenticated) {
      setHistory([]);
      setHistoryError('');
      return undefined;
    }
    let active = true;
    setHistoryError('');
    api.get('/api/results/history')
      .then(({ data }) => {
        if (!Array.isArray(data)) throw new Error('Quiz history response was invalid.');
        if (active) setHistory(data);
      })
      .catch((error) => {
        if (active) {
          setHistory([]);
          setHistoryError('Your quiz progress could not be loaded right now.');
          console.error('Could not load subject progress:', error);
        }
      });
    return () => { active = false; };
  }, [isAuthenticated]);

  const getProgress = (subjectName, topics) => {
    const topicNames = new Set(topics.map((topic) => topic.name.toLowerCase()));
    const subjectResults = history.filter((result) => (
      result.subject?.toLowerCase() === subjectName.toLowerCase() ||
      (!result.subject && topicNames.has(result.topic?.toLowerCase()))
    ));
    const questionCount = subjectResults.reduce((total, result) => total + (Number(result.totalQuestions) || 0), 0);
    const correctCount = subjectResults.reduce((total, result) => total + (Number(result.score) || 0), 0);
    return questionCount ? Math.round((correctCount / questionCount) * 100) : null;
  };
  const visibleSubjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return subjectCatalog.filter((subject) => subject.name.toLowerCase().includes(query));
  }, [search]);

  return (
    <main className="explore-page">
      <div className="explore-shell">
        <header className="explore-heading">
          <span className="explore-eyebrow"><Sparkles size={15} /> YOUR NEXT DISCOVERY</span>
          <h1>Explore subjects</h1>
          <p>Choose a subject to start your quiz journey and earn points.</p>
          <label className="explore-search">
            <Search size={19} aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search subjects"
              aria-label="Search subjects"
            />
          </label>
        </header>

        {visibleSubjects.length ? (
          <section className="subject-grid" aria-label="Subjects">
            {visibleSubjects.map(({ name, slug, Icon, description, color, topics }) => {
              const progress = getProgress(name, topics);
              return <button
                className={`subject-card subject-card-${color}`}
                type="button"
                key={slug}
                onClick={() => navigate(`/subjects/${slug}`)}
              >
                <span className="subject-icon">{createElement(Icon, { size: 22, 'aria-hidden': true })}</span>
                <span className="subject-card-content">
                  <strong>{name}</strong>
                  <span>{description}</span>
                </span>
                <span className="subject-card-meta">
                  <span>{topics.length} topics</span>
                  <span>AI quizzes on demand</span>
                </span>
                <span className="subject-card-progress">
                  <span>{historyError ? 'Progress unavailable' : progress === null ? 'No quiz progress yet' : `Personal accuracy · ${progress}%`}</span>
                  <span className="subject-progress-track">
                    <span style={{ width: `${progress ?? 0}%` }} />
                  </span>
                </span>
                <span className="subject-card-arrow"><ArrowUpRight size={18} aria-hidden="true" /></span>
              </button>;
            })}
          </section>
        ) : (
          <div className="explore-empty" role="status">
            No subjects match “{search}”. Try another search.
          </div>
        )}
        {historyError && <p className="explore-data-error" role="status">{historyError}</p>}
      </div>
    </main>
  );
}
