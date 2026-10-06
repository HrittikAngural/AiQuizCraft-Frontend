import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
            <h3>AIQuizCraft</h3>
            <p>
              © {new Date().getFullYear()} All rights reserved
            </p>
        </div>

        <nav className="site-footer-links" aria-label="Footer navigation">
            <Link 
              to="/" 
              className="site-footer-link"
            >
              Home
            </Link>
            <Link 
              to="/dashboard" 
              className="site-footer-link"
            >
              Dashboard
            </Link>
            <Link 
              to="/take-quiz" 
              className="site-footer-link"
            >
              Take Quiz
            </Link>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;