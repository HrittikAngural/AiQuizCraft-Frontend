import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, X } from 'lucide-react';
import api from '../utils/api';
import './HomePage.css';

const wordSlots = [
  { x: 50, y: 49 }, { x: 22, y: 32 }, { x: 79, y: 32 },
  { x: 24, y: 64 }, { x: 76, y: 64 }, { x: 50, y: 17 },
  { x: 13, y: 50 }, { x: 87, y: 50 }, { x: 38, y: 81 },
  { x: 63, y: 81 }, { x: 36, y: 20 }, { x: 66, y: 20 }
];

const wordColors = ['#102b4e', '#355f83', '#617487', '#244a70', '#52677c', '#426b91'];

const createTopicLayout = (popularTopics) => {
  const shuffledSlots = wordSlots.slice(1);
  for (let index = shuffledSlots.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffledSlots[index], shuffledSlots[swapIndex]] = [shuffledSlots[swapIndex], shuffledSlots[index]];
  }

  const highestCount = Math.max(...popularTopics.map(topic => topic.count), 1);
  const randomizedOrder = popularTopics.slice(1).map((_, index) => index + 1);
  for (let index = randomizedOrder.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [randomizedOrder[index], randomizedOrder[swapIndex]] = [randomizedOrder[swapIndex], randomizedOrder[index]];
  }

  return popularTopics.map((topic, index) => {
    const baseSlot = index === 0 ? null : shuffledSlots[(index - 1) % shuffledSlots.length];
    const popularity = Math.sqrt((topic.count || 0) / highestCount);
    const sizeTier = index === 0
      ? 'large'
      : popularity >= 0.3 && index === 1
        ? 'big'
        : popularity >= 0.4 && index <= 2
          ? 'medium'
          : popularity >= 0.25 && index <= 4
            ? 'small'
            : 'extra-small';
    const sizeRanges = {
      large: [76, 90, 42, 46],
      big: [52, 60, 32, 35],
      medium: [37, 44, 27, 30],
      small: [26, 32, 22, 25],
      'extra-small': [18, 24, 17, 20]
    };
    const [desktopMin, desktopMax, mobileMin, mobileMax] = sizeRanges[sizeTier];
    const x = index === 0
      ? 41 + Math.random() * 18
      : Math.max(10, Math.min(90, baseSlot.x + (Math.random() - 0.5) * 10));
    const y = index === 0
      ? 39 + Math.random() * 20
      : Math.max(14, Math.min(86, baseSlot.y + (Math.random() - 0.5) * 10));

    return {
      x,
      y,
      fontSize: Math.round(desktopMin + Math.random() * (desktopMax - desktopMin)),
      mobileFontSize: Math.round(mobileMin + Math.random() * (mobileMax - mobileMin)),
      rotation: 0,
      color: wordColors[Math.floor(Math.random() * wordColors.length)],
      weight: index === 0 || popularity > 0.62 ? 700 : 500,
      order: index === 0 ? 0 : randomizedOrder[index - 1]
    };
  });
};

const HomePage = () => {
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [topicLayout, setTopicLayout] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [showQuizDashboard, setShowQuizDashboard] = useState(false);
  const [isLaunchingQuiz, setIsLaunchingQuiz] = useState(false);
  const [dashboardTopic, setDashboardTopic] = useState('');
  const navigationStarted = useRef(false);
  const lastTouchTap = useRef({ topic: '', time: 0 });
  const launchTimeout = useRef(null);

  useEffect(() => {
    let isCurrent = true;

    api.get('/api/results/popular-topics')
      .then(({ data }) => {
        if (isCurrent) {
          const popularTopics = data.topics || [];
          setTopics(popularTopics);
          setTopicLayout(createTopicLayout(popularTopics));
        }
      })
      .catch(() => {
        if (isCurrent) {
          setTopics([]);
          setTopicLayout([]);
        }
      })
      .finally(() => {
        if (isCurrent) setTopicsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    let previousScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY - previousScrollY > 8 && currentScrollY > 24) {
        setShowQuizDashboard(true);
      } else if (previousScrollY - currentScrollY > 8 || currentScrollY < 24) {
        setShowQuizDashboard(false);
      }
      previousScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => () => window.clearTimeout(launchTimeout.current), []);

  useEffect(() => {
    if (!showQuizDashboard) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setShowQuizDashboard(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [showQuizDashboard]);

  const openTopicQuiz = (event, topic) => {
    if (navigationStarted.current) return;
    navigationStarted.current = true;

    if (document.startViewTransition) {
      event.currentTarget.style.viewTransitionName = 'quiz-topic';
    }

    navigate('/take-quiz', {
      state: {
        trendingTopic: topic,
        topicTransition: true,
        backgroundTopics: topics.map(item => item.topic)
      },
      viewTransition: true
    });
  };

  const launchQuizSetup = () => {
    if (navigationStarted.current) return;
    navigationStarted.current = true;

    const trendingTopic = dashboardTopic.trim();
    const sourceTopic = document.querySelector('.topic-word-leading');
    if (trendingTopic && document.startViewTransition && sourceTopic) {
      sourceTopic.style.viewTransitionName = 'quiz-topic';
    }

    setIsLaunchingQuiz(true);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    launchTimeout.current = window.setTimeout(() => {
      navigate('/take-quiz', {
        state: {
          trendingTopic,
          topicTransition: Boolean(trendingTopic),
          backgroundTopics: topics.map(item => item.topic)
        },
        viewTransition: true
      });
    }, reducedMotion ? 0 : 650);
  };

  return (
    <div className={`home-page${isLaunchingQuiz ? ' home-page-launching' : ''}`}>
      <section className="home-topics" aria-labelledby="popular-topics-title">
        <div className="home-topics-heading">
          <p className="home-eyebrow">PLATFORM PULSE | LAST 30 DAYS</p>
          <h1 id="popular-topics-title">What everyone is learning</h1>
          <p className="home-topics-caption">The topics learners are asking about most</p>
        </div>

        {topics.length > 0 ? (
          <div
            className="topic-cloud"
            role="group"
            aria-label={`Popular quiz topics: ${topics.map(topic => `${topic.topic}, ${topic.count} requests`).join('; ')}`}
          >
            {topics.map((topic, index) => {
              const fallbackSlot = wordSlots[index % wordSlots.length];
              const layout = topicLayout[index] || {
                x: fallbackSlot.x,
                y: fallbackSlot.y,
                fontSize: index === 0 ? 78 : 24,
                mobileFontSize: index === 0 ? 44 : 26,
                rotation: 0,
                color: wordColors[index % wordColors.length],
                weight: index === 0 ? 700 : 500,
                order: index
              };

              return (
                <button
                  type="button"
                  className={`topic-word${index === 0 ? ' topic-word-leading' : ''}`}
                  key={topic.topic}
                  aria-label={`Open a quiz about ${topic.topic}`}
                  title="Double-click to quiz this topic"
                  onClick={(event) => {
                    if (event.detail === 0) {
                      openTopicQuiz(event, topic.topic);
                    }
                  }}
                  onDoubleClick={(event) => openTopicQuiz(event, topic.topic)}
                  onPointerUp={(event) => {
                    if (event.pointerType !== 'touch') return;

                    const now = Date.now();
                    const previousTap = lastTouchTap.current;
                    if (previousTap.topic === topic.topic && now - previousTap.time < 450) {
                      event.preventDefault();
                      openTopicQuiz(event, topic.topic);
                      return;
                    }

                    lastTouchTap.current = { topic: topic.topic, time: now };
                  }}
                  data-topic-leading={index === 0 ? 'true' : undefined}
                  style={{
                    '--topic-index': index,
                    '--word-x': `${layout.x}%`,
                    '--word-y': `${layout.y}%`,
                    '--word-size': `${layout.fontSize}px`,
                    '--word-size-mobile': `${layout.mobileFontSize}px`,
                    '--word-rotation': `${layout.rotation}deg`,
                    '--word-color': layout.color,
                    '--word-weight': layout.weight,
                    '--word-order': layout.order
                  }}
                >
                  {topic.topic}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="topic-cloud-empty" aria-live="polite">
            {topicsLoading ? 'Gathering recent topics' : 'Popular topics will appear as learners generate quizzes.'}
          </div>
        )}
      </section>

      {showQuizDashboard && (
        <div className={`home-dashboard-backdrop${isLaunchingQuiz ? ' home-dashboard-backdrop-launching' : ''}`}>
          <section className="home-quiz-dashboard" aria-labelledby="home-dashboard-title">
            <button
              type="button"
              className="home-dashboard-close"
              aria-label="Close Take a Quiz dashboard"
              onClick={() => setShowQuizDashboard(false)}
              disabled={isLaunchingQuiz}
            >
              <X size={18} />
            </button>

            <p className="home-dashboard-eyebrow">TRENDING ACROSS AIQUIZCRAFT</p>
            <h2 id="home-dashboard-title">Take a Quiz</h2>
            <p className="home-dashboard-copy">Choose a topic to start a focused practice session.</p>

            <form
              className="home-dashboard-form"
              onSubmit={(event) => {
                event.preventDefault();
                launchQuizSetup();
              }}
            >
              <label htmlFor="home-dashboard-topic">Quiz topic</label>
              <input
                id="home-dashboard-topic"
                value={dashboardTopic}
                onChange={event => setDashboardTopic(event.target.value)}
                placeholder={topics[0]?.topic ? `Try ${topics[0].topic}` : 'Enter a topic'}
                maxLength={50}
                autoComplete="off"
                required
              />
              {topics.length > 0 && (
                <div className="home-dashboard-topics" aria-label="Trending topics">
                  <span>Trending now</span>
                  <div>
                    {topics.slice(0, 5).map(item => (
                      <button
                        key={item.topic}
                        type="button"
                        className={dashboardTopic === item.topic ? 'home-topic-chip home-topic-chip-active' : 'home-topic-chip'}
                        onClick={() => setDashboardTopic(item.topic)}
                        disabled={isLaunchingQuiz}
                      >
                        {item.topic}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button
                type="submit"
                className="home-dashboard-submit"
                disabled={!dashboardTopic.trim() || isLaunchingQuiz}
              >
                <BookOpen size={17} />
                {isLaunchingQuiz ? 'Opening quiz setup...' : 'Take Quiz'}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

export default HomePage;