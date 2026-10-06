import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, ChevronDown, Zap, Hourglass } from 'lucide-react';
import './TakeQuizPage.css';

const hotTopics = ['JavaScript', 'Python', 'React', 'Node.js', 'Data Structures', 'Algorithms'];
const difficultyLevels = ['Easy', 'Medium', 'Hard'];

export default function TakeQuizPage() {
    const location = useLocation();
    const trendingTopic = location.state?.trendingTopic || '';
    const topicTransition = Boolean(location.state?.topicTransition && trendingTopic);
    const backgroundTopics = Array.isArray(location.state?.backgroundTopics)
        ? location.state.backgroundTopics
        : [];
    const [topic, setTopic] = useState(trendingTopic);
    const [numQuestions, setNumQuestions] = useState(10);
    const [difficulty, setDifficulty] = useState('Medium');
    const [totalTime, setTotalTime] = useState(1); // Default 1 minute
    const [randomTopic, setRandomTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const topicInputRef = useRef(null);
    const transitionTimer = useRef(null);

    useEffect(() => {
        setRandomTopic(hotTopics[Math.floor(Math.random() * hotTopics.length)]);
    }, []);

    useEffect(() => () => window.clearTimeout(transitionTimer.current), []);

    useEffect(() => {
        if (!topicTransition) return undefined;

        const focusFrame = requestAnimationFrame(() => {
            topicInputRef.current?.focus({ preventScroll: true });
            topicInputRef.current?.setSelectionRange(topic.length, topic.length);
        });

        return () => cancelAnimationFrame(focusFrame);
    }, [topic, topicTransition]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const selectedTopic = topic || randomTopic;
            const prompt = `Generate ${numQuestions} multiple choice questions about ${selectedTopic}. 
                          Format response as plain JSON (without markdown) with questions array containing:
                          - question: string
                          - options: string[]
                          - correctAnswer: number (index of correct option)
                          Difficulty: ${difficulty}`;
        
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/quiz/generate`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({ 
                prompt,
                topic: selectedTopic,
                numQuestions,
                difficulty
              })
            });
        
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Quiz generation failed');
        
            // Handle raw JSON or markdown-cleaned responses
            let questions;
            if (typeof data.data === 'string') {
              try {
                questions = JSON.parse(data.data.replace(/```json|```/g, '').trim()).questions;
              } catch {
                questions = JSON.parse(data.data).questions;
              }
            } else {
              questions = data.data.questions || data.data;
            }

                        setIsTransitioning(true);
                        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                        await new Promise(resolve => {
                            transitionTimer.current = window.setTimeout(resolve, reducedMotion ? 0 : 1280);
                        });
        
            navigate('/questions', {
              state: {
                questions,
                topic: selectedTopic,
                                topicTransition: topicTransition || backgroundTopics.length > 0,
                                backgroundTopics,
                numQuestions,
                difficulty,
                totalTime,
                fromCache: data.cached
                            },
                            viewTransition: true
            });
          } catch (err) {
            setError(err.message.includes('API key') 
                            ? 'Please configure a valid Groq API key in the backend'
              : err.message);
            console.error('Quiz submission error:', err);
          } finally {
            setIsLoading(false);
          }
        };

    return (
                <div className={`take-quiz-stage${topicTransition ? ' take-quiz-stage-transition' : ''}${isTransitioning ? ' take-quiz-stage-launching' : ''}`}>
                {backgroundTopics.length > 0 && (
                    <div className="take-quiz-topic-backdrop" aria-hidden="true">
                        {backgroundTopics.map((backgroundTopic, index) => (
                            <span
                                key={`${backgroundTopic}-${index}`}
                                style={{
                                    '--quiz-topic-index': index,
                                    '--quiz-topic-x': `${10 + ((index * 37) % 80)}%`,
                                    '--quiz-topic-y': `${12 + ((index * 23) % 76)}%`
                                }}
                            >
                                {backgroundTopic}
                            </span>
                        ))}
                    </div>
                )}
                <div className={`take-quiz-card${topicTransition ? ' take-quiz-card-arrive' : ''}`}>
            <h2 className="quiz-setup-title">
                <span className="quiz-setup-icon"><BookOpen size={19} /></span> Take a Quiz
            </h2>

            <form onSubmit={handleSubmit} className="quiz-setup-form">
                <div className="quiz-field">
                    <label htmlFor="quiz-topic-input">Enter Topic</label>
                    <input
                        type="text"
                        id="quiz-topic-input"
                        ref={topicInputRef}
                        className="quiz-field-control"
                        placeholder={`Try "${randomTopic}"`}
                        value={topic}
                        style={topicTransition ? { viewTransitionName: 'quiz-topic' } : undefined}
                        required
                        maxLength={50}
                        onChange={(e) => setTopic(e.target.value)}
                    />
                </div>

                <div className="quiz-field">
                    <label htmlFor="quiz-question-count">Number of Questions</label>
                    <div className="quiz-select-wrap">
                        <select
                            id="quiz-question-count"
                            className="quiz-field-control quiz-select"
                            value={numQuestions}
                            onChange={(e) => setNumQuestions(Number(e.target.value))}
                        >
                            {[5, 10, 15, 20].map(num => (
                                <option key={num} value={num}>{num}</option>
                            ))}
                        </select>
                        <ChevronDown className="quiz-select-icon" size={18} />
                    </div>
                </div>

                <div className="quiz-field">
                    <label htmlFor="quiz-difficulty">Difficulty Level</label>
                    <div className="quiz-select-wrap">
                        <select
                            id="quiz-difficulty"
                            className="quiz-field-control quiz-select"
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                        >
                            {difficultyLevels.map(level => (
                                <option key={level} value={level}>{level}</option>
                            ))}
                        </select>
                        <ChevronDown className="quiz-select-icon" size={18} />
                    </div>
                </div>

                <section className="quiz-timer-panel">
                    <div className="quiz-timer-heading">
                        <span className="quiz-timer-icon"><Hourglass size={17} /></span>
                        <h3>Quiz Timer</h3>
                    </div>
                    <div className="quiz-timer-content">
                        <div className="quiz-field">
                            <label htmlFor="quiz-duration">Total quiz duration</label>
                            <div className="quiz-select-wrap">
                                <select
                                    id="quiz-duration"
                                    className="quiz-field-control quiz-select"
                                    value={totalTime}
                                    onChange={(e) => setTotalTime(Number(e.target.value))}
                                >
                                    {[1, 2, 5, 10, 15, 20].map(min => (
                                        <option key={min} value={min}>
                                            {min} minute{min !== 1 ? 's' : ''}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="quiz-select-icon" size={18} />
                            </div>
                        </div>
                        <p className="quiz-timer-note">The quiz will automatically submit when time runs out.</p>
                    </div>
                </section>

                {isLoading && (
                    <div className="quiz-loading">
                        <Hourglass className="animate-spin" size={17} />
                        <span>Generating your quiz...</span>
                    </div>
                )}

                {error && (
                    <div className="quiz-error" role="alert">{error}</div>
                )}

                <button
                    type="submit"
                    className="quiz-submit-button"
                        disabled={isLoading || isTransitioning}
                >
                    {isLoading ? 'Generating...' : (
                        <>
                            <Zap className="h-4 w-4" />
                            <span>Start Quiz</span>
                        </>
                    )}
                </button>
            </form>
        </div>
        </div>
    );
}