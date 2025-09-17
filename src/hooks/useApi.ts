import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';

interface UseApiOptions<T> {
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  retries?: number;
  retryDelay?: number;
}

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (...args: any[]) => Promise<T | null>;
  retry: () => Promise<T | null>;
  reset: () => void;
}

export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<any>,
  deps: any[] = [],
  options: UseApiOptions<T> = {}
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastArgs, setLastArgs] = useState<any[]>([]);
  const t = useTranslations('errors');

  const {
    immediate = false,
    onSuccess,
    onError,
    retries = 3,
    retryDelay = 1000
  } = options;

  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    setLoading(true);
    setError(null);
    setLastArgs(args);

    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await apiFunction(...args);

        if (response?.success) {
          setData(response.data);
          onSuccess?.(response.data);
          setLoading(false);
          return response.data;
        } else {
          throw new Error(response?.message || 'API request failed');
        }
      } catch (err: any) {
        lastError = err;

        // Don't retry on 4xx errors (client errors)
        if (err.response?.status >= 400 && err.response?.status < 500) {
          break;
        }

        if (attempt < retries) {
          await new Promise(resolve =>
            setTimeout(resolve, retryDelay * Math.pow(2, attempt))
          );
        }
      }
    }

    // Handle final error
    const finalError = new Error(getErrorMessage(lastError!, t));
    setError(finalError);
    setLoading(false);
    onError?.(finalError);
    return null;
  }, [apiFunction, retries, retryDelay, onSuccess, onError, t]);

  const retry = useCallback(() => {
    return execute(...lastArgs);
  }, [execute, lastArgs]);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
    setLastArgs([]);
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, deps);

  return { data, loading, error, execute, retry, reset };
}

export function useApiMutation<T = any>(
  apiFunction: (...args: any[]) => Promise<any>,
  options: UseApiOptions<T> = {}
): UseApiState<T> {
  return useApi(apiFunction, [], { ...options, immediate: false });
}

function getErrorMessage(error: any, t: any): string {
  if (error.code === 'TIMEOUT') {
    return t('networkError');
  }

  if (error.code === 'NETWORK_ERROR') {
    return t('networkError');
  }

  if (error.response) {
    const status = error.response.status;

    switch (status) {
      case 401:
        return t('unauthorized');
      case 403:
        return t('forbidden');
      case 404:
        return t('notFound');
      case 422:
        return t('validationError');
      case 500:
        return t('serverError');
      default:
        return error.response.data?.message || error.message || t('serverError');
    }
  }

  return error.message || t('serverError');
}

// Specialized hooks for common operations
export function useBloodRequests(params: any = {}) {
  return useApi(
    () => api.getBloodRequests(params),
    [JSON.stringify(params)],
    { immediate: true }
  );
}

export function useUserProfile() {
  return useApi(
    () => api.getProfile(),
    [],
    { immediate: true }
  );
}

export function useNotifications(params: any = {}) {
  return useApi(
    () => api.getNotificationHistory(params),
    [JSON.stringify(params)],
    { immediate: true }
  );
}

export function useDonationHistory(params: any = {}) {
  return useApi(
    () => api.getDonationHistory(params),
    [JSON.stringify(params)],
    { immediate: true }
  );
}

export function useUserStats() {
  return useApi(
    () => api.getUserStats(),
    [],
    { immediate: true }
  );
}