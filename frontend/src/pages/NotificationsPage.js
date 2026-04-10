import React from 'react';
import NotificationsPanel from '../components/NotificationsPanel';
import './Dashboard.css';

const NotificationsPage = () => {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Notifications</h1>
        <p>Latest updates on your feedback</p>
      </div>

      <NotificationsPanel limit={50} />
    </div>
  );
};

export default NotificationsPage;

