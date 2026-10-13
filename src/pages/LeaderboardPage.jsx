import { createElement, useEffect, useMemo, useState } from 'react';
import { Award, BarChart3, BookOpen, CalendarDays, CheckCircle2, Coins, Crown, LockKeyhole, Medal, Sparkles, Trophy } from 'lucide-react';
import api from '../utils/api';
import './LeaderboardPage.css';

const periods = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'all', label: 'All time' },
];

const tabs = [
  { value: 'leaderboard', label: 'Leaderboards' },
  { value: 'progress', label: 'My progress' },
  { value: 'achievements', label: 'Achievements' },
];

const initials = (name) => String(name || '?')
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0].toUpperCase())
  .join('');

const formatDate = (date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

function ProfileAvatar({ name, rank }) {
  return (
    <span className={`leader-avatar${rank ? ` leader-avatar-${rank}` : ''}`} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

function ProgressPanel({ results, currentUser }) {
  const dailyPoints = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      const dateKey = date.toDateString();
      const value = results.reduce((sum, result) => (
        new Date(result.createdAt).toDateString() === dateKey ? sum + (Number(result.score) || 0) : sum
      ), 0);
      return { date, value };
    });
  }, [results]);
  const topics = useMemo(() => {
    const grouped = new Map();
    results.forEach((result) => {
      const subject = result.subject?.trim() || 'Other topics';
      const entry = grouped.get(subject) || { total: 0, correct: 0, quizzes: 0 };
      entry.total += Number(result.totalQuestions) || 0;
      entry.correct += Number(result.score) || 0;
      entry.quizzes += 1;
      grouped.set(subject, entry);
    });
    return [...grouped.entries()]
      .map(([subject, stats]) => ({
        subject,
        ...stats,
        accuracy: stats.total ? Math.round((stats.correct / stats.total) * 100) : 0,
      }))
      .sort((first, second) => second.accuracy - first.accuracy);
  }, [results]);
  const maxPoints = Math.max(1, ...dailyPoints.map((point) => point.value));
  const correctAnswers = results.reduce((sum, result) => sum + (Number(result.score) || 0), 0);

  return (
    <div className="leader-progress-layout">
      <section className="leader-panel">
        <div className="leader-panel-heading">
          <div><span className="leader-kicker">YOUR LEARNING</span><h2>Progress overview</h2></div>
          <BookOpen size={19} />
        </div>
        <div className="leader-stat-grid">
          <div><span>Quizzes completed</span><strong>{currentUser.quizzes}</strong></div>
          <div><span>Answer accuracy</span><strong>{currentUser.accuracy}%</strong></div>
          <div><span>Correct answers</span><strong>{correctAnswers}</strong></div>
          <div><span>Points earned</span><strong>{currentUser.allTimePoints}</strong></div>
        </div>
      </section>
      <section className="leader-panel">
        <div className="leader-panel-heading">
          <div><span className="leader-kicker">LAST 7 DAYS</span><h2>Points earned</h2></div>
          <BarChart3 size={19} />
        </div>
        {results.length ? (
          <div className="leader-chart" aria-label="Points earned each of the last seven days">
            {dailyPoints.map(({ date, value }) => (
              <div className="leader-chart-column" key={date.toISOString()}>
                <span className="leader-chart-value">{value || ''}</span>
                <span className="leader-chart-bar" style={{ height: `${Math.max(5, (value / maxPoints) * 100)}%` }} />
                <span className="leader-chart-label">{date.toLocaleDateString(undefined, { weekday: 'short' })}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="leader-empty-inline">Complete a quiz to see your points progress here.</p>
        )}
      </section>
      <section className="leader-panel leader-topic-panel">
        <div className="leader-panel-heading">
          <div><span className="leader-kicker">SUBJECT PERFORMANCE</span><h2>Progress by subject</h2></div>
          <Sparkles size={19} />
        </div>
        {topics.length ? (
          <div className="leader-subject-list">
            {topics.map((topic) => (
              <div className="leader-subject-progress" key={topic.subject}>
                <div><strong>{topic.subject}</strong><span>{topic.quizzes} quiz{topic.quizzes === 1 ? '' : 'zes'}</span><b>{topic.accuracy}%</b></div>
                <span className="leader-progress-track"><span style={{ width: `${topic.accuracy}%` }} /></span>
              </div>
            ))}
          </div>
        ) : (
          <p className="leader-empty-inline">Your subject breakdown will appear after your first quiz.</p>
        )}
      </section>
    </div>
  );
}

function AchievementsPanel({ results, currentUser }) {
  const correctAnswers = results.reduce((sum, result) => sum + (Number(result.score) || 0), 0);
  const chronologicalResults = [...results].sort((first, second) => new Date(first.createdAt) - new Date(second.createdAt));
  const perfectResult = chronologicalResults.find((result) => Number(result.totalQuestions) > 0 && Number(result.score) === Number(result.totalQuestions));
  const resultAtQuizCount = (count) => chronologicalResults[count - 1]?.createdAt;
  let countedCorrect = 0;
  const centuryResult = chronologicalResults.find((result) => {
    countedCorrect += Number(result.score) || 0;
    return countedCorrect >= 100;
  });
  const achievements = [
    { name: 'First steps', detail: 'Complete your first quiz.', value: currentUser.quizzes, target: 1, Icon: BookOpen, earnedAt: resultAtQuizCount(1) },
    { name: 'Quiz explorer', detail: 'Complete 10 quizzes.', value: currentUser.quizzes, target: 10, Icon: Sparkles, earnedAt: resultAtQuizCount(10) },
    { name: 'Quiz regular', detail: 'Complete 25 quizzes.', value: currentUser.quizzes, target: 25, Icon: CalendarDays, earnedAt: resultAtQuizCount(25) },
    { name: 'Century club', detail: 'Answer 100 questions correctly.', value: correctAnswers, target: 100, Icon: Award, earnedAt: centuryResult?.createdAt },
    { name: 'Perfect run', detail: 'Get every question right in a quiz.', value: perfectResult ? 1 : 0, target: 1, Icon: Trophy, earnedAt: perfectResult?.createdAt },
  ];

  return (
    <div className="leader-panel">
      <div className="leader-panel-heading">
        <div><span className="leader-kicker">MILESTONES</span><h2>Achievements</h2></div>
        <Medal size={20} />
      </div>
      <p className="leader-panel-description">Earn badges as you build real quiz experience and improve your accuracy.</p>
      <div className="leader-achievement-grid">
        {achievements.map(({ name, detail, value, target, Icon, earnedAt }) => {
          const earned = value >= target;
          const progress = Math.min(100, Math.round((value / target) * 100));
          return (
            <article className={`leader-achievement${earned ? ' leader-achievement-earned' : ''}`} key={name}>
              <span className="leader-achievement-icon">{earned ? createElement(Icon, { size: 19 }) : <LockKeyhole size={18} />}</span>
              <div className="leader-achievement-content">
                <div className="leader-achievement-title"><h3>{name}</h3>{earned && <CheckCircle2 size={16} />}</div>
                <p>{detail}</p>
                {earned ? (
                  <span className="leader-achievement-date">{earnedAt ? `Earned ${formatDate(earnedAt)}` : 'Unlocked'}</span>
                ) : (
                  <>
                    <span className="leader-progress-track"><span style={{ width: `${progress}%` }} /></span>
                    <span className="leader-achievement-progress">{Math.min(value, target)} / {target}</span>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const [period, setPeriod] = useState('weekly');
  const [tab, setTab] = useState('leaderboard');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api.get(`/api/results/leaderboard?period=${period}`)
      .then(({ data: response }) => {
        if (!Array.isArray(response.leaderboard) || !Array.isArray(response.myResults)) {
          throw new Error('The leaderboard response was incomplete.');
        }
        if (active) setData(response);
      })
      .catch((requestError) => {
        if (active) {
          setData(null);
          setError(requestError.response?.data?.message || requestError.message || 'Leaderboard could not be loaded.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [period]);

  const rankedRows = useMemo(() => {
    if (!data) return [];
    const rows = [...data.leaderboard];
    const currentUser = data.currentUser;
    if (currentUser.rank && currentUser.rank > rows.length) {
      rows.push({
        userId: currentUser.id,
        name: currentUser.name,
        points: currentUser.points,
        rank: currentUser.rank,
        level: currentUser.level,
        accuracy: currentUser.accuracy,
      });
    }
    return rows;
  }, [data]);

  return (
    <main className="leaderboard-page">
      <div className="leaderboard-shell">
        <header className="leader-profile-banner">
          <div className="leader-profile-id">
            <ProfileAvatar name={data?.currentUser?.name || 'You'} />
            <div>
              <span className="leader-kicker">YOUR LEARNING PROFILE</span>
              <h1>{data?.currentUser?.name || 'Your leaderboard'}</h1>
              <p>Level {data?.currentUser?.level || 1} · {data?.currentUser?.quizzes || 0} quizzes completed</p>
              <span className="leader-level-progress" role="progressbar" aria-label="Progress to next level" aria-valuenow={(data?.currentUser?.allTimePoints || 0) % 100} aria-valuemin="0" aria-valuemax="100">
                <span style={{ width: `${(data?.currentUser?.allTimePoints || 0) % 100}%` }} />
              </span>
              <small className="leader-level-copy">{(data?.currentUser?.allTimePoints || 0) % 100} / 100 points to next level</small>
            </div>
          </div>
          <div className="leader-profile-points">
            <span><Coins size={16} /> Total points</span>
            <strong>{data?.currentUser?.allTimePoints ?? '—'}</strong>
            <span>{data?.currentUser?.rank ? `Rank #${data.currentUser.rank} this period` : 'Take a quiz to join the rankings'}</span>
          </div>
        </header>

        <nav className="leader-page-tabs" aria-label="Leaderboard sections" role="tablist">
          {tabs.map(({ value, label }) => (
            <button
              type="button"
              role="tab"
              aria-selected={tab === value}
              className={tab === value ? 'leader-page-tab leader-page-tab-active' : 'leader-page-tab'}
              key={value}
              onClick={() => setTab(value)}
            >
              {label}
            </button>
          ))}
        </nav>

        {tab === 'leaderboard' && (
          <>
            <section className="leader-list-panel">
              <div className="leader-section-top">
                <div>
                  <span className="leader-kicker">LEARN TOGETHER</span>
                  <h2>Leaderboard</h2>
                  <p>Points are earned for correct answers in completed quizzes.</p>
                </div>
                <div className="leader-periods" aria-label="Leaderboard period">
                  {periods.map(({ value, label }) => (
                    <button
                      type="button"
                      className={period === value ? 'leader-period leader-period-active' : 'leader-period'}
                      key={value}
                      onClick={() => setPeriod(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {loading ? (
                <div className="leader-loading" role="status"><span /> Loading rankings…</div>
              ) : error ? (
                <div className="leader-error" role="alert">{error}</div>
              ) : data?.leaderboard.length ? (
                <>
                  <div className="leader-podium" aria-label="Top three">
                    {[data.leaderboard[1], data.leaderboard[0], data.leaderboard[2]].map((player, index) => {
                      if (!player) return <div className="leader-podium-slot" key={`empty-${index}`} />;
                      const place = [2, 1, 3][index];
                      const Icon = place === 1 ? Crown : Medal;
                      return (
                        <article className={`leader-podium-player podium-place-${place}`} key={player.userId}>
                          <span className="leader-podium-medal">{createElement(Icon, { size: 18 })}</span>
                          <ProfileAvatar name={player.name} rank={place} />
                          <strong title={player.name}>{player.name}</strong>
                          <span>{player.points} pts</span>
                          <b>#{place}</b>
                        </article>
                      );
                    })}
                  </div>
                  <div className="leader-table-wrap">
                    <table className="leader-table">
                      <thead><tr><th>Rank</th><th>Learner</th><th>Points</th><th>Level</th></tr></thead>
                      <tbody>
                        {rankedRows.map((player) => {
                          const isCurrentUser = player.userId === data.currentUser.id;
                          return (
                            <tr className={isCurrentUser ? 'leader-current-user' : ''} key={player.userId}>
                              <td><span className={`leader-rank-number${player.rank <= 3 ? ` leader-rank-${player.rank}` : ''}`}>{player.rank}</span></td>
                              <td><span className="leader-name-cell"><ProfileAvatar name={player.name} /> <strong>{player.name}{isCurrentUser ? ' (you)' : ''}</strong></span></td>
                              <td><strong>{player.points}</strong></td>
                              <td>Level {player.level}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="leader-empty"><Trophy size={26} /><strong>No rankings yet</strong><span>Complete a quiz to earn points and appear here.</span></div>
              )}
            </section>
          </>
        )}

        {!loading && !error && data && tab === 'progress' && (
          <ProgressPanel results={data.myResults} currentUser={data.currentUser} />
        )}
        {!loading && !error && data && tab === 'achievements' && (
          <AchievementsPanel results={data.myResults} currentUser={data.currentUser} />
        )}
        {(loading || error) && tab !== 'leaderboard' && (
          <div className={error ? 'leader-error' : 'leader-loading'} role={error ? 'alert' : 'status'}>
            {error || 'Loading your learning data…'}
          </div>
        )}
      </div>
    </main>
  );
}
