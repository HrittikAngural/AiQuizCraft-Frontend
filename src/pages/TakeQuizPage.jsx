import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, BookOpen, ChevronDown, Zap, Hourglass, AlarmClock } from 'lucide-react';

const hotTopics = ['JavaScript', 'Python', 'React', 'Node.js', 'Data Structures', 'Algorithms'];
const difficultyLevels = ['Easy', 'Medium', 'Hard'];

export default function TakeQuizPage() {
    const [topic, setTopic] = useState('');
    const [numQuestions, setNumQuestions] = useState(10);
    const [difficulty, setDifficulty] = useState('Medium');
    const [totalTime, setTotalTime] = useState(1); // Default 1 minute
    const [randomTopic, setRandomTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        setRandomTopic(hotTopics[Math.floor(Math.random() * hotTopics.length)]);
    }, []);

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
        
            const response = await fetch('http://localhost:5000/api/quiz/generate', {
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
        
            navigate('/questions', {
              state: {
                questions,
                topic: selectedTopic,
                numQuestions,
                difficulty,
                totalTime,
                fromCache: data.cached
              }
            });
          } catch (err) {
            setError(err.message.includes('API key') 
              ? 'Please configure a valid Gemini API key in the backend'
              : err.message);
            console.error('Quiz submission error:', err);
          } finally {
            setIsLoading(false);
          }
        };

    return (
        <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-lg shadow-xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <BookOpen className="text-blue-500" /> Take a Quiz
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder={`Try "${randomTopic}"`}
                        value={topic}
                        required
                        maxLength={50}
                        onChange={(e) => setTopic(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Number of Questions</label>
                    <div className="relative">
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 appearance-none"
                            value={numQuestions}
                            onChange={(e) => setNumQuestions(Number(e.target.value))}
                        >
                            {[5, 10, 15, 20].map(num => (
                                <option key={num} value={num}>{num}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level</label>
                    <div className="relative">
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 appearance-none"
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                        >
                            {difficultyLevels.map(level => (
                                <option key={level} value={level}>{level}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                </div>

                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-3 mb-2">
                        <Hourglass className="text-blue-600" size={20} />
                        <h3 className="text-lg font-semibold text-blue-800">Quiz Timer</h3>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Total quiz duration
                            </label>
                            <div className="relative">
                                <select
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                                    value={totalTime}
                                    onChange={(e) => setTotalTime(Number(e.target.value))}
                                >
                                    {[1, 2, 5, 10, 15, 20].map(min => (
                                        <option key={min} value={min}>
                                            {min} minute{min !== 1 ? 's' : ''}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        <p className="text-sm text-gray-500">
                            The quiz will automatically submit when time runs out.
                        </p>
                    </div>
                </div>

                {isLoading && (
                    <div className="flex items-center justify-center gap-2 text-blue-500">
                        <Hourglass className="animate-spin" />
                        <span>Generating your quiz...</span>
                    </div>
                )}

                {error && (
                    <div className="text-red-500 text-sm">{error}</div>
                )}

                <button
                    type="submit"
                    className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={isLoading}
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
    );
}