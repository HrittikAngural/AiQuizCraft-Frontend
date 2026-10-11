import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User, BrainCircuit, ChevronDown, Moon, Sun } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';

const Navbar = ({ theme, onToggleTheme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const desktopUserMenuRef = useRef(null);
  const mobileUserMenuRef = useRef(null);

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    setIsOpen(false);
    logout();
    navigate('/');
  };

  useEffect(() => {
    setIsOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isUserMenuOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (
        !desktopUserMenuRef.current?.contains(event.target) &&
        !mobileUserMenuRef.current?.contains(event.target)
      ) {
        setIsUserMenuOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsUserMenuOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isUserMenuOpen]);

  const renderUserMenuButton = (mobile = false) => (
    <div
      className={`site-navbar-user-menu${isUserMenuOpen ? ' site-navbar-user-menu-open' : ''}${mobile ? ' site-navbar-user-menu-mobile' : ''}`}
      ref={mobile ? mobileUserMenuRef : desktopUserMenuRef}
    >
      <button
        type="button"
        className={`site-navbar-user site-navbar-user-trigger${mobile ? ' site-navbar-mobile-link' : ''}`}
        onClick={() => setIsUserMenuOpen((open) => !open)}
        aria-expanded={isUserMenuOpen}
        aria-haspopup="true"
        aria-label={`Account menu for ${user?.name || 'your account'}`}
      >
        <User size={16} aria-hidden="true" />
        <span>{user?.name}</span>
        <ChevronDown
          size={14}
          className={isUserMenuOpen ? 'site-navbar-user-chevron-open' : ''}
          aria-hidden="true"
        />
      </button>
      {isUserMenuOpen && (
        <div className="site-navbar-user-dropdown">
          <button
            type="button"
            className="site-navbar-user-logout"
            onClick={handleLogout}
          >
            <LogOut size={15} aria-hidden="true" />
            Logout
          </button>
        </div>
      )}
    </div>
  );

  const renderThemeButton = (mobile = false) => {
    const isDark = theme === 'dark';
    const ThemeIcon = isDark ? Sun : Moon;

    return (
      <button
        type="button"
        className={`site-navbar-theme-toggle${mobile ? ' site-navbar-theme-toggle-mobile' : ''}`}
        onClick={onToggleTheme}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        <ThemeIcon size={17} aria-hidden="true" />
      </button>
    );
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
                  {renderUserMenuButton()}
                  {renderThemeButton()}
                </>
              ) : (
                <>
                  {renderThemeButton()}
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
                <div className="site-navbar-mobile-account">
                  {renderUserMenuButton(true)}
                  {renderThemeButton(true)}
                </div>
              </>
            ) : (
              <>
                {renderThemeButton(true)}
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