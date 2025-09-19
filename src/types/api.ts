export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  profileIncomplete?: boolean;
  code?: string;
}

export class ProfileIncompleteError extends Error {
  constructor(public data: any) {
    super('Profile incomplete');
    this.name = 'ProfileIncompleteError';
  }
}

// API error handling utility
export const handleApiCall = async <T>(
  apiCall: () => Promise<ApiResponse<T>>,
  onProfileIncomplete?: () => void
): Promise<ApiResponse<T> | null> => {
  try {
    const result = await apiCall();
    
    // Check if profile is incomplete in response
    if (result.profileIncomplete && onProfileIncomplete) {
      onProfileIncomplete();
      return null;
    }
    
    return result;
  } catch (error: any) {
    if (error instanceof ProfileIncompleteError && onProfileIncomplete) {
      onProfileIncomplete();
      return null;
    }
    
    // Re-throw other errors
    throw error;
  }
};

// Hook for API error handling
export const useApiErrorHandler = (onProfileIncomplete: () => void) => {
  return {
    handleApiCall: <T>(apiCall: () => Promise<ApiResponse<T>>) => 
      handleApiCall(apiCall, onProfileIncomplete)
  };
};