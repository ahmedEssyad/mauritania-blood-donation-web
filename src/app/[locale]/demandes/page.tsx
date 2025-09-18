'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import BloodRequestCard from '@/components/blood-requests/BloodRequestCard';
import FilterBar from '@/components/blood-requests/FilterBar';
import { Button } from '@/components/ui/button';
import { ApiErrorBoundary } from '@/components/ErrorBoundary';
import { BloodRequestListSkeleton } from '@/components/LoadingStates';
import { useBloodRequests } from '@/hooks/useApi';
import { debounce } from '@/lib/performance';
import {
  Plus,
  RefreshCw,
  Heart,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import apiService from '@/lib/api';
import { BloodRequest, BloodType, UrgencyLevel, RequestStatus } from '@/types';

interface FilterState {
  search: string;
  bloodType: BloodType | 'all';
  urgency: UrgencyLevel | 'all';
  status: RequestStatus | 'all';
  maxDistance: number;
  sortBy: 'newest' | 'closest' | 'urgent';
}

export default function BloodRequestsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [filteredRequests, setFilteredRequests] = useState<BloodRequest[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    bloodType: 'all',
    urgency: 'all',
    status: 'active',
    maxDistance: 50,
    sortBy: 'newest'
  });

  const t = useTranslations();

  // Build API params
  const apiParams = {
    ...(userLocation && {
      lat: userLocation.lat,
      lng: userLocation.lng,
      radius: filters.maxDistance
    }),
    ...(filters.bloodType !== 'all' && { bloodType: filters.bloodType }),
    ...(filters.urgency !== 'all' && { urgency: filters.urgency }),
    ...(filters.status !== 'all' && { status: filters.status })
  };

  // Use optimized API hook
  const { data: requestsData, loading, error, execute: refreshRequests } = useBloodRequests(apiParams);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Location access denied:', error);
        }
      );
    }
  }, []);

  const requests = requestsData?.requests || [];

  // Sort requests function
  const sortRequests = useCallback((requests: BloodRequest[], sortBy: string) => {
    return [...requests].sort((a, b) => {
      switch (sortBy) {
        case 'closest':
          return (a.distance || 999) - (b.distance || 999);
        case 'urgent':
          const urgencyOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return urgencyOrder[b.urgencyLevel] - urgencyOrder[a.urgencyLevel];
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchTerm: string, allRequests: BloodRequest[], sortBy: string) => {
      let filtered = [...allRequests];

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(request =>
          request.description?.toLowerCase().includes(searchLower) ||
          request.medicalInfo?.hospitalName?.toLowerCase().includes(searchLower) ||
          request.location.address?.toLowerCase().includes(searchLower) ||
          request.bloodType.toLowerCase().includes(searchLower)
        );
      }

      // Apply sorting
      filtered = sortRequests(filtered, sortBy);
      setFilteredRequests(filtered);
    }, 300),
    [sortRequests]
  );

  // Filter and sort requests
  useEffect(() => {
    if (requests.length > 0) {
      debouncedSearch(filters.search, requests, filters.sortBy);
    } else {
      setFilteredRequests([]);
    }
  }, [requests, filters.search, filters.sortBy, debouncedSearch]);

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, search: query }));
  };

  const handleRespond = async (requestId: string) => {
    try {
      const response = await apiService.respondToRequest(requestId);
      if (response.success) {
        // Refresh the list to update response count
        refreshRequests();
      }
    } catch (error) {
      console.error('Failed to respond to request:', error);
    }
  };

  return (
    <ProtectedRoute locale={locale}>
      <div className="min-h-screen bg-gray-50">
        <Navbar locale={locale} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('bloodRequests.title')}
              </h1>
              <p className="text-gray-600 mt-2">
                {t('bloodRequests.subtitle')}
              </p>
            </div>

            <div className="mt-4 sm:mt-0 flex space-x-3">
              <Button
                variant="outline"
                onClick={refreshRequests}
                disabled={loading}
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? t('common.loading') : t('common.refresh')}
              </Button>

              <Link href={`/${locale}/demandes/creer`}>
                <Button className="bg-red-500 hover:bg-red-600">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('bloodRequests.create.title')}
                </Button>
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <FilterBar
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onSearch={handleSearch}
              activeCount={filteredRequests.length}
            />
          </div>

          {/* Content */}
          <ApiErrorBoundary>
            {error ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('errors.title')}
                </h3>
                <p className="text-gray-600 mb-4">{error.message}</p>
                <Button onClick={refreshRequests} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('common.retry')}
                </Button>
              </div>
            ) : loading ? (
              <BloodRequestListSkeleton />
            ) : filteredRequests.length > 0 ? (
            <div className="space-y-6">
              {filteredRequests.map((request) => (
                <BloodRequestCard
                  key={request._id}
                  request={request}
                  locale={locale}
                  onRespond={handleRespond}
                />
              ))}

              {/* Load More Button (for pagination) */}
              {filteredRequests.length >= 10 && (
                <div className="text-center py-8">
                  <Button variant="outline">
                    {t('bloodRequests.loadMore')}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('bloodRequests.noRequestsFound')}
              </h3>
              <p className="text-gray-600 mb-6">
                {filters.search || filters.bloodType !== 'all' || filters.urgency !== 'all'
                  ? t('bloodRequests.tryModifyFilters')
                  : t('bloodRequests.noActiveRequests')
                }
              </p>
              <div className="space-x-3">
                {(filters.search || filters.bloodType !== 'all' || filters.urgency !== 'all') && (
                  <Button
                    variant="outline"
                    onClick={() => handleFiltersChange({
                      search: '',
                      bloodType: 'all',
                      urgency: 'all',
                      status: 'active',
                      maxDistance: 50,
                      sortBy: 'newest'
                    })}
                  >
                    {t('common.clear')}
                  </Button>
                )}
                <Link href={`/${locale}/demandes/creer`}>
                  <Button className="bg-red-500 hover:bg-red-600">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('bloodRequests.create.title')}
                  </Button>
                </Link>
              </div>
            </div>
          )}
          </ApiErrorBoundary>
        </main>
      </div>
    </ProtectedRoute>
  );
}