import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User, BrainCircuit } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={`site-navbar${isOpen ? ' site-navbar-open' : ''}`} aria-label="Main navigation">
      <div className="site-navbar-inner max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="site-navbar-bar flex items-center justify-between h-16">
          <div className="flex items-center min-w-0">
            <Link to="/" className="site-navbar-brand flex-shrink-0 flex items-center space-x-2">
              <span className="site-navbar-brand-icon"><BrainCircuit className="w-5 h-5" /></span>
              <span className="site-navbar-brand-name font-bold text-xl">AIQuizCraft</span>
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="site-navbar-links ml-10 flex items-baseline space-x-2">
              <Link
                to="/"
                className="site-navbar-link px-3 py-2 rounded-md text-sm font-medium"
              >
                Home
              </Link>
              <Link
                to="/take-quiz"
                className="site-navbar-link px-3 py-2 rounded-md text-sm font-medium"
              >
                Quiz
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="site-navbar-link px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <div className="site-navbar-user flex items-center px-3 py-2 text-sm font-medium">
                    <User size={16} className="mr-2" />
                    {user?.name}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="site-navbar-action site-navbar-logout flex items-center px-3 py-2 rounded-md text-sm font-medium"
                  >
                    <LogOut size={16} className="mr-1" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="site-navbar-link px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="site-navbar-action px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="site-navbar-menu-button inline-flex items-center justify-center p-2 rounded-md focus:outline-none"
              aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isOpen}
              aria-controls="mobile-navigation"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div id="mobile-navigation" className="site-navbar-mobile md:hidden">
          <div className="site-navbar-mobile-links px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              className="site-navbar-mobile-link block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/take-quiz"
              className="site-navbar-mobile-link block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsOpen(false)}
            >
              Quiz
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="site-navbar-mobile-link block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
                <div className="site-navbar-user flex items-center px-3 py-2 text-base font-medium">
                  <User size={16} className="mr-2" />
                  {user?.name}
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="site-navbar-mobile-action site-navbar-logout flex w-full items-center px-3 py-2 rounded-md text-base font-medium"
                >
                  <LogOut size={16} className="mr-1" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="site-navbar-mobile-link block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="site-navbar-mobile-action block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;