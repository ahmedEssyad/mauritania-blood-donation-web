'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import apiService from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);


  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Re-check auth when navigating between pages (including language switches)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        // Silently refresh user data when page becomes visible
        refreshUser();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated]);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      if (!token) {
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      // First, try to load user from localStorage for faster UI response
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsAuthenticated(true);
        } catch (e) {
          console.warn('Failed to parse stored user data:', e);
        }
      }

      // Then refresh user data from API
      try {
        const response = await apiService.getProfile();

        if (response.success && response.data) {
          // The API returns { success: true, data: { user: {...} } }
          const userData = response.data.user || response.data;
          setUser(userData);
          setIsAuthenticated(true);
          localStorage.setItem('user', JSON.stringify(userData));
        } else if (response.code === 'RATE_LIMITED') {
          // Handle rate limiting - keep existing auth state with cached data
          console.warn('Profile API rate limited - keeping cached user data');
          // Don't update anything, keep existing auth state
        } else {
          throw new Error('Failed to get profile');
        }
      } catch (apiError: any) {
        console.error('API profile fetch failed:', apiError);

        // If API fails but we have a token and stored user, keep them authenticated
        // This provides better UX during network issues
        if (!storedUser) {
          // Only clear auth if we have no fallback user data
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear invalid tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone: string, password: string) => {
    try {
      const response = await apiService.login(phone, password);

      if (response.success && response.data) {
        const { tokens, user: userData } = response.data;

        // Store tokens
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));

        setUser(userData);
        setIsAuthenticated(true);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await apiService.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear storage regardless of API call success
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const refreshUser = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setUser(null);
        setIsAuthenticated(false);
        return;
      }

      const response = await apiService.getProfile();

      if (response.success && response.data) {
        // The API returns { success: true, data: { user: {...} } }
        const userData = response.data.user || response.data;
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userData));
      } else if (response.code === 'RATE_LIMITED') {
        // Handle rate limiting - keep existing auth state
        console.warn('Refresh user API rate limited - keeping current state');
        // Don't clear anything, just keep current state
        return;
      } else {
        // Token might be expired, clear everything
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error: any) {
      console.error('Failed to refresh user:', error);
      // Don't clear auth state on network errors, but log the issue
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}