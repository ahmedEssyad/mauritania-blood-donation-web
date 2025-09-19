'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Heart,
  Users,
  Clock,
  Star,
  Plus,
  Search,
  History,
  MapPin,
  Droplets
} from 'lucide-react';
import Link from 'next/link';
import apiService from '@/lib/api';
import { BloodRequest, UserStats } from '@/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentRequests, setRecentRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const { user, checkProfileCompletion } = useAuth();
  const t = useTranslations();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'fr'; // Extract locale from pathname


  useEffect(() => {
    loadDashboardData();
    // Vérifier la completion du profil au chargement du dashboard
    checkProfileCompletion();
  }, [checkProfileCompletion]);

  const loadDashboardData = async () => {
    try {
      const [statsResponse, requestsResponse] = await Promise.all([
        apiService.getUserStats(),
        apiService.getBloodRequests({ limit: 5 })
      ]);

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }

      if (requestsResponse.success) {
        setRecentRequests(requestsResponse.data.requests || []);
        // Handle rate limiting gracefully
        if (requestsResponse.data.rateLimited) {
          console.warn('Blood requests rate limited - showing empty state');
        }
      }
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      // Handle rate limiting and other API errors gracefully
      if (error.response?.status === 429) {
        console.warn('Dashboard data rate limited - user can still access other features');
      }
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: t('dashboard.quickActions.createRequest'),
      description: t('dashboard.quickActions.createRequestDesc'),
      href: `/${locale}/demandes/creer`,
      icon: Plus,
      color: 'bg-red-500',
    },
    {
      title: t('dashboard.quickActions.findDonors'),
      description: t('dashboard.quickActions.findDonorsDesc'),
      href: `/${locale}/demandes`,
      icon: Search,
      color: 'bg-blue-500',
    },
    {
      title: t('dashboard.quickActions.viewHistory'),
      description: t('dashboard.quickActions.viewHistoryDesc'),
      href: `/${locale}/historique`,
      icon: History,
      color: 'bg-green-500',
    },
  ];

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  return (
    <ProtectedRoute locale={locale}>
      <div className="min-h-screen bg-gray-50">
        <Navbar locale={locale} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {t('dashboard.title')}
            </h1>
            <p className="text-gray-600 mt-2">
              {t('dashboard.welcome', { name: user?.name || '' })}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Heart className="h-8 w-8 text-red-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {t('dashboard.stats.totalDonations')}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.totalDonations || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {t('dashboard.stats.thisYear')}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.thisYearDonations || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Star className="h-8 w-8 text-yellow-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {t('dashboard.stats.rating')}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.avgRating?.toFixed(1) || '0.0'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {t('dashboard.stats.responses')}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.totalResponses || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{t('dashboard.quickActions.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Link key={index} href={action.href}>
                      <div className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className={`flex-shrink-0 p-3 rounded-full ${action.color}`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-sm font-medium text-gray-900">
                            {action.title}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Requests */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('dashboard.recentRequests.title')}</CardTitle>
                <CardDescription>
                  {t('dashboard.recentRequests.description')}
                </CardDescription>
              </div>
              <Link href={`/${locale}/demandes`}>
                <Button variant="outline" size="sm">
                  {t('dashboard.recentRequests.viewAll')}
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-500">{t('common.loading')}</p>
                </div>
              ) : recentRequests.length > 0 ? (
                <div className="space-y-4">
                  {recentRequests.map((request) => (
                    <div
                      key={request._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <Droplets className="h-6 w-6 text-red-500" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {request.bloodType} • {request.requester?.name || t('dashboard.recentRequests.hospital')}
                          </p>
                          <p className="text-sm text-gray-500">
                            {request.description || t('dashboard.recentRequests.urgentRequest')}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {request.distance ? `${request.distance}km` : t('dashboard.recentRequests.location')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getUrgencyColor(request.urgency)}`}>
                          {t(`bloodRequests.urgency.${request.urgency}`)}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(request.createdAt).toLocaleDateString(locale === 'ar' ? 'ar' : 'fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">{t('dashboard.recentRequests.empty')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}