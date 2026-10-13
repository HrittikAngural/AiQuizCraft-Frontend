import { useContext, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getSubject } from '../data/subjectCatalog';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import './ExplorePages.css';

const filters = [
  { value: 'all', label: 'All topics' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const topicDifficulty = {
  beginner: 'Easy',
  intermediate: 'Medium',
  advanced: 'Hard',
};

const difficultyOptions = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export default function SubjectTopicsPage() {
  const { subjectSlug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);
  const [filter, setFilter] = useState('all');
  const [selectedDifficulties, setSelectedDifficulties] = useState({});
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState('');
  const subject = getSubject(subjectSlug);
  useEffect(() => {
    if (!isAuthenticated) {
      setProfile(null);
      setProfileError('');
      return undefined;
    }
    let active = true;
    setProfileError('');
    api.get('/api/results/leaderboard?period=all')
      .then(({ data }) => {
        if (active) setProfile(data.currentUser || null);
      })
      .catch((error) => {
        if (active) {
          setProfile(null);
          setProfileError('Points summary could not be loaded.');
          console.error('Could not load your subject-page points summary:', error);
        }
      });
    return () => { active = false; };
  }, [isAuthenticated]);
  const topics = useMemo(
    () => subject?.topics.filter((topic) => filter === 'all' || topic.difficulty === filter) || [],
    [filter, subject],
  );

  if (!subject) {
    return (
      <main className="explore-page">
        <div className="explore-shell explore-not-found">
          <h1>Subject not found</h1>
          <Link to="/subjects" className="explore-back-link"><ArrowLeft size={16} /> Back to subjects</Link>
        </div>
      </main>
    );
  }

  const SubjectIcon = subject.Icon;

  return (
    <main className="explore-page">
      <div className="explore-shell">
        <Link to="/subjects" className="explore-back-link"><ArrowLeft size={16} /> Back to subjects</Link>
        <section className={`topic-subject-intro subject-card-${subject.color}`}>
          <span className="subject-icon"><SubjectIcon size={25} aria-hidden="true" /></span>
          <div>
            <span className="explore-eyebrow">SUBJECT GUIDE</span>
            <h1>{subject.name}</h1>
            <p>{subject.description}</p>
            <span className="topic-count">{subject.topics.length} curated topics · AI quizzes generated when you start</span>
          </div>
          <aside className="topic-intro-points">
            <span className="topic-intro-points-icon"><Sparkles size={17} /></span>
            <span>Your points</span>
            <strong>{profile ? profile.allTimePoints : '—'}</strong>
            <small>{profileError || (profile?.rank ? `Rank #${profile.rank}` : isAuthenticated ? 'Rank appears after a quiz' : 'Sign in to track points')}</small>
          </aside>
        </section>

        <div className="topic-list-heading">
          <div>
            <h2>Choose a topic</h2>
            <p>Pick a level to find the right challenge.</p>
          </div>
          <div className="topic-filters" role="tablist" aria-label="Filter topics by difficulty">
            {filters.map(({ value, label }) => (
              <button
                type="button"
                role="tab"
                aria-selected={filter === value}
                className={filter === value ? 'topic-filter topic-filter-active' : 'topic-filter'}
                key={value}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <section className="topic-list" aria-label={`${subject.name} topics`}>
          {topics.map((topic, index) => (
            <article className="topic-card" key={topic.name} style={{ '--topic-order': index }}>
              <span className="topic-card-icon"><BookOpen size={19} aria-hidden="true" /></span>
              <div className="topic-card-main">
                <h3>{topic.name}</h3>
                <span>Personalized quiz · AI generated on demand</span>
              </div>
              <label className="topic-difficulty-control">
                <span>Difficulty</span>
                <select
                  className={`difficulty-select difficulty-${selectedDifficulties[topic.name] || topic.difficulty}`}
                  aria-label={`Difficulty for ${topic.name}`}
                  value={selectedDifficulties[topic.name] || topic.difficulty}
                  onChange={(event) => setSelectedDifficulties((current) => ({
                    ...current,
                    [topic.name]: event.target.value,
                  }))}
                >
                  {difficultyOptions.map((option) => (
                    <option value={option.value} key={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="topic-take-button"
                onClick={() => navigate('/take-quiz', {
                  state: {
                    trendingTopic: topic.name,
                    topicTransition: true,
                    subject: subject.name,
                    difficulty: topicDifficulty[selectedDifficulties[topic.name] || topic.difficulty],
                    launchQuiz: true,
                    showPointsOnQuestions: true,
                  },
                })}
              >
                Take quiz <ArrowRight size={16} aria-hidden="true" />
              </button>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
