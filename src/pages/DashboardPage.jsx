import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BookOpen,
  Brain,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flame,
  LockKeyhole,
  Medal,
  Search,
  Share2,
  Sparkles,
  Star,
  Target,
  Trophy,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import './DashboardPage.css';

const dateKey = (date) => {
  const localDate = new Date(date);
  return `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
};

const getDashboardCacheKey = (userId) => `quizcraft-dashboard-${userId}`;

const readDashboardCache = (userId) => {
  try {
    const cachedData = sessionStorage.getItem(getDashboardCacheKey(userId));
    if (!cachedData) return null;

    const parsedData = JSON.parse(cachedData);
    if (!Array.isArray(parsedData.history) || !Array.isArray(parsedData.topics)) {
      throw new Error('The saved dashboard data is invalid.');
    }
    return parsedData;
  } catch (error) {
    console.error('Could not restore saved dashboard data:', error);
    return null;
  }
};

const formatDate = (date) => new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
}).format(new Date(date));

const getDailyQuizCounts = (history, weekOffset) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  today.setDate(today.getDate() + weekOffset * 7);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const key = dateKey(date);
    return {
      date,
      label: new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date),
      value: history.filter((result) => dateKey(result.createdAt) === key).length,
    };
  });
};

const getLongestStreak = (history) => {
  const days = [...new Set(history.map((result) => dateKey(result.createdAt)))].sort();
  let longest = 0;
  let current = 0;
  let previousDate = null;

  days.forEach((day) => {
    const date = new Date(`${day}T00:00:00`);
    const difference = previousDate ? (date - previousDate) / 86400000 : null;
    current = difference === 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
    previousDate = date;
  });

  return longest;
};

const getAchievementTracks = (history) => {
  const totalQuestions = history.reduce((total, result) => total + (Number(result.totalQuestions) || 0), 0);
  const correctAnswers = history.reduce((total, result) => total + (Number(result.score) || 0), 0);
  const averageScore = totalQuestions ? (correctAnswers / totalQuestions) * 100 : 0;
  const uniqueTopics = new Set(history.map((result) => result.topic?.trim().toLowerCase()).filter(Boolean)).size;
  const earnedRewards = history.filter((result) => ['gold', 'silver', 'bronze'].includes(result.reward)).length;
  const longestStreak = getLongestStreak(history);

  return [
    {
      id: 'quiz-starter',
      title: 'Quiz trailblazer',
      category: 'Milestones',
      description: 'Build momentum by completing quizzes.',
      value: history.length,
      targets: [1, 5, 15],
      unit: 'quizzes',
      Icon: BookOpen,
      color: 'lavender',
    },
    {
      id: 'topic-explorer',
      title: 'Curious explorer',
      category: 'Discovery',
      description: 'Keep learning by exploring different topics.',
      value: uniqueTopics,
      targets: [1, 3, 8],
      unit: 'topics',
      Icon: Sparkles,
      color: 'mint',
    },
    {
      id: 'accuracy',
      title: 'Bright mind',
      category: 'Mastery',
      description: 'Grow your average quiz accuracy.',
      value: averageScore,
      targets: [60, 75, 90],
      unit: '% accuracy',
      Icon: Brain,
      color: 'peach',
    },
    {
      id: 'rewards',
      title: 'Reward collector',
      category: 'Rewards',
      description: 'Earn rewards as you complete quizzes.',
      value: earnedRewards,
      targets: [1, 3, 10],
      unit: 'rewards',
      Icon: Trophy,
      color: 'gold',
    },
    {
      id: 'streak',
      title: 'Learning streak',
      category: 'Consistency',
      description: 'Show up for your learning on consecutive days.',
      value: longestStreak,
      targets: [2, 5, 10],
      unit: 'days',
      Icon: Flame,
      color: 'blue',
    },
  ];
};

const getBadgeProgress = (achievement) => {
  const achievedLevels = achievement.targets.filter((target) => achievement.value >= target).length;
  const isEarned = achievedLevels > 0;
  const nextTarget = achievement.targets[Math.min(achievedLevels, achievement.targets.length - 1)];
  const progress = Math.min(100, (achievement.value / nextTarget) * 100);
  const levels = ['Bronze', 'Silver', 'Gold'];

  return {
    isEarned,
    level: isEarned ? `Level ${achievedLevels} · ${levels[achievedLevels - 1]}` : 'Locked · Starter',
    nextTarget,
    progress,
    maxed: achievedLevels === achievement.targets.length,
  };
};

function SelectFilter({ label, value, onChange, options, disabled = false }) {
  return (
    <label className={`dashboard-filter${disabled ? ' dashboard-filter-disabled' : ''}`}>
      <span>{label}</span>
      <span className="dashboard-select-wrap">
        <select value={value} onChange={onChange} disabled={disabled} aria-label={label}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <ChevronDown size={14} aria-hidden="true" />
      </span>
    </label>
  );
}

function TrendChart({ title, subtitle, points, icon, weekOffset, onPrevious, onNext, empty = false, loading = false }) {
  const maxValue = Math.max(4, ...points.map((point) => point.value));
  const coordinates = points.map((point, index) => ({
    ...point,
    x: 20 + (index * 560) / Math.max(1, points.length - 1),
    y: 128 - (point.value / maxValue) * 100,
  }));
  const linePath = coordinates.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = coordinates[index - 1];
    const middleX = (previous.x + point.x) / 2;
    return `${path} Q ${middleX} ${previous.y}, ${middleX} ${(previous.y + point.y) / 2} T ${point.x} ${point.y}`;
  }, '');
  const areaPath = `${linePath} L 580 144 L 20 144 Z`;
  const firstDate = points[0]?.date;
  const lastDate = points[points.length - 1]?.date;

  return (
    <section className="dashboard-card trend-card">
      <div className="trend-heading">
        <div className="trend-title-group">
          <span className="trend-icon">{React.createElement(icon, { size: 17 })}</span>
          <div>
            <h3>{title}</h3>
            <p>{subtitle}</p>
          </div>
        </div>
        <div className="trend-controls">
          <span>{firstDate && lastDate ? `${formatDate(firstDate)} – ${formatDate(lastDate)}` : 'Last 7 days'}</span>
          <button type="button" onClick={onPrevious} aria-label={`Show earlier ${title.toLowerCase()}`}>
            <ChevronLeft size={16} />
          </button>
          <button type="button" onClick={onNext} disabled={weekOffset === 0} aria-label={`Show later ${title.toLowerCase()}`}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      {empty ? (
        <div className="trend-empty">
          <CalendarDays size={22} />
          <span>Test activity will appear here when test tracking is available.</span>
        </div>
      ) : loading ? (
        <div className="trend-loading" role="status" aria-label={`Loading ${title.toLowerCase()}`}>
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      ) : (
        <div className="trend-graph">
          <svg viewBox="0 0 600 160" role="img" aria-label={`${title} over the selected week`}>
            {[28, 68, 108, 148].map((y) => <line key={y} x1="20" x2="580" y1={y} y2={y} className="trend-grid-line" />)}
            <path d={areaPath} className="trend-area" />
            <path d={linePath} className="trend-line" />
            {coordinates.map((point) => (
              <circle key={point.date.toISOString()} cx={point.x} cy={point.y} r="4" className="trend-point">
                <title>{`${point.label}, ${point.value} ${title.toLowerCase()}`}</title>
              </circle>
            ))}
          </svg>
          <div className="trend-labels">
            {points.map((point) => <span key={point.date.toISOString()}>{point.label}</span>)}
          </div>
        </div>
      )}
    </section>
  );
}

const DashboardPage = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [initialCache] = useState(() => readDashboardCache(user?.id || user?._id));
  const [quizHistory, setQuizHistory] = useState(() => initialCache?.history || []);
  const [recentTopics, setRecentTopics] = useState(() => initialCache?.topics || []);
  const [historyLoading, setHistoryLoading] = useState(() => !initialCache);
  const [topicsLoading, setTopicsLoading] = useState(() => !initialCache);
  const [historyError, setHistoryError] = useState('');
  const [topicsError, setTopicsError] = useState('');
  const [subject, setSubject] = useState('all');
  const [achievementSubject, setAchievementSubject] = useState('all');
  const [achievementCategory, setAchievementCategory] = useState('all');
  const [achievementTab, setAchievementTab] = useState('all');
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    if (authLoading) return undefined;

    if (!user) {
      setQuizHistory([]);
      setRecentTopics([]);
      setHistoryLoading(false);
      setTopicsLoading(false);
      return undefined;
    }

    const userId = user.id || user._id;
    const cachedData = readDashboardCache(userId);
    if (cachedData) {
      setQuizHistory(cachedData.history);
      setRecentTopics(cachedData.topics);
    }

    let isCurrent = true;
    setHistoryLoading(!cachedData);
    setTopicsLoading(!cachedData);
    setHistoryError('');
    setTopicsError('');

    api.get('/api/results/history')
      .then(({ data }) => {
        if (!isCurrent) return;
        if (!Array.isArray(data)) throw new Error('The quiz history response was invalid.');
        setQuizHistory(data);
        const latestCache = readDashboardCache(userId);
        sessionStorage.setItem(getDashboardCacheKey(userId), JSON.stringify({
          history: data,
          topics: latestCache?.topics || [],
        }));
      })
      .catch((error) => {
        if (!isCurrent) return;
        setHistoryError(error.response?.data?.message || error.message || 'Quiz history could not be loaded.');
        if (!cachedData) setQuizHistory([]);
      })
      .finally(() => {
        if (isCurrent) setHistoryLoading(false);
      });

    api.get('/api/results/recent-topics')
      .then(({ data }) => {
        if (!isCurrent) return;
        if (!Array.isArray(data)) throw new Error('The recent searches response was invalid.');
        setRecentTopics(data);
        const latestCache = readDashboardCache(userId);
        sessionStorage.setItem(getDashboardCacheKey(userId), JSON.stringify({
          history: latestCache?.history || [],
          topics: data,
        }));
      })
      .catch((error) => {
        if (!isCurrent) return;
        setTopicsError(error.response?.data?.message || error.message || 'Recent searches could not be loaded.');
        if (!cachedData) setRecentTopics([]);
      })
      .finally(() => {
        if (isCurrent) setTopicsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [authLoading, user]);

  const subjects = useMemo(() => [...new Set(
    quizHistory.map((result) => result.topic?.trim()).filter(Boolean),
  )].sort((first, second) => first.localeCompare(second)), [quizHistory]);

  const filteredHistory = useMemo(
    () => subject === 'all' ? quizHistory : quizHistory.filter((result) => result.topic === subject),
    [quizHistory, subject],
  );
  const achievementHistory = useMemo(
    () => achievementSubject === 'all'
      ? quizHistory
      : quizHistory.filter((result) => result.topic === achievementSubject),
    [quizHistory, achievementSubject],
  );

  const progress = useMemo(() => {
    const totalQuestions = filteredHistory.reduce((total, result) => total + (Number(result.totalQuestions) || 0), 0);
    const answeredQuestions = filteredHistory.reduce((total, result) => {
      const questionCount = Number(result.totalQuestions) || 0;
      const answered = Number(result.attempted);
      return total + Math.min(questionCount, Math.max(0, Number.isFinite(answered) ? answered : questionCount));
    }, 0);
    const correctAnswers = filteredHistory.reduce((total, result) => total + (Number(result.score) || 0), 0);

    return {
      completion: totalQuestions ? Math.round((answeredQuestions / totalQuestions) * 100) : 0,
      answeredQuestions,
      remainingQuestions: Math.max(0, totalQuestions - answeredQuestions),
      averageScore: totalQuestions ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
    };
  }, [filteredHistory]);

  const achievementTracks = useMemo(() => getAchievementTracks(achievementHistory), [achievementHistory]);
  const earnedCount = achievementTracks.filter((achievement) => getBadgeProgress(achievement).isEarned).length;
  const filteredAchievements = achievementTracks.filter((achievement) => {
    const status = getBadgeProgress(achievement).isEarned;
    const matchesTab = achievementTab === 'all' || (achievementTab === 'earned' ? status : !status);
    const matchesCategory = achievementCategory === 'all' || achievement.category === achievementCategory;
    return matchesTab && matchesCategory;
  });

  const quizPoints = useMemo(() => getDailyQuizCounts(quizHistory, weekOffset), [quizHistory, weekOffset]);
  const quizzesThisWeek = quizPoints.reduce((total, point) => total + point.value, 0);
  const averageTestScore = '—';

  const shareAchievement = async (achievement) => {
    const message = `I earned the ${achievement.title} achievement on QuizCraft!`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'QuizCraft achievement', text: message });
        return;
      }
      if (!navigator.clipboard?.writeText) {
        toast.error('Sharing is not supported in this browser.');
        return;
      }
      await navigator.clipboard.writeText(message);
      toast.success('Achievement message copied to your clipboard.');
    } catch (error) {
      if (error.name !== 'AbortError') {
        toast.error('Could not share this achievement. Please try again.');
      }
    }
  };

  const openTopic = (topic) => navigate('/take-quiz', {
    state: { trendingTopic: topic, topicTransition: true },
  });

  const categories = ['Milestones', 'Discovery', 'Mastery', 'Rewards', 'Consistency'];

  return (
    <div className="learning-dashboard">
      <div className="dashboard-shell">
        <header className="dashboard-topbar">
          <div>
            <div className="dashboard-eyebrow"><Sparkles size={14} /> YOUR LEARNING SPACE</div>
            <h1>My Progress<span>.</span></h1>
            <p>A little progress every day adds up to something big.</p>
          </div>
          <button className="dashboard-primary-button" type="button" onClick={() => navigate('/take-quiz')}>
            <BookOpen size={17} /> Start a quiz <ArrowUpRight size={15} />
          </button>
        </header>

        <div className="dashboard-columns">
          <main className="dashboard-main-column">
            <section className="dashboard-card progress-card">
              <div className="section-heading">
                <div>
                  <div className="card-kicker">YOUR LEARNING JOURNEY</div>
                  <h2>Learning progress</h2>
                  <p>See how consistently you’re working through quiz questions.</p>
                </div>
                <span className="section-heading-icon"><Target size={19} /></span>
              </div>

              <div className="filter-row">
                <SelectFilter
                  label="Class"
                  value="all"
                  onChange={() => {}}
                  disabled
                  options={[{ value: 'all', label: 'All classes' }]}
                />
                <SelectFilter
                  label="Subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  options={[
                    { value: 'all', label: 'All subjects' },
                    ...subjects.map((topic) => ({ value: topic, label: topic })),
                  ]}
                />
              </div>

              <div className="progress-content">
                <div
                  className="progress-ring"
                  style={{ '--progress-angle': `${progress.completion * 3.6}deg` }}
                  role="img"
                  aria-label={`${progress.completion}% of quiz questions answered`}
                >
                  <div className="progress-ring-inner">
                    <strong>{progress.completion}<span>%</span></strong>
                    <span>answered</span>
                  </div>
                </div>
                <div className="progress-details">
                  <div className="progress-summary">
                    <span className="progress-summary-icon"><Check size={15} /></span>
                    <div>
                      <strong>{progress.answeredQuestions.toLocaleString()} questions answered</strong>
                      <span>Across {filteredHistory.length} completed {filteredHistory.length === 1 ? 'quiz' : 'quizzes'}</span>
                    </div>
                  </div>
                  <div className="progress-legend">
                    <span><i className="legend-dot legend-complete" /> Completed questions <strong>{progress.answeredQuestions}</strong></span>
                    <span><i className="legend-dot legend-remaining" /> Unanswered questions <strong>{progress.remainingQuestions}</strong></span>
                  </div>
                  <p className="filter-note">Class details aren’t available in your quiz history yet.</p>
                </div>
              </div>
            </section>

            {historyError && (
              <p className="dashboard-inline-error" role="status">
                {historyError} Showing your last saved progress when available.
              </p>
            )}
            <div className="dashboard-stats">
              <section className="dashboard-card stat-card">
                <div className="stat-icon stat-icon-purple"><Target size={18} /></div>
                <div className="stat-label">Average quiz score</div>
                <div className="stat-value">{historyLoading ? '…' : `${progress.averageScore}%`}</div>
                <div className="stat-footnote"><ArrowUpRight size={14} /> Based on answered quiz questions</div>
              </section>
              <section className="dashboard-card stat-card">
                <div className="stat-icon stat-icon-peach"><Medal size={18} /></div>
                <div className="stat-label">Average test score</div>
                <div className="stat-value">{averageTestScore}</div>
                <div className="stat-footnote stat-muted"><Clock3 size={14} /> Test tracking isn’t available yet</div>
              </section>
            </div>

            <div className="dashboard-chart-grid">
              <TrendChart
                title="Quizzes completed"
                subtitle={`${quizzesThisWeek} this week`}
                points={quizPoints}
                icon={BookOpen}
                weekOffset={weekOffset}
                onPrevious={() => setWeekOffset((offset) => offset - 1)}
                onNext={() => setWeekOffset((offset) => Math.min(0, offset + 1))}
                loading={historyLoading}
              />
              <TrendChart
                title="Tests attempted"
                subtitle="No test records yet"
                points={getDailyQuizCounts([], weekOffset)}
                icon={Medal}
                weekOffset={weekOffset}
                onPrevious={() => setWeekOffset((offset) => offset - 1)}
                onNext={() => setWeekOffset((offset) => Math.min(0, offset + 1))}
                empty
              />
            </div>

            <section className="dashboard-card recent-card">
              <div className="recent-heading">
                <div>
                  <div className="card-kicker">PICK UP WHERE YOU LEFT OFF</div>
                  <h2><Search size={19} /> Recent searched quiz topics</h2>
                  <p>Your latest topics are ready for another round.</p>
                </div>
                <button className="text-action" type="button" onClick={() => navigate('/history')}>
                  View history <ArrowUpRight size={14} />
                </button>
              </div>
              {topicsLoading ? (
                <div className="recent-state" role="status">Loading recent searches…</div>
              ) : topicsError && !recentTopics.length ? (
                <div className="recent-state recent-error">{topicsError}</div>
              ) : recentTopics.length ? (
                <ul className="recent-topic-list">
                  {recentTopics.map((item) => (
                    <li key={`${item.topic}-${item.createdAt}`}>
                      <button type="button" onClick={() => openTopic(item.topic)}>
                        <span className="topic-avatar"><BookOpen size={16} /></span>
                        <span className="topic-copy"><strong>{item.topic}</strong><small>Searched {formatDate(item.createdAt)}</small></span>
                        <ArrowUpRight size={16} className="topic-open-icon" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="recent-empty">
                  <span className="recent-empty-icon"><Search size={18} /></span>
                  <div><strong>No recent topics yet</strong><span>Choose a topic when you start a quiz and it’ll show up here.</span></div>
                  <button type="button" onClick={() => navigate('/take-quiz')}>Find a topic <ArrowUpRight size={14} /></button>
                </div>
              )}
              {topicsError && recentTopics.length > 0 && (
                <p className="dashboard-inline-error" role="status">
                  {topicsError} Showing your last saved searches.
                </p>
              )}
              {historyError && <p className="dashboard-inline-error">{historyError}</p>}
            </section>
          </main>

          <aside className="dashboard-card achievements-card">
            <div className="achievements-header">
              <div className="achievements-heading">
                <div className="card-kicker">MILESTONES & MOMENTS</div>
                <h2>Achievements</h2>
                <p>Celebrate every step forward.</p>
              </div>
              <div className="earned-total"><Award size={17} /><strong>{earnedCount}</strong><span>earned</span></div>
            </div>

            <div className="achievement-filters">
              <SelectFilter
                label="Badge category"
                value={achievementCategory}
                onChange={(event) => setAchievementCategory(event.target.value)}
                options={[
                  { value: 'all', label: 'All categories' },
                  ...categories.map((category) => ({ value: category, label: category })),
                ]}
              />
              <div className="achievement-tabs" role="tablist" aria-label="Filter achievements">
                {[
                  ['all', 'All'],
                  ['earned', 'Earned'],
                  ['locked', 'Locked'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={achievementTab === value}
                    className={achievementTab === value ? 'active' : ''}
                    onClick={() => setAchievementTab(value)}
                  >
                    {label}
                    {value === 'earned' && <span>{earnedCount}</span>}
                  </button>
                ))}
              </div>
              <div className="filter-row achievement-extra-filters">
                <SelectFilter
                  label="Class"
                  value="all"
                  onChange={() => {}}
                  disabled
                  options={[{ value: 'all', label: 'All classes' }]}
                />
                <SelectFilter
                  label="Subject"
                  value={achievementSubject}
                  onChange={(event) => setAchievementSubject(event.target.value)}
                  options={[
                    { value: 'all', label: 'All subjects' },
                    ...subjects.map((topic) => ({ value: topic, label: topic })),
                  ]}
                />
              </div>
              <p className="filter-note">Class details aren’t available in your quiz history yet.</p>
            </div>

            <div className="achievement-list" aria-live="polite">
              {historyLoading ? (
                <div className="achievement-empty">Loading your achievements…</div>
              ) : filteredAchievements.length ? (
                filteredAchievements.map((achievement, index) => {
                  const badge = getBadgeProgress(achievement);
                  const Icon = achievement.Icon;
                  return (
                    <article
                      className={`achievement-item ${badge.isEarned ? 'achievement-earned' : 'achievement-locked'}`}
                      key={achievement.id}
                      style={{ '--achievement-index': index }}
                    >
                      <div className={`achievement-badge badge-${achievement.color}`}>
                        <Icon size={23} strokeWidth={1.9} />
                        {!badge.isEarned && <span className="badge-lock"><LockKeyhole size={11} /></span>}
                      </div>
                      <div className="achievement-body">
                        <div className="achievement-title-row">
                          <div><span className="achievement-category">{achievement.category}</span><h3>{achievement.title}</h3></div>
                          {badge.isEarned ? <Star className="achievement-star" size={16} fill="currentColor" /> : <LockKeyhole className="achievement-lock-icon" size={15} />}
                        </div>
                        <span className={`achievement-level${badge.isEarned ? ' level-earned' : ''}`}>{badge.level}</span>
                        <p className="achievement-description">{achievement.description}</p>
                        <div className="achievement-progress-track" role="progressbar" aria-valuenow={Math.round(badge.progress)} aria-valuemin="0" aria-valuemax="100" aria-label={`${achievement.title} progress`}>
                          <span style={{ width: `${badge.progress}%` }} />
                        </div>
                        <div className="achievement-progress-copy">
                          <span>{badge.maxed ? 'All levels completed' : `${Math.floor(achievement.value)} / ${badge.nextTarget} ${achievement.unit}`}</span>
                          <span>{badge.maxed ? 'Max level' : badge.isEarned ? 'Next level' : `Unlock at ${badge.nextTarget}`}</span>
                        </div>
                        {badge.isEarned ? (
                          <button className="share-achievement-button" type="button" onClick={() => shareAchievement(achievement)}>
                            <Share2 size={14} /> Share achievement
                          </button>
                        ) : (
                          <div className="unlock-requirement"><LockKeyhole size={13} /> Complete {badge.nextTarget} {achievement.unit} to unlock</div>
                        )}
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="achievement-empty">
                  <span><Award size={20} /></span>
                  No achievements match these filters.
                  <button type="button" onClick={() => { setAchievementTab('all'); setAchievementCategory('all'); }}>
                    Clear filters
                  </button>
                </div>
              )}
            </div>
            <div className="achievement-footnote"><ArrowDownRight size={14} /> Keep learning to unlock your next badge.</div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
