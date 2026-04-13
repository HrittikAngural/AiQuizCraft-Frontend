import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { BentoGrid, BentoItem } from '../components/ui/BentoGrid';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Award, History, User, Mail, Calendar, Info } from 'lucide-react';

const DashboardPage = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [hotTopics, setHotTopics] = useState([]);
  const [quizHistory, setQuizHistory] = useState([]);
  const navigate = useNavigate(); 
  
  const handlePerformanceClick = () => {
    navigate('/performance-analysis');
  };

  const handleRewardsClick = () => {
    navigate('/rewards');
  };

  const handleHistoryClick = () => {
    navigate('/history');
  };

  useEffect(() => {
    
    if (authLoading) {
      return;
    }
    
    const fetchQuizHistory = async () => {
      try {
        
        const token = localStorage.getItem('token');
       
        
        if (!token || !user?.id) {
          setQuizHistory([]);
          return;
        }
        
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };
        
        console.log('Making API request...');
        const response = await axios.get('http://localhost:5000/api/results/getresults', config);
        console.log('API response:', response.data);
        
        setQuizHistory(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Error fetching quiz history:', err);
        setQuizHistory([]);
      }
    };
    
    fetchQuizHistory();
  }, [user, authLoading]);

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Your Dashboard</h1>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
        <button 
          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-black text-white rounded-md font-medium hover:bg-gray-900 transition-all duration-200 hover:scale-105 sm:hover:scale-110 text-sm sm:text-base"
          onClick={() => navigate('/take-quiz')}
        >
          Take Quiz
        </button>
        <div className="relative group self-center sm:self-auto">
          <Info className="w-5 h-5 text-gray-500 cursor-help" />
          <div className="absolute hidden group-hover:block w-56 sm:w-64 p-2 sm:p-3 bg-white border border-gray-200 rounded-md shadow-lg text-xs sm:text-sm text-gray-600 z-10 left-0 sm:left-full -bottom-2 sm:bottom-auto transform translate-y-full sm:translate-y-0 ml-0 sm:ml-2">
            <h3 className="font-bold mb-1">How to take a quiz:</h3>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Click the Take Quiz button</li>
              <li>Enter topic you want to take quiz on</li>
              <li>Select time and number of questions</li>
              <li>Click on start quiz</li>
              <li>Answer all questions</li>
              <li>Submit to see your results</li>
            </ol>
          </div>
        </div>
      </div>
      
      <BentoGrid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <BentoItem colSpan={1} rowSpan={1} className="bg-teal-50 group hover:bg-teal-100 transition-colors">
          <div className="flex flex-col items-center h-full p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-center mb-4 sm:mb-5">
              <User className="w-8 sm:w-10 h-8 sm:h-10 text-teal-600 mr-0 sm:mr-3 mb-2 sm:mb-0" />
              <h2 className="text-lg sm:text-xl font-bold text-center sm:text-left">{user?.name}</h2>
            </div>
            <div className="w-full mt-4 sm:mt-5">
              <div className="flex items-center text-xs sm:text-sm text-gray-600">
                <Mail className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2 text-teal-500" />
                <span className="truncate">{user?.email}</span>
              </div>
            </div>
          </div>
        </BentoItem>

        <BentoItem 
          colSpan={2} 
          rowSpan={1} 
          className="bg-purple-50 group hover:bg-purple-100 transition-colors rounded-lg cursor-pointer"
        >
          <div className="flex flex-col items-center justify-center h-full p-4">
            <LineChart className="w-8 h-8 text-purple-600 group-hover:text-purple-800 mb-2" />
            <h2 className="text-xl font-bold text-center">Performance</h2>
            <p className="text-sm text-purple-700 opacity-0 group-hover:opacity-100 transition-opacity" 
            onClick={handlePerformanceClick}>
              View Analysis</p>
          </div>
        </BentoItem>

        <BentoItem colSpan={2} rowSpan={2} className="bg-green-50 rounded-lg shadow-sm">
          <div className="p-4 h-full flex flex-col">
            <h2 className="text-xl font-bold mb-4 text-green-800">Recent Searched Quiz Topics</h2>
            {quizHistory.length > 0 ? (
              <ul className="space-y-3 flex-1 overflow-y-auto pr-2">
                {quizHistory.map((result, index) => (
                  <li key={index} className="flex justify-between items-center bg-white p-3 rounded-md shadow-xs hover:bg-green-100 transition-colors">
                    <span className="font-medium text-gray-800 truncate max-w-[160px]">{result.topic}</span>
                    <span className="text-sm text-gray-500 whitespace-nowrap">
                      {new Date(result.createdAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No quiz history yet</p>
            )}
          </div>
        </BentoItem>

        <BentoItem 
          colSpan={1} 
          rowSpan={1} 
          className="bg-yellow-50 rounded-lg shadow-sm group hover:bg-yellow-100 transition-colors cursor-pointer">
          <div className="flex flex-col items-center justify-center h-full p-4">
            <Award className="w-8 h-8 text-yellow-600 group-hover:text-yellow-800 mb-2" />
            <h2 className="text-xl font-bold text-center">Rewards</h2>
            <p className="text-sm text-yellow-700 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRewardsClick}>
              View Rewards
            </p>
          </div>
        </BentoItem>

        <BentoItem 
          colSpan={1} 
          rowSpan={1} 
          className="bg-blue-50 rounded-lg shadow-sm group hover:bg-blue-100 transition-colors cursor-pointer"
        >
          <div className="flex flex-col items-center justify-center h-full p-4">
            <History className="w-8 h-8 text-blue-600 group-hover:text-blue-800 mb-2" />
            <h2 className="text-xl font-bold text-center">History</h2>
            <p className="text-sm text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleHistoryClick}>
              View History
            </p>
          </div>
        </BentoItem>
        
      </BentoGrid>
    </div>
  );
};

export default DashboardPage;