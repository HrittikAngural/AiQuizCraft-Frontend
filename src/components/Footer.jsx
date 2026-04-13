import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Logo and copyright */}
          <div className="mb-4 md:mb-0">
            <h3 className="text-lg font-semibold">AIQuizCraft</h3>
            <p className="text-gray-300 text-sm">
              © {new Date().getFullYear()} All rights reserved
            </p>
          </div>

          {/* Quick links */}
          <div className="flex space-x-6">
            <Link 
              to="/" 
              className="text-gray-300 hover:text-white transition-colors text-sm"
            >
              Home
            </Link>
            <Link 
              to="/dashboard" 
              className="text-gray-300 hover:text-white transition-colors text-sm"
            >
              Dashboard
            </Link>
            <Link 
              to="/take-quiz" 
              className="text-gray-300 hover:text-white transition-colors text-sm"
            >
              Take Quiz
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;