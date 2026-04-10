import React, { createContext, useState, useCallback } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('darkMode') === 'true');

  const login = useCallback((userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      localStorage.setItem('darkMode', !prev);
      return !prev;
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      setLoading,
      login,
      logout,
      isDarkMode,
      toggleDarkMode,
      isAuthenticated: !!token
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
