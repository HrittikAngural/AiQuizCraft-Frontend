import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { BookOpen, LayoutDashboard, LogIn } from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
      <div className="max-w-2xl text-center mb-12">
        <h1 className="text-5xl font-bold mb-6 text-blue-800">Welcome to AI Quiz Craft</h1>
        <p className="text-xl text-gray-600 mb-4">
          Create, customize and share AI-powered quizzes with ease
        </p>
        <p className="text-lg text-gray-500">
          Our platform helps educators and learners build engaging quizzes
          with intelligent question generation and performance analytics
        </p>
      </div>
      {user ? (
        <div className="flex gap-4">
          <button 
            onClick={() => navigate('/take-quiz')}
            className="flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-2xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg"
          >
            <BookOpen size={24} />
            Take Quiz
          </button>
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-2xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg"
          >
            <LayoutDashboard size={24} />
            Go to Dashboard
          </button>
        </div>
      ) : (
        <button 
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-2xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg"
        >
          <LogIn size={24} />
          Get Started Now
        </button>
      )}
    </div>
  );
};

export default HomePage;