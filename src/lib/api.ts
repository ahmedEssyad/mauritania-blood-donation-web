import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { ApiResponse, ProfileIncompleteError } from '@/types/api';

interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryCondition?: (error: AxiosError) => boolean;
}

class ApiService {
  private client: AxiosInstance;
  private baseURL: string;
  private retryConfig: RetryConfig = {
    retries: 3,
    retryDelay: 1000,
    retryCondition: (error: AxiosError) => {
      return !error.response || error.response.status >= 500;
    }
  };

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://mauritania-blood-donation-api.onrender.com/api';

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private async retryRequest(
    requestConfig: any,
    retryConfig: RetryConfig = this.retryConfig
  ): Promise<any> {
    const { retries, retryDelay, retryCondition } = retryConfig;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.client(requestConfig);
      } catch (error) {
        const axiosError = error as AxiosError;

        if (attempt === retries || !retryCondition?.(axiosError)) {
          throw error;
        }

        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
      }
    }
  }

  private setupInterceptors() {
    // Request interceptor - Add auth token and language
    this.client.interceptors.request.use(
      async (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add language header for internationalization
        const locale = localStorage.getItem('locale') || 'fr';
        config.headers['Accept-Language'] = locale;

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Handle token refresh and network errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle timeout and network errors with standardized error codes
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
          const timeoutError = new Error('Connection timeout. Please check your internet connection and try again.');
          (timeoutError as any).code = 'TIMEOUT';
          (timeoutError as any).isNetworkError = true;
          return Promise.reject(timeoutError);
        }

        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          const networkError = new Error('Cannot connect to server. Please check your internet connection.');
          (networkError as any).code = 'NETWORK_ERROR';
          (networkError as any).isNetworkError = true;
          return Promise.reject(networkError);
        }

        // Handle offline status
        if (!navigator.onLine) {
          const offlineError = new Error('You are offline. Please check your internet connection.');
          (offlineError as any).code = 'OFFLINE';
          (offlineError as any).isNetworkError = true;
          return Promise.reject(offlineError);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await this.client.post('/auth/refresh-token', {
                refreshToken,
              });

              const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;

              localStorage.setItem('accessToken', accessToken);
              localStorage.setItem('refreshToken', newRefreshToken);

              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            window.location.href = '/auth/connexion';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async sendOTP(phone: string): Promise<ApiResponse> {
    const response = await this.client.post('/auth/send-otp', { phone });
    return response.data;
  }

  async verifyOTP(phone: string, code: string): Promise<ApiResponse> {
    const response = await this.client.post('/auth/verify-otp', { phone, code });
    return response.data;
  }

  async setPassword(phone: string, password: string): Promise<ApiResponse> {
    const response = await this.client.post('/auth/set-password', { phone, password });
    return response.data;
  }

  async login(phone: string, password: string): Promise<ApiResponse> {
    const response = await this.client.post('/auth/login', { phone, password });
    return response.data;
  }

  async forgotPassword(phone: string): Promise<ApiResponse> {
    const response = await this.client.post('/auth/forgot-password', { phone });
    return response.data;
  }

  async resetPassword(phone: string, code: string, password: string): Promise<ApiResponse> {
    const response = await this.client.post('/auth/reset-password', { phone, code, password });
    return response.data;
  }

  async logout(refreshToken: string): Promise<ApiResponse> {
    const response = await this.client.post('/auth/logout', { refreshToken });
    return response.data;
  }

  // User endpoints
  async getProfile(): Promise<ApiResponse> {
    try {
      const response = await this.client.get('/user/profile');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 429) {
        // Handle rate limiting - return a response that indicates rate limiting
        console.warn('Rate limit exceeded for profile - auth will use cached data');
        return {
          success: false,
          message: 'Too many requests. Using cached profile data.',
          code: 'RATE_LIMITED'
        };
      }
      throw error;
    }
  }

  async updateProfile(data: {
    name?: string;
    bloodType?: string;
    lastDonationDate?: string | null;
    coordinates?: { latitude: number; longitude: number };
    profileCompleted?: boolean;
  }): Promise<ApiResponse> {
    const response = await this.client.put('/user/profile', data);
    return response.data;
  }

  async getProfileCompletionStatus(): Promise<ApiResponse> {
    try {
      const response = await this.client.get('/user/profile-completion-status');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        // If endpoint doesn't exist, check profile manually
        const profileResponse = await this.getProfile();
        if (profileResponse.success && profileResponse.data?.user) {
          const user = profileResponse.data.user;

          // More reliable completion logic:
          // 1. Check if user explicitly marked profile as complete
          // 2. OR check if all required fields are present (blood type + coordinates)
          const hasRequiredFields = !!(user.bloodType && user.coordinates);
          const isMarkedComplete = user.profileCompleted === true;
          const isComplete = isMarkedComplete || hasRequiredFields;

          // Calculate missing fields only if profile is not complete
          const missingFields: Record<string, string> = {};
          if (!isComplete) {
            if (!user.bloodType) {
              missingFields.bloodType = "Groupe sanguin requis";
            }
            if (!user.coordinates) {
              missingFields.coordinates = "Localisation requise pour recevoir des demandes";
            }
            // Only require explicit completion if other fields are missing
            if (!hasRequiredFields && !user.profileCompleted) {
              missingFields.profileCompleted = "Veuillez marquer le profil comme terminé";
            }
          }

          // Calculate completion percentage
          let completionPercentage = 0;
          if (user.bloodType) completionPercentage += 40;
          if (user.coordinates) completionPercentage += 40;
          if (user.lastDonationDate !== undefined) completionPercentage += 10; // Optional field
          if (user.profileCompleted || hasRequiredFields) completionPercentage += 10;

          return {
            success: true,
            data: {
              profileCompleted: user.profileCompleted || false,
              isProfileComplete: isComplete,
              missingFields,
              completionPercentage: Math.min(completionPercentage, 100),
              nextSteps: isComplete ? "Profil complet" : "Complétez les champs manquants pour finaliser votre profil"
            }
          };
        }
      }
      throw error;
    }
  }

  async getEligibilityStatus(): Promise<ApiResponse> {
    try {
      const response = await this.client.get('/user/eligibility-status');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Return mock data if endpoint doesn't exist yet
        return {
          success: true,
          data: {
            isEligible: true,
            nextEligibleDate: null,
            eligibilityReason: null
          }
        };
      }
      throw error;
    }
  }

  async updatePushToken(token: string): Promise<ApiResponse> {
    const response = await this.client.post('/user/push-token', { token });
    return response.data;
  }

  async getNotificationPreferences(): Promise<ApiResponse> {
    const response = await this.client.get('/user/notification-preferences');
    return response.data;
  }

  async updateNotificationPreferences(preferences: any): Promise<ApiResponse> {
    try {
      const response = await this.client.put('/user/notification-preferences', preferences);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Return success if endpoint doesn't exist yet
        return {
          success: true,
          data: {
            user: null
          }
        };
      }
      throw error;
    }
  }

  async getDonationHistory(params: any = {}): Promise<ApiResponse> {
    const response = await this.client.get('/donations/history', { params });
    return response.data;
  }

  async getUserStats(): Promise<ApiResponse> {
    try {
      const response = await this.client.get('/user/stats');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 500) {
        // Return mock data if endpoint doesn't exist or has issues
        return {
          success: true,
          data: {
            totalDonations: 0,
            thisYearDonations: 0,
            avgRating: 0,
            totalResponses: 0
          }
        };
      } else if (error.response?.status === 429) {
        // Handle rate limiting - return empty stats with message
        console.warn('Rate limit exceeded for user stats');
        return {
          success: true,
          data: {
            totalDonations: 0,
            thisYearDonations: 0,
            avgRating: 0,
            totalResponses: 0,
            rateLimited: true
          },
          message: 'Too many requests. Please try again later.'
        };
      }
      throw error;
    }
  }

  // Blood request endpoints
  async getBloodRequests(params: any = {}): Promise<ApiResponse> {
    try {
      const response = await this.client.get('/blood-requests', { params });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 500) {
        // Return empty data if endpoint has issues
        return {
          success: true,
          data: {
            requests: [],
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0
          }
        };
      } else if (error.response?.status === 429) {
        // Handle rate limiting - return empty data with message
        console.warn('Rate limit exceeded for blood requests');
        return {
          success: true,
          data: {
            requests: [],
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0,
            rateLimited: true
          },
          message: 'Too many requests. Please try again later.'
        };
      }
      throw error;
    }
  }

  async createBloodRequest(data: any): Promise<ApiResponse> {
    const response = await this.client.post('/blood-requests', data);

    // Check if profile is incomplete
    if (response.data.profileIncomplete) {
      throw new ProfileIncompleteError(response.data);
    }

    return response.data;
  }

  async getMyRequests(params: any = {}): Promise<ApiResponse> {
    const response = await this.client.get('/blood-requests/my-requests', { params });
    return response.data;
  }

  async respondToRequest(requestId: string, message?: string): Promise<ApiResponse> {
    const response = await this.client.post(`/blood-requests/${requestId}/respond`, { message });

    // Check if profile is incomplete
    if (response.data.profileIncomplete) {
      throw new ProfileIncompleteError(response.data);
    }

    return response.data;
  }

  async closeRequest(requestId: string, reason: string, notes?: string): Promise<ApiResponse> {
    const response = await this.client.put(`/blood-requests/${requestId}/close`, { reason, notes });
    return response.data;
  }

  async getBloodRequest(requestId: string): Promise<ApiResponse> {
    const response = await this.client.get(`/blood-requests/${requestId}`);
    return response.data;
  }

  async respondToBloodRequest(requestId: string, data: { message?: string; availableAt?: string }): Promise<ApiResponse> {
    const response = await this.client.post(`/blood-requests/${requestId}/respond`, data);

    // Check if profile is incomplete
    if (response.data.profileIncomplete) {
      throw new ProfileIncompleteError(response.data);
    }

    return response.data;
  }

  async getBloodRequestResponses(requestId: string): Promise<ApiResponse> {
    try {
      const response = await this.client.get(`/blood-requests/${requestId}/responses`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Return mock data if endpoint doesn't exist yet
        return {
          success: true,
          data: {
            responses: []
          }
        };
      }
      throw error;
    }
  }

  async confirmDonor(requestId: string, responseId: string): Promise<ApiResponse> {
    const response = await this.client.post(`/blood-requests/${requestId}/confirm-donor`, { responseId });
    return response.data;
  }

  async getNearbyDonors(params: {
    lat: number;
    lng: number;
    radius?: number;
    limit?: number;
    bloodType?: string;
  }): Promise<ApiResponse> {
    try {
      const response = await this.client.get('/users/nearby-donors', { params });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 500) {
        // Return empty data if endpoint has issues
        return {
          success: true,
          data: {
            donors: [],
            total: 0
          }
        };
      }
      throw error;
    }
  }

  // Donation endpoints
  async confirmDonation(data: any): Promise<ApiResponse> {
    const response = await this.client.post('/donations/confirm-donation', data);
    return response.data;
  }

  async confirmReceived(donationId: string, data: any): Promise<ApiResponse> {
    const response = await this.client.put(`/donations/${donationId}/confirm-received`, data);
    return response.data;
  }

  async getDonationStats(): Promise<ApiResponse> {
    const response = await this.client.get('/donations/stats');
    return response.data;
  }

  async rateDonation(donationId: string, rating: number, feedback?: string): Promise<ApiResponse> {
    const response = await this.client.post(`/donations/${donationId}/rate`, { rating, feedback });
    return response.data;
  }

  async getPendingConfirmations(): Promise<ApiResponse> {
    const response = await this.client.get('/donations/pending-confirmations');
    return response.data;
  }

  // Notification endpoints
  async getNotificationHistory(params: any = {}): Promise<ApiResponse> {
    try {
      const response = await this.client.get('/notifications/history', { params });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 500) {
        // Return mock data if endpoint doesn't exist yet
        return {
          success: true,
          data: {
            notifications: [],
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0
          }
        };
      }
      throw error;
    }
  }

  async markNotificationRead(notificationId: string): Promise<ApiResponse> {
    try {
      const response = await this.client.put(`/notifications/${notificationId}/mark-read`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Return success if endpoint doesn't exist yet
        return { success: true, data: {} };
      }
      throw error;
    }
  }

  async markAllNotificationsRead(): Promise<ApiResponse> {
    try {
      const response = await this.client.put('/notifications/mark-all-read');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Return success if endpoint doesn't exist yet
        return { success: true, data: {} };
      }
      throw error;
    }
  }

  async getUnreadCount(): Promise<ApiResponse> {
    const response = await this.client.get('/notifications/unread-count');
    return response.data;
  }

  // Méthodes manquantes pour les notifications
  async getNotificationSettings(): Promise<ApiResponse> {
    const response = await this.client.get('/notifications/settings');
    return response.data;
  }

  async updateNotificationSettings(settings: any): Promise<ApiResponse> {
    const response = await this.client.put('/notifications/preferences', settings);
    return response.data;
  }

  // Endpoint pour les demandes par utilisateur
  async getMyBloodRequests(params: any = {}): Promise<ApiResponse> {
    const response = await this.client.get('/blood-requests/my-requests', { params });
    return response.data;
  }

  // Endpoint pour supprimer une demande
  async deleteBloodRequest(requestId: string): Promise<ApiResponse> {
    const response = await this.client.delete(`/blood-requests/${requestId}`);
    return response.data;
  }

  // Endpoint pour confirmer la réception d'un don
  async confirmDonationReceived(donationId: string, data: {
    notes?: string;
    rating?: number;
    feedback?: string;
  }): Promise<ApiResponse> {
    const response = await this.client.put(`/donations/${donationId}/confirm-received`, data);
    return response.data;
  }

}

export default new ApiService();