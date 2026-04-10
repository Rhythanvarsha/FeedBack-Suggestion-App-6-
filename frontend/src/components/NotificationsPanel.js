import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiCheck, FiRefreshCw } from 'react-icons/fi';
import AuthContext from '../context/AuthContext';
import { notificationService } from '../services/api';
import './NotificationsPanel.css';

const NotificationsPanel = ({ limit = 10 }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        notificationService.getMyNotifications(limit),
        notificationService.getUnreadCount(),
      ]);
      setNotifications(listRes.data || []);
      setUnreadCount(countRes.data?.unreadCount ?? 0);
    } catch (e) {
      console.error('Failed to load notifications', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const intervalId = setInterval(refresh, 15000);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markRead(id);
      refresh();
    } catch (e) {
      console.error('Failed to mark notification read', e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      refresh();
    } catch (e) {
      console.error('Failed to mark all notifications read', e);
    }
  };

  const defaultTarget = user?.role === 'ADMIN' ? '/admin/feedback' : '/my-feedback';
  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);

  const renderList = (items, emptyText) => {
    if (items.length === 0) {
      return <div className="notifications-empty">{emptyText}</div>;
    }

    return (
      <div className="notifications-list">
        {items.map((n) => (
          <div
            key={n.id}
            className={`notification-item ${n.read ? 'read' : 'unread'}`}
            onClick={() => navigate(defaultTarget)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') navigate(defaultTarget);
            }}
          >
            <div className="notification-message">{n.message}</div>
            <div className="notification-meta">
              <span className="notification-time">
                {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
              </span>
              {!n.read && (
                <button
                  className="mark-read-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkRead(n.id);
                  }}
                >
                  Mark read
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="notifications-card">
      <div className="notifications-header">
        <div className="notifications-title">
          <FiBell />
          <h3>Notifications</h3>
          <span className={`notifications-badge ${unreadCount > 0 ? 'has-unread' : ''}`}>
            {unreadCount}
          </span>
        </div>
        <div className="notifications-actions">
          <button className="icon-btn" onClick={refresh} title="Refresh">
            <FiRefreshCw />
          </button>
          <button className="icon-btn" onClick={handleMarkAllRead} title="Mark all read" disabled={unreadCount === 0}>
            <FiCheck />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="notifications-empty">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="notifications-empty">No notifications yet</div>
      ) : (
        <div className="notifications-sections">
          <div className="notifications-section">
            <div className="notifications-section-header">
              <div className="notifications-section-title">Unread</div>
              <div className="notifications-section-count">{unread.length}</div>
            </div>
            {renderList(unread, 'No unread notifications')}
          </div>

          <div className="notifications-section">
            <div className="notifications-section-header">
              <div className="notifications-section-title">Read</div>
              <div className="notifications-section-count">{read.length}</div>
            </div>
            {renderList(read, 'No read notifications')}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPanel;
