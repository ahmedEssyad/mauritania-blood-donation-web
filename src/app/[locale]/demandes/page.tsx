'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import BloodRequestCard from '@/components/blood-requests/BloodRequestCard';
import FilterBar from '@/components/blood-requests/FilterBar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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

export default function BloodRequestsPage({ params: { locale } }: { params: { locale: string } }) {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  // Load blood requests
  const loadRequests = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const params: any = {};

      // Add location if available
      if (userLocation) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
        params.radius = filters.maxDistance;
      }

      // Add filters
      if (filters.bloodType !== 'all') params.bloodType = filters.bloodType;
      if (filters.urgency !== 'all') params.urgency = filters.urgency;
      if (filters.status !== 'all') params.status = filters.status;

      const response = await apiService.getBloodRequests(params);

      if (response.success) {
        let requestsData = response.data.requests || [];

        // Apply sorting
        requestsData = sortRequests(requestsData, filters.sortBy);

        setRequests(requestsData);
        setError(null);
      } else {
        setError(response.message || 'Failed to load requests');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userLocation, filters.maxDistance, filters.bloodType, filters.urgency, filters.status, filters.sortBy]);

  // Sort requests
  const sortRequests = (requests: BloodRequest[], sortBy: string) => {
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
  };

  // Filter requests
  useEffect(() => {
    let filtered = [...requests];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(request =>
        request.description?.toLowerCase().includes(searchLower) ||
        request.medicalInfo?.hospitalName?.toLowerCase().includes(searchLower) ||
        request.location.address?.toLowerCase().includes(searchLower) ||
        request.bloodType.toLowerCase().includes(searchLower)
      );
    }

    setFilteredRequests(filtered);
  }, [requests, filters.search]);

  // Load data on mount and filter changes
  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

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
        loadRequests(true);
      }
    } catch (error) {
      console.error('Failed to respond to request:', error);
    }
  };

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="p-6 border rounded-lg">
          <div className="flex items-start space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="flex space-x-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

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
                Trouvez et répondez aux demandes de sang dans votre région
              </p>
            </div>

            <div className="mt-4 sm:mt-0 flex space-x-3">
              <Button
                variant="outline"
                onClick={() => loadRequests(true)}
                disabled={refreshing}
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? t('common.loading') : t('common.refresh')}
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
          {error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Erreur de chargement
              </h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => loadRequests()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('common.retry')}
              </Button>
            </div>
          ) : loading ? (
            <LoadingSkeleton />
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
                    Charger plus de demandes
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune demande trouvée
              </h3>
              <p className="text-gray-600 mb-6">
                {filters.search || filters.bloodType !== 'all' || filters.urgency !== 'all'
                  ? 'Essayez de modifier vos filtres de recherche'
                  : 'Il n\'y a pas de demandes de sang actives dans votre région'
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
        </main>
      </div>
    </ProtectedRoute>
  );
}