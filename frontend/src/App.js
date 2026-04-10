import React, { useState, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthContext from './context/AuthContext';
import Navigation from './components/Navigation';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserDashboardPage from './pages/UserDashboardPage';
import AddFeedbackPage from './pages/AddFeedbackPage';
import MyFeedbackPage from './pages/MyFeedbackPage';
import AdminFeedbackPage from './pages/AdminFeedbackPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import NotificationsPage from './pages/NotificationsPage';

import './styles/Global.css';

function App() {
  const { isAuthenticated, user, isDarkMode } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  const ProtectedRoute = ({ children, requiredRole }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    if (requiredRole && user?.role !== requiredRole) {
      return <Navigate to="/dashboard" />;
    }
    return children;
  };

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {isAuthenticated && <Navigation isOpen={isOpen} setIsOpen={setIsOpen} />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <UserDashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/my-feedback" element={
          <ProtectedRoute>
            <MyFeedbackPage />
          </ProtectedRoute>
        } />
        <Route path="/add-feedback" element={
          <ProtectedRoute>
            <AddFeedbackPage />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />

        <Route path="/notifications" element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        } />

        <Route path="/admin/dashboard" element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminDashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/feedback" element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminFeedbackPage />
          </ProtectedRoute>
        } />

        <Route path="/" element={isAuthenticated ? 
          <Navigate to={user?.role === 'ADMIN' ? "/admin/dashboard" : "/dashboard"} /> 
          : 
          <Navigate to="/login" />
        } />
      </Routes>
    </Router>
  );
}

export default App;
