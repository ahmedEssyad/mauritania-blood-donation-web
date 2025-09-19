'use client';

import { useState, useEffect, useCallback } from 'react';
import apiService from '@/lib/api';
import { BloodRequest, BloodRequestResponse } from '@/types';
import { useErrorHandler } from '@/lib/error-handler';

interface BloodRequestDetailData {
  request: BloodRequest | null;
  responses: BloodRequestResponse[];
  userContext: {
    isOwner: boolean;
    hasResponded: boolean;
    canRespond: boolean;
  };
}

export function useBloodRequestDetail(requestId: string, t: (key: string) => string) {
  const [data, setData] = useState<BloodRequestDetailData>({
    request: null,
    responses: [],
    userContext: {
      isOwner: false,
      hasResponded: false,
      canRespond: false
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const { handleApiError } = useErrorHandler(t);

  const fetchRequestDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getBloodRequest(requestId);

      if (response.success && response.data) {
        setData({
          request: response.data.request,
          responses: response.data.request.responses || [],
          userContext: response.data.userContext
        });
      } else {
        throw new Error(response.message || 'Failed to fetch request details');
      }
    } catch (err: any) {
      const handledError = handleApiError(err);
      setError(handledError);
    } finally {
      setLoading(false);
    }
  }, [requestId, handleApiError]);

  const respondToRequest = useCallback(async (message?: string) => {
    try {
      const response = await apiService.respondToRequest(requestId, message);
      if (response.success) {
        // Refresh the request details to show updated response count
        await fetchRequestDetail();
        return { success: true, responseId: response.data?.responseId };
      }
      return { success: false, error: response.message };
    } catch (err: any) {
      const handledError = handleApiError(err);
      return { success: false, error: handledError };
    }
  }, [requestId, handleApiError, fetchRequestDetail]);

  const closeRequest = useCallback(async (reason: 'FULFILLED' | 'CANCELLED', notes?: string) => {
    try {
      const response = await apiService.closeBloodRequest(requestId, reason, notes);
      if (response.success) {
        await fetchRequestDetail();
        return { success: true };
      }
      return { success: false, error: response.message };
    } catch (err: any) {
      const handledError = handleApiError(err);
      return { success: false, error: handledError };
    }
  }, [requestId, handleApiError, fetchRequestDetail]);

  const confirmDonor = useCallback(async (responseId: string) => {
    try {
      const response = await apiService.confirmDonor(requestId, responseId);
      if (response.success) {
        await fetchRequestDetail();
        return { success: true };
      }
      return { success: false, error: response.message };
    } catch (err: any) {
      const handledError = handleApiError(err);
      return { success: false, error: handledError };
    }
  }, [requestId, handleApiError, fetchRequestDetail]);

  useEffect(() => {
    if (requestId) {
      fetchRequestDetail();
    }
  }, [requestId, fetchRequestDetail]);

  return {
    data,
    loading,
    error,
    refetch: fetchRequestDetail,
    respondToRequest,
    closeRequest,
    confirmDonor
  };
}