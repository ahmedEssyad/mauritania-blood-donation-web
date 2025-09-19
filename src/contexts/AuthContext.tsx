'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User } from '@/types';
import apiService from '@/lib/api';

interface ProfileCompletionStatus {
  profileCompleted: boolean;
  isProfileComplete: boolean;
  missingFields: Record<string, string>;
  completionPercentage: number;
  nextSteps: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  profileStatus: ProfileCompletionStatus | null;
  checkProfileCompletion: () => Promise<ProfileCompletionStatus | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profileStatus, setProfileStatus] = useState<ProfileCompletionStatus | null>(null);

  // Race condition prevention
  const profileCheckRef = useRef<Promise<ProfileCompletionStatus | null> | null>(null);
  const authCheckRef = useRef<Promise<void> | null>(null);
  const userRefreshRef = useRef<Promise<void> | null>(null);


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
    // Prevent multiple simultaneous auth checks
    if (authCheckRef.current) {
      return authCheckRef.current;
    }

    const authPromise = (async () => {
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

            // Check profile completion after user is set
            // Don't await to avoid blocking auth check
            checkProfileCompletion().catch(err => {
              console.warn('Profile completion check failed during auth check:', err);
            });
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
        // Clear the ref when done to allow future calls
        authCheckRef.current = null;
      }
    })();

    authCheckRef.current = authPromise;
    return authPromise;
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

  const checkProfileCompletion = React.useCallback(async (): Promise<ProfileCompletionStatus | null> => {
    // Prevent race conditions by reusing existing promise
    if (profileCheckRef.current) {
      return profileCheckRef.current;
    }

    const checkPromise = (async (): Promise<ProfileCompletionStatus | null> => {
      try {
        if (!isAuthenticated) {
          return null;
        }

        const response = await apiService.getProfileCompletionStatus();

        if (response.success && response.data) {
          const status = response.data;
          setProfileStatus(status);

          // Only perform smart redirection for specific action-based routes
          if (!status.isProfileComplete && typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            const locale = currentPath.split('/')[1] || 'fr';

            // Don't redirect if already on profile completion page
            if (!currentPath.includes('/auth/completer-profil')) {
              // Only redirect for specific actions that absolutely require complete profile
              const actionRequiringProfile =
                currentPath === `/${locale}/demandes/creer` || // Creating new request
                (currentPath.includes('/demandes/') && currentPath.includes('/repondre')); // Responding to request

              if (actionRequiringProfile) {
                console.log('Redirecting to profile completion for action requiring complete profile');
                // Store the intended destination to redirect back after completion
                sessionStorage.setItem('redirect_after_profile_completion', currentPath);
                window.location.href = `/${locale}/auth/completer-profil?return=${encodeURIComponent(currentPath)}`;
                return status;
              }

              // For dashboard and other browsing pages, don't auto-redirect
              // Let users browse freely and show completion prompts in UI instead
            }
          }

          return status;
        }
      } catch (error: any) {
        console.error('Failed to check profile completion:', error);

        // Handle different types of errors gracefully
        if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT' || error.code === 'OFFLINE') {
          // Network errors - assume profile is complete to avoid blocking access
          console.warn('Network error during profile check - allowing access');
          return {
            profileCompleted: true,
            isProfileComplete: true,
            missingFields: {},
            completionPercentage: 100,
            nextSteps: "Unable to verify profile status due to network error"
          };
        }

        // For other errors (like 401), let them bubble up to be handled by AuthContext
        if (error.response?.status === 401) {
          throw error; // This will trigger auth refresh/logout logic
        }

        // For other API errors, fail gracefully
        return {
          profileCompleted: true,
          isProfileComplete: true,
          missingFields: {},
          completionPercentage: 100,
          nextSteps: "Unable to verify profile status"
        };
      } finally {
        // Clear the ref when done to allow future calls
        profileCheckRef.current = null;
      }

      return null;
    })();

    profileCheckRef.current = checkPromise;
    return checkPromise;
  }, [isAuthenticated]);

  const refreshUser = React.useCallback(async () => {
    // Prevent race conditions by reusing existing promise
    if (userRefreshRef.current) {
      return userRefreshRef.current;
    }

    const refreshPromise = (async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setUser(null);
          setIsAuthenticated(false);
          setProfileStatus(null);
          return;
        }

        const response = await apiService.getProfile();

        if (response.success && response.data) {
          // The API returns { success: true, data: { user: {...} } }
          const userData = response.data.user || response.data;
          setUser(userData);
          setIsAuthenticated(true);
          localStorage.setItem('user', JSON.stringify(userData));

          // Check profile completion after user data is updated
          // Don't await to avoid blocking the refresh
          checkProfileCompletion().catch(err => {
            console.warn('Profile completion check failed during user refresh:', err);
          });
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
          setProfileStatus(null);
        }
      } catch (error: any) {
        console.error('Failed to refresh user:', error);
        // Don't clear auth state on network errors, but log the issue
        // Only clear if it's an authentication error
        if (error.response?.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setUser(null);
          setIsAuthenticated(false);
          setProfileStatus(null);
        }
      } finally {
        // Clear the ref when done to allow future calls
        userRefreshRef.current = null;
      }
    })();

    userRefreshRef.current = refreshPromise;
    return refreshPromise;
  }, [checkProfileCompletion]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser,
        isAuthenticated,
        profileStatus,
        checkProfileCompletion,
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