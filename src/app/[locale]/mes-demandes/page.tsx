'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ErrorAlert } from '@/components/errors';
import { BloodRequestListSkeleton } from '@/components/LoadingStates';
import { BloodRequest, RequestStatus } from '@/types';
import apiService from '@/lib/api';
import { useErrorHandler } from '@/lib/error-handler';
import {
  Plus,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Heart,
  Users,
  MapPin,
  Phone
} from 'lucide-react';
import Link from 'next/link';

interface MyRequestsData {
  requests: BloodRequest[];
  pagination: {
    current: number;
    total: number;
    count: number;
    totalRecords: number;
  };
}

function getStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE': return 'bg-green-500 text-white';
    case 'FULFILLED': return 'bg-blue-500 text-white';
    case 'CANCELLED': return 'bg-red-500 text-white';
    case 'EXPIRED': return 'bg-gray-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
}

function getUrgencyColor(urgency: string) {
  switch (urgency) {
    case 'CRITICAL': return 'bg-red-500 text-white';
    case 'HIGH': return 'bg-orange-500 text-white';
    case 'MEDIUM': return 'bg-yellow-500 text-black';
    case 'LOW': return 'bg-blue-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
}

export default function MyRequestsPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations();
  const locale = params.locale as string;

  const [activeTab, setActiveTab] = useState<RequestStatus | 'all'>('all');
  const [data, setData] = useState<MyRequestsData>({
    requests: [],
    pagination: { current: 1, total: 0, count: 0, totalRecords: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const { handleApiError } = useErrorHandler(t);

  const fetchMyRequests = useCallback(async (status?: RequestStatus) => {
    try {
      setLoading(true);
      setError(null);

      const params: any = { page: 1, limit: 20 };
      if (status && status !== 'all') {
        params.status = status;
      }

      const response = await apiService.getMyBloodRequests(params);

      if (response.success && response.data) {
        setData({
          requests: response.data.requests,
          pagination: response.data.pagination
        });
      } else {
        throw new Error(response.message || 'Failed to fetch requests');
      }
    } catch (err: any) {
      const handledError = handleApiError(err);
      setError(handledError);
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  const handleDeleteRequest = async (requestId: string) => {
    try {
      const response = await apiService.deleteBloodRequest(requestId);
      if (response.success) {
        // Refresh the list
        await fetchMyRequests(activeTab !== 'all' ? activeTab : undefined);
      } else {
        console.error('Failed to delete request:', response.message);
      }
    } catch (error) {
      console.error('Error deleting request:', error);
    }
  };

  useEffect(() => {
    fetchMyRequests(activeTab !== 'all' ? activeTab : undefined);
  }, [activeTab, fetchMyRequests]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as RequestStatus | 'all');
  };

  if (loading) return <BloodRequestListSkeleton />;

  return (
    <ProtectedRoute locale={locale}>
      <div className="min-h-screen bg-gray-50">
        <Navbar locale={locale} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('myRequests.title')}
              </h1>
              <p className="text-gray-600 mt-2">
                {t('myRequests.subtitle')}
              </p>
            </div>

            <div className="mt-4 sm:mt-0 flex space-x-3">
              <Button
                variant="outline"
                onClick={() => fetchMyRequests(activeTab !== 'all' ? activeTab : undefined)}
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

          {/* Status Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">{t('myRequests.tabs.all')}</TabsTrigger>
              <TabsTrigger value="ACTIVE">{t('myRequests.tabs.active')}</TabsTrigger>
              <TabsTrigger value="FULFILLED">{t('myRequests.tabs.fulfilled')}</TabsTrigger>
              <TabsTrigger value="CANCELLED">{t('myRequests.tabs.cancelled')}</TabsTrigger>
              <TabsTrigger value="EXPIRED">{t('myRequests.tabs.expired')}</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {error ? (
                <ErrorAlert
                  error={error}
                  onRetry={() => fetchMyRequests(activeTab !== 'all' ? activeTab : undefined)}
                  onDismiss={() => setError(null)}
                />
              ) : data.requests.length > 0 ? (
                <div className="space-y-6">
                  {data.requests.map((request) => (
                    <Card key={request._id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getStatusColor(request.status)}>
                                {t(`bloodRequests.status.${request.status.toLowerCase()}`)}
                              </Badge>
                              <Badge className={getUrgencyColor(request.urgencyLevel)}>
                                {t(`bloodRequests.urgency.${request.urgencyLevel.toLowerCase()}`)}
                              </Badge>
                            </div>
                            <CardTitle className="text-xl">
                              {t('bloodRequests.bloodTypeNeeded', { bloodType: request.bloodType })}
                            </CardTitle>
                            <CardDescription className="mt-2">
                              {request.description || t('bloodRequests.noDescription')}
                            </CardDescription>
                          </div>

                          <div className="text-right text-sm text-gray-600">
                            <div className="flex items-center gap-1 mb-1">
                              <Clock className="h-4 w-4" />
                              {new Date(request.expiresAt) < new Date() ? (
                                <span className="text-red-600 font-medium">{t('bloodRequests.expired')}</span>
                              ) : (
                                <span>
                                  {Math.max(0, Math.ceil((new Date(request.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60)))}h {t('bloodRequests.remaining')}
                                </span>
                              )}
                            </div>
                            <div>{new Date(request.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          {/* Response Count */}
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {request.respondersCount} {t('bloodRequests.responses')}
                            </span>
                          </div>

                          {/* Contact Info */}
                          {request.contactPhone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{request.contactPhone}</span>
                            </div>
                          )}

                          {/* Location Info */}
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {request.location?.address || t('common.location')}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                          <Link href={`/${locale}/demandes/${request._id}`} className="flex-1">
                            <Button variant="outline" className="w-full">
                              {t('bloodRequests.details.viewDetails')}
                            </Button>
                          </Link>

                          {request.status === 'ACTIVE' && request.respondersCount === 0 && (
                            <Button
                              onClick={() => handleDeleteRequest(request._id)}
                              variant="destructive"
                              className="flex-1 sm:flex-none"
                            >
                              {t('common.delete')}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {activeTab === 'all'
                      ? t('myRequests.noRequests')
                      : t('myRequests.noRequestsWithStatus', { status: activeTab.toLowerCase() })
                    }
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {t('myRequests.createFirstRequest')}
                  </p>
                  <Link href={`/${locale}/demandes/creer`}>
                    <Button className="bg-red-500 hover:bg-red-600">
                      <Plus className="h-4 w-4 mr-2" />
                      {t('bloodRequests.create.title')}
                    </Button>
                  </Link>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ProtectedRoute>
  );
}