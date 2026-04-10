import React, { useState, useContext } from 'react';
import { FiUser, FiMail, FiPhone } from 'react-icons/fi';
import AuthContext from '../context/AuthContext';
import './Profile.css';

const ProfilePage = () => {
  const { user, isDarkMode, toggleDarkMode } = useContext(AuthContext);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    // TODO: Make API call to update profile
    setEditing(false);
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <p>Manage your account information</p>
      </div>

      <div className="profile-wrapper">
        <div className="profile-card">
          <div className="profile-avatar">
            <div className="avatar-placeholder">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>

          <div className="profile-info">
            <div className="info-group">
              <label>Full Name</label>
              <input 
                type="text" 
                name="name" 
                value={formData.name}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>

            <div className="info-group">
              <label>Email Address</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>

            <div className="info-group">
              <label>Role</label>
              <input 
                type="text" 
                value={user?.role}
                disabled
              />
            </div>

            <div className="info-group">
              <label>Dark Mode</label>
              <button 
                className="toggle-btn"
                onClick={toggleDarkMode}
              >
                {isDarkMode ? '🌙 Enabled' : '☀️ Disabled'}
              </button>
            </div>

            {editing ? (
              <div className="profile-actions">
                <button className="btn btn-save" onClick={handleSave}>Save Changes</button>
                <button className="btn btn-cancel" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            ) : (
              <button className="btn btn-edit-profile" onClick={() => setEditing(true)}>Edit Profile</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
