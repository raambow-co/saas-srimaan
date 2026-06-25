import React, { createContext, useContext, useState, useEffect } from 'react';
import API, { BACKEND_URL } from '../utils/api.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('srimaan_token'));
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [companySettings, setCompanySettings] = useState({
    companyName: 'Srimaan Solar',
    logoUrl: ''
  });

  // Load profile & settings on mount if token is active
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          // Fetch user profile
          const profileRes = await API.get('/auth/me');
          setUser(profileRes.data);
          
          // Fetch notifications
          const notifyRes = await API.get('/notifications');
          setNotifications(notifyRes.data);

          // Fetch company branding
          const settingsRes = await API.get('/settings');
          setCompanySettings(settingsRes.data);
        } catch (error) {
          console.error('Auth initialization error:', error);
          logout();
        }
      } else {
        // Even if not logged in, fetch general settings if possible (for login branding)
        try {
          const settingsRes = await API.get('/settings');
          setCompanySettings(settingsRes.data);
        } catch (e) {
          // Ignore settings fail if backend is offline/seeding
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  // Periodic polling for notifications (every 12 seconds)
  useEffect(() => {
    if (!user) return;

    const pollNotifications = async () => {
      try {
        const res = await API.get('/notifications');
        // Simple comparison: update only if count/unread changed to prevent continuous rerenders
        setNotifications(res.data);
      } catch (err) {
        console.error('Error polling notifications:', err);
      }
    };

    const interval = setInterval(pollNotifications, 12000);
    return () => clearInterval(interval);
  }, [user]);

  const login = async (username, password) => {
    try {
      const res = await API.post('/auth/login', { username, password });
      const { token, user: userData } = res.data;
      
      localStorage.setItem('srimaan_token', token);
      localStorage.setItem('srimaan_user', JSON.stringify(userData));
      
      setToken(token);
      setUser(userData);
      
      // Load settings immediately on login
      try {
        const settingsRes = await API.get('/settings');
        setCompanySettings(settingsRes.data);
      } catch (e) {}

      return { success: true };
    } catch (error) {
      console.error('Auth Context Login failed:', error);
      const msg = error.response?.data?.message || 'Login failed. Please check credentials.';
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('srimaan_token');
    localStorage.removeItem('srimaan_user');
    setToken(null);
    setUser(null);
    setNotifications([]);
  };

  const refreshBranding = async () => {
    try {
      const settingsRes = await API.get('/settings');
      setCompanySettings(settingsRes.data);
    } catch (e) {}
  };

  const markNotificationRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => (n._id === id || n.id === id ? { ...n, read: true } : n)));
    } catch (error) {
      console.error('Failed to mark notification read:', error);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await API.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all read:', error);
    }
  };

  const getLogoSrc = () => {
    if (companySettings.logoUrl) {
      return `${BACKEND_URL}/${companySettings.logoUrl.replace(/^\.\//, '')}`;
    }
    return null;
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      notifications,
      companySettings,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'ADMIN',
      login,
      logout,
      refreshBranding,
      markNotificationRead,
      markAllNotificationsRead,
      logoSrc: getLogoSrc()
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
