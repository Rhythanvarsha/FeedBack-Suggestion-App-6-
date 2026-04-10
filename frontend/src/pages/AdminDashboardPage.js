// import React, { useState, useEffect, useContext } from 'react';
// import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// import { FiUsers, FiMessageSquare, FiClock, FiCheckCircle } from 'react-icons/fi';
// import { adminService } from '../services/api';
// import AuthContext from '../context/AuthContext';
// import './Dashboard.css';

// const AdminDashboardPage = () => {
//   const { user } = useContext(AuthContext);
//   const [stats, setStats] = useState(null);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     loadDashboardStats();
//     const interval = setInterval(loadDashboardStats, 30000); // Refresh every 30 seconds
//     return () => clearInterval(interval);
//   }, []);

//   const loadDashboardStats = async () => {
//     setLoading(true);
//     try {
//       const response = await adminService.getDashboardStats();
//       setStats(response.data);
//     } catch (err) {
//       console.error('Failed to load dashboard stats', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!stats) {
//     return (
//       <div className="loading-container">
//         <div className="loading">Loading...</div>
//       </div>
//     );
//   }

//   const chartData = [
//     { name: 'Pending', value: stats.pendingFeedback },
//     { name: 'Reviewed', value: stats.reviewedFeedback },
//     { name: 'Resolved', value: stats.resolvedFeedback }
//   ];

//   const colors = ['#ffa751', '#667eea', '#00c896'];

//   return (
//     <div className="dashboard-container">
//       <div className="dashboard-header">
//         <h1>Admin Dashboard</h1>
//         <p>System Overview and Statistics</p>
//       </div>

//       <div className="stats-grid">
//         <div className="stat-card">
//           <div className="stat-icon" style={{ background: '#667eea' }}>
//             <FiUsers />
//           </div>
//           <div className="stat-content">
//             <h3>Total Users</h3>
//             <p className="stat-number">{stats.totalUsers}</p>
//           </div>
//         </div>

//         <div className="stat-card">
//           <div className="stat-icon" style={{ background: '#764ba2' }}>
//             <FiMessageSquare />
//           </div>
//           <div className="stat-content">
//             <h3>Total Feedback</h3>
//             <p className="stat-number">{stats.totalFeedback}</p>
//           </div>
//         </div>

//         <div className="stat-card">
//           <div className="stat-icon" style={{ background: '#ffa751' }}>
//             <FiClock />
//           </div>
//           <div className="stat-content">
//             <h3>Pending Feedback</h3>
//             <p className="stat-number">{stats.pendingFeedback}</p>
//           </div>
//         </div>

//         <div className="stat-card">
//           <div className="stat-icon" style={{ background: '#00c896' }}>
//             <FiCheckCircle />
//           </div>
//           <div className="stat-content">
//             <h3>Resolved Feedback</h3>
//             <p className="stat-number">{stats.resolvedFeedback}</p>
//           </div>
//         </div>
//       </div>

//       <div className="charts-grid">
//         <div className="chart-card">
//           <h3>Feedback Status Distribution</h3>
//           <ResponsiveContainer width="100%" height={300}>
//             <PieChart>
//               <Pie
//                 data={chartData}
//                 cx="50%"
//                 cy="50%"
//                 labelLine={false}
//                 label={({ name, value }) => `${name}: ${value}`}
//                 outerRadius={80}
//                 fill="#8884d8"
//                 dataKey="value"
//               >
//                 {colors.map((color, index) => (
//                   <Cell key={`cell-${index}`} fill={color} />
//                 ))}
//               </Pie>
//               <Tooltip />
//             </PieChart>
//           </ResponsiveContainer>
//         </div>

//         <div className="chart-card">
//           <h3>Feedback Status Overview</h3>
//           <ResponsiveContainer width="100%" height={300}>
//             <BarChart data={chartData}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="name" />
//               <YAxis />
//               <Tooltip />
//               <Legend />
//               <Bar dataKey="value" fill="#667eea" name="Count" />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>
//       </div>

//       <div className="dashboard-footer">
//         <p>Statistics updated in real-time</p>
//         <button onClick={loadDashboardStats} className="btn-refresh">🔄 Refresh</button>
//       </div>
//     </div>
//   );
// };

// export default AdminDashboardPage;
import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

import {
  FiUsers,
  FiMessageSquare,
  FiClock,
  FiCheckCircle
} from "react-icons/fi";

import { adminService } from "../services/api";
import "./Dashboard.css";

const AdminDashboardPage = () => {

  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {

    try {

      const response = await adminService.getDashboardStats();

      setStats(response.data);

    } catch (error) {

      console.error("Failed to load dashboard stats", error);

    }

  };

  if (!stats) {
    return (
      <div className="loading-container">
        <div className="loading">Loading Dashboard...</div>
      </div>
    );
  }

  const chartData = [
    { name: "Pending", value: stats.pendingFeedback },
    { name: "Reviewed", value: stats.reviewedFeedback },
    { name: "Resolved", value: stats.resolvedFeedback }
  ];

  const COLORS = ["#ffa751", "#667eea", "#00c896"];
  const total = chartData.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  const renderDonutCenter = () => (
    <>
      <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" className="pie-center-label">
        Total
      </text>
      <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" className="pie-center-value">
        {total}
      </text>
    </>
  );

  return (
    <div className="dashboard-container">

      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Feedback Statistics Overview</p>
      </div>

      {/* ===== STAT CARDS ===== */}

      <div className="stats-grid">

        <div className="stat-card">

          <div className="stat-icon" style={{ background: "#667eea" }}>
            <FiUsers size={24} />
          </div>

          <div className="stat-content">
            <h3>Total Users</h3>
            <p className="stat-number">{stats.totalUsers}</p>
          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon" style={{ background: "#764ba2" }}>
            <FiMessageSquare size={24} />
          </div>

          <div className="stat-content">
            <h3>Total Feedback</h3>
            <p className="stat-number">{stats.totalFeedback}</p>
          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon" style={{ background: "#ffa751" }}>
            <FiClock size={24} />
          </div>

          <div className="stat-content">
            <h3>Pending Feedback</h3>
            <p className="stat-number">{stats.pendingFeedback}</p>
          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon" style={{ background: "#00c896" }}>
            <FiCheckCircle size={24} />
          </div>

          <div className="stat-content">
            <h3>Resolved Feedback</h3>
            <p className="stat-number">{stats.resolvedFeedback}</p>
          </div>

        </div>

      </div>


      {/* ===== CHARTS ===== */}

      <div className="charts-grid">

        {/* PIE CHART */}

        <div className="chart-card">

          <h3>Feedback Distribution</h3>

          <div className="pie-layout">
            <div className="pie-chart-wrap">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={92}
                    paddingAngle={3}
                    dataKey="value"
                    isAnimationActive={true}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  {renderDonutCenter()}
                  <Tooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="pie-legend" aria-label="Feedback distribution legend">
              {chartData.map((item, index) => (
                <div className="pie-legend-row" key={item.name}>
                  <span className="pie-swatch" style={{ background: COLORS[index] }} />
                  <span className="pie-legend-name">{item.name}</span>
                  <span className="pie-legend-value">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>


        {/* BAR CHART */}

        <div className="chart-card">

          <h3>Status Overview</h3>

          <ResponsiveContainer width="100%" height={300}>

            <BarChart data={chartData}>

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="name" />

              <YAxis />

              <Tooltip />

              <Legend />

              <Bar dataKey="value" fill="#667eea" name="Feedback Count" />

            </BarChart>

          </ResponsiveContainer>

        </div>

      </div>

    </div>
  );
};

export default AdminDashboardPage;
