import React, { useEffect, useRef, useState } from 'react';
import { Chart } from 'chart.js/auto';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PerformanceAnalysisPage = () => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light');
  const navigate = useNavigate();

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.dataset.theme || 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/results/performance`, {
          headers: { Authorization: `Bearer ${token}` }
        });
         if (chartRef.current) {
          renderChart(response.data);
        }
      } catch (error) {
        console.error('Error fetching results:', error);
      } finally {
        setLoading(false);
      }
    };

    const renderChart = (analytics) => {
      if (!chartRef.current) {
        console.error('Chart canvas not found');
        return;
      }

      // Get topics sorted by most recent attempt
      const topics = Object.entries(analytics.byTopic)
        .map(([topic, data]) => ({ topic, ...data }))
        .sort((a, b) => new Date(b.latestAttempt) - new Date(a.latestAttempt))
        .slice(0, 10);
      
      const labels = topics.map(t => t.topic);
      const data = topics.map(t => t.accuracy);

      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      const chartTextColor = theme === 'dark' ? '#d5dde5' : '#4b5563';
      const chartGridColor = theme === 'dark' ? '#35414c' : '#e5e7eb';
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Average Score',
            data,
            backgroundColor: 'rgba(124, 58, 237, 0.7)',
            borderColor: 'rgba(124, 58, 237, 1)',
            borderWidth: 1
          }]
        },
        options: {
          plugins: {
            title: {
              display: true,
              text: 'Performance Analysis',
              color: chartTextColor,
              font: {
                size: 24,
                weight: 'bold'
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: { color: chartTextColor },
              grid: { color: chartGridColor },
              title: {
                display: true,
                text: 'Accuracy (%)',
                color: chartTextColor,
              }
            },
            x: {
              ticks: { color: chartTextColor },
              grid: { color: chartGridColor },
              title: {
                display: true,
                text: 'Topics',
                color: chartTextColor,
              }
            }
          }
        }
      });
    };

    fetchData();

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [navigate, theme]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Performance Analysis</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <canvas ref={chartRef} />
      </div>
    </div>
  );
};

export default PerformanceAnalysisPage;