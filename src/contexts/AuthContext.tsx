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

  // Debug logging
  React.useEffect(() => {
    console.log('👤 User state changed:', user);
    console.log('🔐 Authentication state changed:', isAuthenticated);
    console.log('⏳ Loading state changed:', loading);
  }, [user, isAuthenticated, loading]);

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
    console.log('🔍 Checking auth status...');
    try {
      const token = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');
      console.log('🔍 Token exists:', !!token, 'Stored user exists:', !!storedUser);

      if (!token) {
        console.log('🔍 No token found, setting unauthenticated');
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      // First, try to load user from localStorage for faster UI response
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          console.log('🔍 Loaded user from localStorage:', userData);
          setUser(userData);
          setIsAuthenticated(true);
        } catch (e) {
          console.warn('Failed to parse stored user data:', e);
        }
      }

      // Then refresh user data from API
      try {
        const response = await apiService.getProfile();
        console.log('🔍 API profile response:', response);

        if (response.success && response.data) {
          // The API returns { success: true, data: { user: {...} } }
          const userData = response.data.user || response.data;
          console.log('🔍 Setting user data from API:', userData);
          setUser(userData);
          setIsAuthenticated(true);
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          console.warn('🔍 API response not successful or no data:', response);
          throw new Error('Failed to get profile');
        }
      } catch (apiError: any) {
        console.error('🔍 API profile fetch failed:', apiError);
        console.error('🔍 Error details:', {
          message: apiError.message,
          status: apiError.response?.status,
          data: apiError.response?.data
        });

        // If API fails but we have a token and stored user, keep them authenticated
        // This provides better UX during network issues
        if (!storedUser) {
          console.log('🔍 No stored user, clearing auth state');
          // Only clear auth if we have no fallback user data
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setUser(null);
          setIsAuthenticated(false);
        } else {
          console.log('🔍 Keeping stored user due to API error');
        }
      }
    } catch (error) {
      console.error('🔍 Auth check failed:', error);
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
    console.log('🔐 Login attempt for phone:', phone);
    try {
      const response = await apiService.login(phone, password);
      console.log('🔐 Login response:', response);

      if (response.success && response.data) {
        const { tokens, user: userData } = response.data;
        console.log('🔐 Login successful, user data:', userData);

        // Store tokens
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));

        setUser(userData);
        setIsAuthenticated(true);
        console.log('🔐 User state updated successfully');
      } else {
        console.error('🔐 Login failed:', response.message);
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('🔐 Login error:', error);
      console.error('🔐 Login error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
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
        console.log('🔄 No token found during refresh');
        setUser(null);
        setIsAuthenticated(false);
        return;
      }

      console.log('🔄 Refreshing user data...');
      const response = await apiService.getProfile();
      console.log('🔄 Refresh response:', response);

      if (response.success && response.data) {
        // The API returns { success: true, data: { user: {...} } }
        const userData = response.data.user || response.data;
        console.log('🔄 Refreshed user data:', userData);
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        console.warn('🔄 Refresh failed, clearing auth state');
        // Token might be expired, clear everything
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error: any) {
      console.error('🔄 Failed to refresh user:', error);
      console.error('🔄 Refresh error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
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