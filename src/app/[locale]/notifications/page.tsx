'use client';

import { useEffect, useState } from 'react';
import React from 'react';
import { useTranslations } from 'next-intl';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, Trash2, RefreshCw } from 'lucide-react';
import apiService from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  _id: string;
  type: string;
  title: string;
  body: string;
  opened: boolean;
  createdAt: string;
  requestId?: {
    bloodType: string;
    urgencyLevel: string;
  };
}

export default function NotificationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = React.use(params);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const t = useTranslations();
  const { checkProfileCompletion } = useAuth();

  // Check profile completion when page loads
  useEffect(() => {
    checkProfileCompletion();
  }, [checkProfileCompletion]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const [notifResponse, countResponse] = await Promise.all([
        apiService.getNotificationHistory(),
        apiService.getUnreadCount()
      ]);

      if (notifResponse.success) {
        setNotifications(notifResponse.data.notifications || []);
      }

      if (countResponse.success) {
        setUnreadCount(countResponse.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await apiService.markNotificationRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, opened: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, opened: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  return (
    <ProtectedRoute locale={locale}>
      <div className="min-h-screen bg-gray-50">
        <Navbar locale={locale} />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-3">
              <Bell className="h-8 w-8 text-blue-500" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {t('navigation.notifications')}
                </h1>
                <p className="text-gray-600">
                  {unreadCount > 0 && t('notifications.unreadCount', { count: unreadCount })}
                </p>
              </div>
            </div>

            <div className="space-x-2">
              <Button variant="outline" onClick={loadNotifications}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('notifications.refresh')}
              </Button>
              {unreadCount > 0 && (
                <Button onClick={markAllAsRead}>
                  <Check className="h-4 w-4 mr-2" />
                  {t('notifications.markAllRead')}
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <Card
                  key={notification._id}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${
                    !notification.opened ? 'border-blue-200 bg-blue-50' : ''
                  }`}
                  onClick={() => !notification.opened && markAsRead(notification._id)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium text-gray-900">
                            {notification.title}
                          </h3>
                          {!notification.opened && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              {t('notifications.new')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-600 mb-2">{notification.body}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(notification.createdAt).toLocaleDateString(locale === 'ar' ? 'ar' : 'fr-FR')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">{t('notifications.empty')}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}