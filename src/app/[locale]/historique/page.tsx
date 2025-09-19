'use client';

import { useEffect, useState } from 'react';
import React from 'react';
import { useTranslations } from 'next-intl';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  History,
  Heart,
  Calendar,
  MapPin,
  Star,
  User,
  Droplets,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr, ar } from 'date-fns/locale';
import apiService from '@/lib/api';
import { DonationRecord } from '@/types';

export default function DonationHistoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = React.use(params);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'pending'>('all');

  const t = useTranslations();

  useEffect(() => {
    loadDonationHistory();
  }, []);

  const loadDonationHistory = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const response = await apiService.getDonationHistory();

      if (response.success) {
        // Transform API response to match our interface
        const donationsData = response.data.donations || [];
        setDonations(donationsData);
        setError(null);
      } else {
        setError(t('history.loadingError'));
      }
    } catch (err: any) {
      setError(err.message || t('history.networkError'));
      console.error('Failed to load donation history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'disputed':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return t('history.status.confirmed');
      case 'pending':
        return t('history.status.pending');
      case 'disputed':
        return t('history.status.disputed');
      case 'cancelled':
        return t('history.status.cancelled');
      default:
        return status;
    }
  };

  const filteredDonations = donations.filter(donation => {
    if (filterStatus === 'all') return true;
    return donation.status === filterStatus;
  });

  const DonationCard = ({ donation }: { donation: DonationRecord }) => {
    const timeAgo = formatDistanceToNow(new Date(donation.donationDate), {
      addSuffix: true,
      locale: locale === 'ar' ? ar : fr
    });

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-red-500 p-2 rounded-full">
                <Droplets className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {t('history.donation.bloodDonation')} • {donation.donorUserId?.bloodType || donation.requesterUserId?.bloodType}
                </div>
                <div className="text-sm text-gray-500">{timeAgo}</div>
              </div>
            </div>
            <Badge className={getStatusColor(donation.status)}>
              {getStatusText(donation.status)}
            </Badge>
          </div>

          {/* Request Description */}
          {donation.request?.description && (
            <p className="text-sm text-gray-600 mb-3">
              {donation.request.description}
            </p>
          )}

          {/* Location and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {donation.location?.address && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{donation.location.address}</span>
              </div>
            )}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{new Date(donation.donationDate).toLocaleDateString(locale === 'ar' ? 'ar-MR' : 'fr-FR')}</span>
            </div>
          </div>

          {/* Other Party Info */}
          {donation.otherParty && (
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
              <User className="h-4 w-4" />
              <span>
                {donation.userRole === 'donor' ? t('history.donation.requester') : t('history.donation.donor')}: {donation.otherParty.name || t('history.donation.anonymous')}
              </span>
            </div>
          )}

          {/* Ratings */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center space-x-4">
              {donation.donorRating && (
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-gray-600">
                    {donation.donorRating}/5
                  </span>
                </div>
              )}
            </div>

            {donation.status === 'pending' && (
              <div className="text-xs text-gray-500">
                {t('history.donation.confirmationRequired')} {new Date(donation.confirmationDeadline).toLocaleDateString(locale === 'ar' ? 'ar-MR' : 'fr-FR')}
              </div>
            )}
          </div>

          {/* Notes */}
          {donation.notes && (
            <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-700">
              <strong>{t('history.donation.notes')}:</strong> {donation.notes}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <ProtectedRoute locale={locale}>
      <div className="min-h-screen bg-gray-50">
        <Navbar locale={locale} />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="bg-green-500 p-3 rounded-full">
                <History className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {t('navigation.history')}
                </h1>
                <p className="text-gray-600 mt-1">
                  {t('history.subtitle')}
                </p>
              </div>
            </div>

            <div className="mt-4 sm:mt-0 flex space-x-3">
              <Button
                variant="outline"
                onClick={() => loadDonationHistory(true)}
                disabled={refreshing}
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? t('history.refreshing') : t('common.refresh')}
              </Button>

              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                {t('history.export')}
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <Tabs value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <TabsList>
                <TabsTrigger value="all">{t('history.tabs.all')}</TabsTrigger>
                <TabsTrigger value="confirmed">{t('history.tabs.confirmed')}</TabsTrigger>
                <TabsTrigger value="pending">{t('history.tabs.pending')}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Heart className="h-8 w-8 text-red-500 mr-4" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t('history.stats.totalDonations')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {donations.filter(d => d.status === 'confirmed').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-blue-500 mr-4" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t('history.stats.thisYear')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {donations.filter(d =>
                        d.status === 'confirmed' &&
                        new Date(d.donationDate).getFullYear() === new Date().getFullYear()
                      ).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Star className="h-8 w-8 text-yellow-500 mr-4" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t('history.stats.averageRating')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {donations.length > 0
                        ? (donations.reduce((acc, d) => acc + (d.donorRating || 0), 0) / donations.length).toFixed(1)
                        : '0.0'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          {error ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-red-500 mb-4">
                  <History className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('history.error.title')}
                </h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={() => loadDonationHistory()} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('history.error.retry')}
                </Button>
              </CardContent>
            </Card>
          ) : loading ? (
            <LoadingSkeleton />
          ) : filteredDonations.length > 0 ? (
            <div className="space-y-6">
              {filteredDonations.map((donation) => (
                <DonationCard key={donation._id} donation={donation} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {filterStatus === 'all'
                    ? t('history.empty.noHistory')
                    : filterStatus === 'confirmed' ? t('history.empty.noConfirmed') : t('history.empty.noPending')
                  }
                </h3>
                <p className="text-gray-600 mb-6">
                  {filterStatus === 'all'
                    ? t('history.empty.startDonating')
                    : t('history.empty.changeFilter')
                  }
                </p>
                {filterStatus !== 'all' && (
                  <Button
                    variant="outline"
                    onClick={() => setFilterStatus('all')}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    {t('history.empty.viewAllDonations')}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}