import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { BookOpen, LayoutDashboard, LogIn } from 'lucide-react';
import api from '../utils/api';
import './HomePage.css';

const wordSlots = [
  { x: 50, y: 49 }, { x: 22, y: 32 }, { x: 79, y: 32 },
  { x: 24, y: 64 }, { x: 76, y: 64 }, { x: 50, y: 17 },
  { x: 13, y: 50 }, { x: 87, y: 50 }, { x: 38, y: 81 },
  { x: 63, y: 81 }, { x: 36, y: 20 }, { x: 66, y: 20 }
];

const wordColors = ['#102b4e', '#355f83', '#617487', '#244a70', '#52677c', '#426b91'];
const wordRotations = [0, 0, 0, 0, 0, 0, -90, 90, 0, 0, 0, 0];

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [topics, setTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    api.get('/api/results/popular-topics')
      .then(({ data }) => {
        if (isCurrent) setTopics(data.topics || []);
      })
      .catch(() => {
        if (isCurrent) setTopics([]);
      })
      .finally(() => {
        if (isCurrent) setTopicsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const maxCount = Math.max(...topics.map(topic => topic.count), 1);
  const minCount = Math.min(...topics.map(topic => topic.count), maxCount);

  const openTopicQuiz = (event, topic) => {
    if (document.startViewTransition) {
      event.currentTarget.style.viewTransitionName = 'quiz-topic';
    }

    navigate('/take-quiz', {
      state: { trendingTopic: topic, topicTransition: true },
      viewTransition: true
    });
  };

  return (
    <div className="home-page">
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
              const slot = wordSlots[index % wordSlots.length];
              const range = maxCount - minCount;
              const weight = range ? (topic.count - minCount) / range : 0;
              const fontSize = index === 0 ? 78 : 20 + Math.round(weight * 25);
              const rotation = topic.topic.length <= 9 ? wordRotations[index % wordRotations.length] : 0;

              return (
                <button
                  type="button"
                  className={`topic-word${index === 0 ? ' topic-word-leading' : ''}`}
                  key={topic.topic}
                  aria-label={`Double-click to start a quiz about ${topic.topic}`}
                  title="Double-click to quiz this topic"
                  onClick={(event) => {
                    if (event.detail === 0 || event.nativeEvent.pointerType === 'touch') {
                      openTopicQuiz(event, topic.topic);
                    }
                  }}
                  onDoubleClick={(event) => openTopicQuiz(event, topic.topic)}
                  style={{
                    '--topic-index': index,
                    '--word-x': `${slot.x}%`,
                    '--word-y': `${slot.y}%`,
                    '--word-size': `${fontSize}px`,
                    '--word-rotation': `${rotation}deg`,
                    '--word-color': wordColors[index % wordColors.length],
                    '--word-weight': index === 0 || weight > 0.55 ? 700 : 500
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

      <section className="home-actions">
        <div className="home-action-copy">
          <h2>Make your next topic a quiz.</h2>
          <p>Create a focused practice set and see what you know.</p>
        </div>
        <div className="home-action-buttons">
          {user ? (
            <>
              <button className="home-button home-button-primary" onClick={() => navigate('/take-quiz')}>
                <BookOpen size={18} /> Take a quiz
              </button>
              <button className="home-button home-button-secondary" onClick={() => navigate('/dashboard')}>
                <LayoutDashboard size={18} /> Dashboard
              </button>
            </>
          ) : (
            <button className="home-button home-button-primary" onClick={() => navigate('/login')}>
              <LogIn size={18} /> Get started
            </button>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;