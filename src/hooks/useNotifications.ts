'use client';

import { useEffect, useState } from 'react';
import notificationService from '@/lib/notifications';

interface UseNotificationsReturn {
  isSupported: boolean;
  permission: NotificationPermission;
  isEnabled: boolean;
  requestPermission: () => Promise<NotificationPermission>;
  testNotification: () => Promise<void>;
  initializeService: () => Promise<boolean>;
}

export function useNotifications(): UseNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    // Check support and current permission status
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      setIsEnabled(notificationService.isEnabled());
    }
  }, []);

  const requestPermission = async (): Promise<NotificationPermission> => {
    const newPermission = await notificationService.requestPermission();
    setPermission(newPermission);
    setIsEnabled(notificationService.isEnabled());
    return newPermission;
  };

  const testNotification = async (): Promise<void> => {
    if (permission === 'granted') {
      await notificationService.testNotification();
    }
  };

  const initializeService = async (): Promise<boolean> => {
    const initialized = await notificationService.initialize();
    setIsEnabled(notificationService.isEnabled());
    return initialized;
  };

  return {
    isSupported,
    permission,
    isEnabled,
    requestPermission,
    testNotification,
    initializeService,
  };
}