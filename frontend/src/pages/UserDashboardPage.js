import React, { useState, useEffect, useContext } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FiUsers, FiMessageSquare, FiClock, FiCheckCircle } from 'react-icons/fi';
import { feedbackService } from '../services/api';
import AuthContext from '../context/AuthContext';
import './Dashboard.css';

const UserDashboardPage = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    setLoading(true);
    try {
      const response = await feedbackService.getUserDashboardStats();
      setStats(response.data);
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  if (!stats) {
    return <div className="loading">Loading...</div>;
  }

  const chartData = [
    { name: 'Pending', value: stats.myPendingFeedback },
    { name: 'Reviewed', value: stats.myReviewedFeedback },
    { name: 'Resolved', value: stats.myResolvedFeedback }
  ];

  const colors = ['#ffa751', '#667eea', '#00c896'];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user?.name}!</h1>
        <p>Your feedback analytics and statistics</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#667eea' }}>
            <FiMessageSquare />
          </div>
          <div className="stat-content">
            <h3>My Total Feedback</h3>
            <p className="stat-number">{stats.myTotalFeedback}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#764ba2' }}>
            <FiClock />
          </div>
          <div className="stat-content">
            <h3>Pending</h3>
            <p className="stat-number">{stats.myPendingFeedback}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ffa751' }}>
            <FiCheckCircle />
          </div>
          <div className="stat-content">
            <h3>Reviewed</h3>
            <p className="stat-number">{stats.myReviewedFeedback}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#00c896' }}>
            <FiCheckCircle />
          </div>
          <div className="stat-content">
            <h3>Resolved</h3>
            <p className="stat-number">{stats.myResolvedFeedback}</p>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Feedback Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" labelLine={false} label outerRadius={80} fill="#8884d8" dataKey="value">
                {colors.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Feedback Status Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#667eea" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default UserDashboardPage;
