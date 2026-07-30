import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../config/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Silent refresh handler to get a new access token using refresh_token
  const refreshSession = useCallback(async () => {
    const existingAccessToken = sessionStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');

    // 1. If we have an existing access token, try to load profile first
    if (existingAccessToken) {
      try {
        const profileResponse = await api.get('/auth/profile', {
          headers: { Authorization: `Bearer ${existingAccessToken}` }
        });
        setAccessToken(existingAccessToken);
        setUser(profileResponse.data);
        setLoading(false);
        return existingAccessToken;
      } catch (e) {
        // Access token expired, proceed to refresh token exchange
        console.log('Access token expired or invalid, attempting refresh');
      }
    }

    if (!refreshToken) {
      setLoading(false);
      return null;
    }

    try {
      const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
      const { access_token, refresh_token: newRefreshToken } = response.data;
      
      setAccessToken(access_token);
      sessionStorage.setItem('access_token', access_token);
      if (newRefreshToken) {
        const storage = localStorage.getItem('refresh_token') ? localStorage : sessionStorage;
        storage.setItem('refresh_token', newRefreshToken);
      }
      
      const profileResponse = await api.get('/auth/profile', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      
      setUser(profileResponse.data);
      return access_token;
    } catch (error) {
      console.error('Failed to refresh token', error);
      logout();
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Check login session on mount
  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  // Set up auto-refresh interval before token expires (~50 minutes)
  useEffect(() => {
    if (!accessToken) return;

    const intervalTime = 50 * 60 * 1000; // 50 minutes
    const interval = setInterval(() => {
      refreshSession();
    }, intervalTime);

    return () => clearInterval(interval);
  }, [accessToken, refreshSession]);

  const login = async (email, password, rememberMe = false) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password, remember_me: rememberMe });
      const { access_token, refresh_token, user: userData } = response.data;

      setAccessToken(access_token);
      sessionStorage.setItem('access_token', access_token);
      setUser(userData);
      
      if (rememberMe) {
        localStorage.setItem('refresh_token', refresh_token);
        localStorage.setItem('school_id', userData.school_id || '');
      } else {
        sessionStorage.setItem('refresh_token', refresh_token);
        sessionStorage.setItem('school_id', userData.school_id || '');
      }

      return userData;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refresh_token: refreshToken });
      }
    } catch (error) {
      console.error('Logout request error', error);
    } finally {
      setAccessToken(null);
      setUser(null);
      sessionStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('school_id');
      sessionStorage.removeItem('refresh_token');
      sessionStorage.removeItem('school_id');
      setLoading(false);
      window.location.href = '/login';
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    await api.post('/auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword
    });
  };

  const refreshProfile = useCallback(async () => {
    try {
      const profileResponse = await api.get('/auth/profile');
      setUser(profileResponse.data);
    } catch (error) {
      console.error('Failed to refresh profile in context', error);
    }
  }, []);

  // Auto-sync allowed_features every 2 minutes when user is logged in
  useEffect(() => {
    if (!user || user.role === 'superadmin') return;
    const interval = setInterval(() => {
      refreshProfile();
    }, 2 * 60 * 1000); // every 2 minutes
    return () => clearInterval(interval);
  }, [user?.id, refreshProfile]);

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, logout, changePassword, refreshSession, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
