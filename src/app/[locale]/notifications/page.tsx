'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bell,
  BellOff,
  Droplets,
  Heart,
  User,
  Calendar,
  CheckCircle,
  RefreshCw,
  MarkAsRead
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr, ar } from 'date-fns/locale';
import apiService from '@/lib/api';
import { Notification, NotificationType } from '@/types';

export default function NotificationsPage({ params: { locale } }: { params: { locale: string } }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = useTranslations();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const response = await apiService.getNotificationHistory();

      if (response.success) {
        setNotifications(response.data.notifications || []);
        setError(null);
      } else {
        setError('Erreur lors du chargement des notifications');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur réseau');
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await apiService.markNotificationRead(notificationId);

      // Update local state
      setNotifications(notifications.map(notification =>
        notification._id === notificationId
          ? { ...notification, isRead: true, readAt: new Date().toISOString() }
          : notification
      ));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    setMarkingAllRead(true);

    try {
      await apiService.markAllNotificationsRead();

      // Update local state
      setNotifications(notifications.map(notification => ({
        ...notification,
        isRead: true,
        readAt: notification.readAt || new Date().toISOString()
      })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    } finally {
      setMarkingAllRead(false);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'blood_request_created':
        return <Droplets className="h-5 w-5 text-red-500" />;
      case 'blood_request_response':
        return <Heart className="h-5 w-5 text-blue-500" />;
      case 'donor_selected':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'donation_confirmed':
        return <Heart className="h-5 w-5 text-green-500" />;
      case 'donation_received':
        return <CheckCircle className="h-5 w-5 text-purple-500" />;
      case 'eligibility_reminder':
        return <Calendar className="h-5 w-5 text-orange-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationTypeText = (type: NotificationType) => {
    const translations = {
      blood_request_created: 'Nouvelle demande de sang',
      blood_request_response: 'Réponse à votre demande',
      donor_selected: 'Donneur sélectionné',
      donation_confirmed: 'Don confirmé',
      donation_received: 'Don reçu',
      eligibility_reminder: 'Rappel d\'éligibilité'
    };

    return translations[type] || type;
  };

  const NotificationCard = ({ notification }: { notification: Notification }) => {
    const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
      addSuffix: true,
      locale: locale === 'ar' ? ar : fr
    });

    return (
      <Card
        className={`hover:shadow-md transition-shadow cursor-pointer ${
          !notification.isRead ? 'bg-blue-50 border-blue-200' : ''
        }`}
        onClick={() => !notification.isRead && markAsRead(notification._id)}
      >
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              {getNotificationIcon(notification.type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </h3>
                    {!notification.isRead && (
                      <Badge className="bg-blue-100 text-blue-800 text-xs">
                        Nouveau
                      </Badge>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-gray-600">
                    {notification.message}
                  </p>

                  <div className="mt-2 flex items-center space-x-4">
                    <span className="text-xs text-gray-500">
                      {getNotificationTypeText(notification.type)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {timeAgo}
                    </span>
                  </div>
                </div>

                <div className="ml-4 flex-shrink-0">
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
                </div>
              </div>

              {/* Action buttons for specific notification types */}
              {notification.data?.requestId && (
                <div className="mt-3 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Navigate to request details
                      window.location.href = `/${locale}/demandes/${notification.data.requestId}`;
                    }}
                  >
                    Voir la demande
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Skeleton className="h-5 w-5 rounded" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-full mb-3" />
                <div className="flex space-x-4">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <ProtectedRoute locale={locale}>
      <div className="min-h-screen bg-gray-50">
        <Navbar locale={locale} />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-500 p-3 rounded-full relative">
                <Bell className="h-8 w-8 text-white" />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {t('notifications.title')}
                </h1>
                <p className="text-gray-600 mt-1">
                  {unreadCount > 0
                    ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
                    : 'Toutes les notifications sont lues'
                  }
                </p>
              </div>
            </div>

            <div className="mt-4 sm:mt-0 flex space-x-3">
              <Button
                variant="outline"
                onClick={() => loadNotifications(true)}
                disabled={refreshing}
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Actualisation...' : 'Actualiser'}
              </Button>

              {unreadCount > 0 && (
                <Button
                  onClick={markAllAsRead}
                  disabled={markingAllRead}
                  size="sm"
                >
                  {markingAllRead ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Marquage...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {t('notifications.markAllRead')}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          {error ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BellOff className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Erreur de chargement
                </h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={() => loadNotifications()} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réessayer
                </Button>
              </CardContent>
            </Card>
          ) : loading ? (
            <LoadingSkeleton />
          ) : notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <NotificationCard
                  key={notification._id}
                  notification={notification}
                />
              ))}

              {/* Load More Button */}
              {notifications.length >= 20 && (
                <div className="text-center py-8">
                  <Button variant="outline">
                    Charger plus de notifications
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <BellOff className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('notifications.empty')}
                </h3>
                <p className="text-gray-600 mb-6">
                  Vous recevrez des notifications lorsque des donneurs répondront à vos demandes ou lorsque de nouvelles demandes seront créées dans votre région.
                </p>
                <Button variant="outline">
                  <Bell className="h-4 w-4 mr-2" />
                  Configurer les notifications
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}