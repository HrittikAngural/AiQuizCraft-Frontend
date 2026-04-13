// RewardsPage.jsx
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { Trophy } from 'lucide-react';

const RewardsPage = () => {
  const { user } = useContext(AuthContext);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/results/rewards', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRewards(response.data);
      } catch (err) {
        console.error('Error fetching rewards:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRewards();
  }, []);

  const getRewardColor = (reward) => {
    switch(reward) {
      case 'gold': return 'text-yellow-400';
      case 'silver': return 'text-gray-300'; 
      case 'bronze': return 'text-amber-600';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Rewards</h1>
      
      {loading ? (
        <p>Loading...</p>
      ) : rewards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((item, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center">
              <Trophy className={`w-12 h-12 mb-4 ${getRewardColor(item.reward)}`} />
              <h3 className="text-xl font-semibold capitalize">{item.reward} Reward</h3>
              <p className="text-gray-600 mt-2">Topic : {item.topic}</p>
              <p className="text-sm text-gray-500 mt-2">
                Earned on: {new Date(item.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No rewards earned yet</p>
          <p className="text-gray-400 mt-2">Complete quizzes to earn rewards!</p>
        </div>
      )}
    </div>
  );
};

export default RewardsPage;