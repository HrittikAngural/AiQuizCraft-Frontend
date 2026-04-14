import React, { useEffect, useState, useCallback, useContext, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Home, Medal, Trophy, Award } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function ResultPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const hasSavedRef = useRef(false);

  if (!state) {
    navigate('/');
    return null;
  }

  const { questions, selectedOptions, topic, totalTime, timeLeft, reward } = state;

  const selectedOptionsArray = Array.isArray(selectedOptions) 
    ? selectedOptions 
    : questions.map((_, index) => selectedOptions?.[index]);

  const correctCount = questions.reduce((acc, question, index) => {
    return acc + (selectedOptionsArray[index] === question.correctAnswer ? 1 : 0);
  }, 0);

  const attemptedCount = selectedOptionsArray.filter(option => option !== undefined).length;

  const saveQuizResult = useCallback(async () => {
    if (hasSavedRef.current) return; // Prevent duplicate saves
    
    try {
      hasSavedRef.current = true; // Mark as saved
      const authToken  = localStorage.getItem('token');
      if (!authToken ) {
        setSaveError('Please login to save results');
        return;
      }
      
      if (isSaving) return; // Prevent multiple submissions
      
      setIsSaving(true);
      setSaveError(null);

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/results/saveresult`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          topic,
          score: correctCount,
          totalQuestions: questions.length,
          attempted: attemptedCount,
          timeTaken: totalTime * 60 - (timeLeft || 0),
          reward
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save result');
      }

      setSaveSuccess(true);
    } catch (error) {
      console.error('Save error:', error);
      setSaveError(error.message);
    } finally {
      setIsSaving(false);
    }
  }, [token, topic, correctCount, questions.length, attemptedCount, totalTime, timeLeft, reward]);

  useEffect(() => {
    if (!hasSavedRef.current) {
      saveQuizResult();
    }
  }, [saveQuizResult]);

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-lg shadow-xl">
      <h1 className="text-3xl font-bold text-center mb-8">Quiz Results</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Topic: {topic}</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-green-100 p-4 rounded-lg">
            <p className="text-green-800 font-medium">Correct Answers: {correctCount}</p>
          </div>
          <div className="bg-blue-100 p-4 rounded-lg">
            <p className="text-blue-800 font-medium">Total Questions: {questions.length}</p>
          </div>
          <div className="bg-yellow-100 p-4 rounded-lg">
            <p className="text-yellow-800 font-medium">Attempted: {attemptedCount}</p>
          </div>
          <div className="bg-purple-100 p-4 rounded-lg">
            <p className="text-purple-800 font-medium">Time Taken: {Math.floor((totalTime * 60 - (timeLeft || 0)) / 60)}m {(totalTime * 60 - (timeLeft || 0)) % 60}s</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {questions.map((question, index) => (
          <div key={index} className={`p-4 rounded-lg ${selectedOptionsArray[index] === question.correctAnswer ? 'bg-green-50' : 'bg-red-50'}`}>
            <p className="font-medium mb-2">{question.question}</p>
            
            {/* Display all options with indicators */}
            <div className="space-y-2 mb-3">
              {question.options.map((option, optIndex) => {
                const isSelected = selectedOptionsArray[index] === optIndex;
                const isCorrect = question.correctAnswer === optIndex;
                
                return (
                  <div 
                    key={optIndex}
                    className={`p-2 rounded flex items-center ${
                      isCorrect ? 'bg-green-100' : 
                      isSelected ? 'bg-red-100' : 'bg-gray-50'
                    }`}
                  >
                    {isCorrect ? (
                      <CheckCircle className="text-green-500 mr-2" size={18} />
                    ) : isSelected ? (
                      <XCircle className="text-red-500 mr-2" size={18} />
                    ) : (
                      <div className="w-5 h-5 mr-2" /> // Spacer for alignment
                    )}
                    <span className={isSelected ? 'font-medium' : ''}>
                      {option}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Summary of user's answer */}
            <div className="flex items-center">
              {selectedOptionsArray[index] === question.correctAnswer ? (
                <CheckCircle className="text-green-500 mr-2" size={18} />
              ) : (
                <XCircle className="text-red-500 mr-2" size={18} />
              )}
              <span>Your answer: {question.options[selectedOptionsArray[index]] || 'Not attempted'}</span>
            </div>
          </div>
        ))}
      </div>

      {reward && (
        <div className="flex items-center gap-2 mt-4">
          {reward === 'gold' && <Medal className="text-yellow-500" size={24} />}
          {reward === 'silver' && <Award className="text-gray-400" size={24} />}
          {reward === 'bronze' && <Trophy className="text-amber-700" size={24} />}
          <span>You earned {reward}!</span>
        </div>
      )}

      {isSaving && <p className="text-center text-gray-600">Saving your results...</p>}
      {saveSuccess && <p className="text-center text-green-600">Results saved successfully!</p>}
      {saveError && <p className="text-center text-red-600">Error: {saveError}</p>}

      <button
        onClick={() => navigate('/')}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
      >
        <Home className="mr-2" size={18} />
        Return to Home
      </button>
    </div>
  );
}