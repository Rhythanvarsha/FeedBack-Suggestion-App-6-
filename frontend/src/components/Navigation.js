import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiLogOut, FiMenu, FiX, FiSun, FiMoon, FiUser, FiBell } from 'react-icons/fi';
import AuthContext from '../context/AuthContext';
import { healthService, notificationService } from '../services/api';
import './Navigation.css';

const Navigation = ({ isOpen, setIsOpen }) => {
  const { user, logout, isDarkMode, toggleDarkMode } = useContext(AuthContext);
  const navigate = useNavigate();
  const [apiOnline, setApiOnline] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const checkHealth = async () => {
      try {
        await healthService.getHealth();
        if (!cancelled) setApiOnline(true);
      } catch (e) {
        if (!cancelled) setApiOnline(false);
      }
    };

    checkHealth();
    const intervalId = setInterval(checkHealth, 15000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadUnreadCount = async () => {
      try {
        const res = await notificationService.getUnreadCount();
        if (!cancelled) setUnreadCount(res.data?.unreadCount ?? 0);
      } catch (e) {
        if (!cancelled) setUnreadCount(0);
      }
    };

    loadUnreadCount();
    const intervalId = setInterval(loadUnreadCount, 15000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const goToNotifications = () => {
    setIsOpen(false);
    navigate('/notifications');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          💬 FeedbackHub
        </Link>

        <div className={`nav-menu ${isOpen ? 'active' : ''}`}>
          {user?.role === 'ADMIN' ? (
            <>
              <Link to="/admin/dashboard" className="nav-link">Dashboard</Link>
              <Link to="/admin/feedback" className="nav-link">Manage Feedback</Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <Link to="/my-feedback" className="nav-link">My Feedback</Link>
              <Link to="/add-feedback" className="nav-link">Submit Feedback</Link>
            </>
          )}
          
          <div className="nav-actions">
            <div
              className={`api-status ${apiOnline === true ? 'online' : apiOnline === false ? 'offline' : 'unknown'}`}
              title={
                apiOnline === true
                  ? 'Backend: Online'
                  : apiOnline === false
                    ? 'Backend: Offline'
                    : 'Backend: Checking...'
              }
              aria-label={
                apiOnline === true
                  ? 'Backend online'
                  : apiOnline === false
                    ? 'Backend offline'
                    : 'Backend checking'
              }
              role="img"
            />
            <button className="notif-btn" onClick={goToNotifications} title="Notifications">
              <FiBell />
              {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </button>
            <button className="theme-toggle" onClick={toggleDarkMode}>
              {isDarkMode ? <FiSun /> : <FiMoon />}
            </button>
            <Link to="/profile" className="nav-link">
              <FiUser /> {user?.name}
            </Link>
            <button className="btn-logout" onClick={handleLogout}>
              <FiLogOut /> Logout
            </button>
          </div>
        </div>

        <div className="hamburger" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <FiX /> : <FiMenu />}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
