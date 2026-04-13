import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export default function QuestionsPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { questions, totalTime, topic } = state;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [timeLeft, setTimeLeft] = useState(totalTime * 60); // Convert to seconds
  const [startTime] = useState(Date.now()); // Track quiz start time

  const handleOptionSelect = (optionIndex) => {
    setSelectedOptions(prev => ({
      ...prev,
      [currentQuestionIndex]: optionIndex
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    const endTime = Date.now();
    const timeTakenInSeconds = Math.floor((endTime - startTime) / 1000);
    
    const correctCount = questions.reduce((acc, question, index) => {
      return acc + (selectedOptions[index] === question.correctAnswer ? 1 : 0);
    }, 0);
    
    // Calculate reward
    const accuracy = (correctCount / questions.length) * 100;
    let reward = '';
    if (accuracy >= 95) reward = 'gold';
    else if (accuracy >= 80) reward = 'silver';
    else if (accuracy >= 65) reward = 'bronze';

    navigate('/result', {
      state: {
        questions: questions.map(q => ({
          ...q,
          correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : q.answer
        })),
        selectedOptions,
        topic,
        totalTime,
        timeLeft, // Remaining time in seconds
        timeTaken: timeTakenInSeconds, // Actual time spent
        reward // Add reward to state
      }
    });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedOptions]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-lg shadow-xl relative">
      <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg">
        Time left: {formatTime(timeLeft)}
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">{topic} Quiz</h2>
        <span className="text-sm text-gray-500">
          Question {currentQuestionIndex + 1} of {questions.length}
        </span>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4">
          {questions[currentQuestionIndex].question}
        </h3>
        
        <div className="space-y-3">
          {questions[currentQuestionIndex].options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionSelect(index)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedOptions[currentQuestionIndex] === index
                  ? 'bg-blue-100 border-blue-400'
                  : 'hover:bg-gray-50 border-gray-200'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="flex items-center px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50"
        >
          <ChevronLeft className="mr-1" size={18} />
          Previous
        </button>

        {currentQuestionIndex < questions.length - 1 ? (
          <button
            onClick={handleNext}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Next
            <ChevronRight className="ml-1" size={18} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            <CheckCircle className="mr-1" size={18} />
            Finish Quiz
          </button>
        )}
      </div>
    </div>
  );
}