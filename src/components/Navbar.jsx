import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, BrainCircuit, ChevronDown, Moon, Sun, Trophy } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import './Navbar.css';

const getInitials = (name) => String(name || 'User')
  .trim()
  .split(/\s+/)
  .slice(0, 2)
  .map((part) => part[0]?.toUpperCase())
  .join('');

function UserAvatar({ user, large = false }) {
  const [imageFailed, setImageFailed] = useState(false);
  const photoUrl = typeof user?.photoUrl === 'string' && /^https:\/\//i.test(user.photoUrl)
    ? user.photoUrl
    : '';

  useEffect(() => {
    setImageFailed(false);
  }, [photoUrl]);

  const imageSource = photoUrl &&
    !imageFailed
    ? photoUrl
    : '';

  return (
    <span className={`site-navbar-avatar${large ? ' site-navbar-avatar-large' : ''}`} aria-hidden="true">
      {imageSource ? (
        <img
          src={imageSource}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span>{getInitials(user?.name)}</span>
      )}
    </span>
  );
}

const Navbar = ({ theme, onToggleTheme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const desktopUserMenuRef = useRef(null);
  const mobileUserMenuRef = useRef(null);
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setPosition(null);
      return undefined;
    }

    let active = true;
    const fetchPosition = () => {
      api.get('/api/results/leaderboard?period=all')
        .then(({ data }) => {
          if (active) {
            const rank = Number(data.currentUser?.rank);
            setPosition(Number.isInteger(rank) && rank > 0 ? rank : null);
          }
        })
        .catch((error) => {
          if (active) {
            setPosition(null);
            console.error('Could not load the leaderboard position for the navigation bar:', error);
          }
        });
    };
    fetchPosition();
    window.addEventListener('quiz-result-saved', fetchPosition);

    return () => {
      active = false;
      window.removeEventListener('quiz-result-saved', fetchPosition);
    };
  }, [isAuthenticated, user?.id, user?._id]);

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
    if (!isOpen) return undefined;

    let previousScrollY = window.scrollY;
    const closeOnScrollDown = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY - previousScrollY > 8) {
        setIsOpen(false);
        setIsUserMenuOpen(false);
      }
      previousScrollY = currentScrollY;
    };

    window.addEventListener('scroll', closeOnScrollDown, { passive: true });
    return () => window.removeEventListener('scroll', closeOnScrollDown);
  }, [isOpen]);

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
        <UserAvatar user={user} />
        <span className="site-navbar-user-copy">
          <strong>{user?.name}</strong>
        </span>
        <ChevronDown
          size={14}
          className={isUserMenuOpen ? 'site-navbar-user-chevron-open' : ''}
          aria-hidden="true"
        />
      </button>
      {isUserMenuOpen && (
        <div className="site-navbar-user-dropdown">
          <div className="site-navbar-user-profile">
            <UserAvatar user={user} large />
            <span>
              <strong>{user?.name}</strong>
            </span>
          </div>
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

  const renderPositionLink = (mobile = false) => (
    <Link
      to="/leaderboard"
      className={`site-navbar-position-link${mobile ? ' site-navbar-position-link-mobile' : ''}${location.pathname === '/leaderboard' ? ' site-navbar-position-link-active' : ''}`}
      aria-label={position ? `Your all-time leaderboard position is ${position}` : 'View the leaderboard; you are not ranked yet'}
      title={position ? `All-time position: #${position}` : 'Not ranked yet'}
      onClick={mobile ? () => setIsOpen(false) : undefined}
    >
      <Trophy size={22} aria-hidden="true" />
      <span aria-hidden="true">{position ?? '—'}</span>
    </Link>
  );

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
          <div className="hidden lg:block">
            <div className="site-navbar-links ml-10 flex items-baseline space-x-2">
              <Link
                to="/"
                className={`site-navbar-link px-3 py-2 rounded-md text-sm font-medium${location.pathname === '/' ? ' site-navbar-link-active' : ''}`}
              >
                Home
              </Link>
              <Link
                to="/subjects"
                className={`site-navbar-link px-3 py-2 rounded-md text-sm font-medium${location.pathname.startsWith('/subjects') ? ' site-navbar-link-active' : ''}`}
              >
                Subjects
              </Link>
              <Link
                to="/take-quiz"
                className={`site-navbar-link px-3 py-2 rounded-md text-sm font-medium${location.pathname === '/take-quiz' ? ' site-navbar-link-active' : ''}`}
              >
                Quiz
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="site-navbar-link px-3 py-2 rounded-md text-sm font-medium"
                  >
                    My Progress
                  </Link>
                  {renderPositionLink()}
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
                </>
              )}
            </div>
          </div>
          <div className="lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="site-navbar-menu-button inline-flex items-center justify-center p-2 rounded-md focus:outline-none"
              aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isOpen}
              aria-controls="mobile-navigation"
            >
              <span className={`site-navbar-menu-icon${isOpen ? ' site-navbar-menu-icon-hidden' : ''}`}>
                <Menu size={24} aria-hidden="true" />
              </span>
              <span className={`site-navbar-menu-icon site-navbar-close-icon${isOpen ? ' site-navbar-menu-icon-visible' : ''}`}>
                <X size={24} aria-hidden="true" />
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        id="mobile-navigation"
        className="site-navbar-mobile lg:hidden"
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
          <div className="site-navbar-mobile-links px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              className="site-navbar-mobile-link block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/subjects"
              className="site-navbar-mobile-link block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsOpen(false)}
            >
              Subjects
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
                  My Progress
                </Link>
                {renderPositionLink(true)}
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
              </>
            )}
          </div>
      </div>
    </nav>
  );
};

export default Navbar;