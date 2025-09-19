'use client';

import { useState, useEffect, useCallback } from 'react';
import apiService from '@/lib/api';
import { DonationRecord } from '@/types';
import { useErrorHandler } from '@/lib/error-handler';

interface DonationParams {
  role?: 'donor' | 'requester' | 'all';
  status?: 'PENDING' | 'CONFIRMED' | 'DISPUTED' | 'CANCELLED';
  page?: number;
  limit?: number;
}

interface DonationData {
  donations: DonationRecord[];
  pagination: {
    current: number;
    total: number;
    count: number;
    totalRecords: number;
  };
}

export function useDonations(params: DonationParams, t: (key: string) => string) {
  const [data, setData] = useState<DonationData>({
    donations: [],
    pagination: {
      current: 1,
      total: 0,
      count: 0,
      totalRecords: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const { handleApiError } = useErrorHandler(t);

  const fetchDonations = useCallback(async (newParams?: DonationParams) => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = { ...params, ...newParams };
      const response = await apiService.getDonationHistory(searchParams);

      if (response.success && response.data) {
        setData({
          donations: response.data.donations,
          pagination: response.data.pagination
        });
      } else {
        throw new Error(response.message || 'Failed to fetch donations');
      }
    } catch (err: any) {
      const handledError = handleApiError(err);
      setError(handledError);
    } finally {
      setLoading(false);
    }
  }, [params, handleApiError]);

  const confirmDonationReceived = useCallback(async (donationId: string, data: {
    notes?: string;
    rating?: number;
    feedback?: string;
  }) => {
    try {
      const response = await apiService.confirmDonationReceived(donationId, data);
      if (response.success) {
        await fetchDonations();
        return { success: true };
      }
      return { success: false, error: response.message };
    } catch (err: any) {
      const handledError = handleApiError(err);
      return { success: false, error: handledError };
    }
  }, [handleApiError, fetchDonations]);

  const rateDonation = useCallback(async (donationId: string, rating: number, feedback?: string) => {
    try {
      const response = await apiService.rateDonation(donationId, rating, feedback);
      if (response.success) {
        await fetchDonations();
        return { success: true };
      }
      return { success: false, error: response.message };
    } catch (err: any) {
      const handledError = handleApiError(err);
      return { success: false, error: handledError };
    }
  }, [handleApiError, fetchDonations]);

  const confirmDonation = useCallback(async (requestId: string, donorUserId: string, notes?: string) => {
    try {
      const response = await apiService.confirmDonation({
        requestId,
        donorUserId,
        notes
      });
      if (response.success) {
        await fetchDonations();
        return { success: true, nextEligibleDate: response.data?.nextEligibleDate };
      }
      return { success: false, error: response.message };
    } catch (err: any) {
      const handledError = handleApiError(err);
      return { success: false, error: handledError };
    }
  }, [handleApiError, fetchDonations]);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  return {
    data,
    loading,
    error,
    refetch: fetchDonations,
    confirmDonationReceived,
    rateDonation,
    confirmDonation
  };
}

export function usePendingConfirmations(t: (key: string) => string) {
  const [data, setData] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const { handleApiError } = useErrorHandler(t);

  const fetchPendingConfirmations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getPendingConfirmations();

      if (response.success && response.data) {
        setData(response.data.pendingDonations || []);
      } else {
        throw new Error(response.message || 'Failed to fetch pending confirmations');
      }
    } catch (err: any) {
      const handledError = handleApiError(err);
      setError(handledError);
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  useEffect(() => {
    fetchPendingConfirmations();
  }, [fetchPendingConfirmations]);

  return {
    data,
    loading,
    error,
    refetch: fetchPendingConfirmations
  };
}