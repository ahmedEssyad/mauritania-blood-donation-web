'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import notificationService from '@/lib/notifications';

interface PWAContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  notificationsEnabled: boolean;
  installApp: () => Promise<void>;
  enableNotifications: () => Promise<boolean>;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    initializePWA();
  }, []);

  const initializePWA = async () => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Initialize notification service
    try {
      await notificationService.initialize();
      setNotificationsEnabled(notificationService.isEnabled());
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('PWA installed successfully');
    });

    // Set initial online status
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  };

  const installApp = async (): Promise<void> => {
    if (!deferredPrompt) {
      console.warn('Install prompt not available');
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }

      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('Error during app installation:', error);
    }
  };

  const enableNotifications = async (): Promise<boolean> => {
    try {
      const permission = await notificationService.requestPermission();

      if (permission === 'granted') {
        setNotificationsEnabled(true);
        return true;
      } else {
        console.warn('Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      return false;
    }
  };

  const value: PWAContextType = {
    isInstallable,
    isInstalled,
    isOnline,
    notificationsEnabled,
    installApp,
    enableNotifications,
  };

  return (
    <PWAContext.Provider value={value}>
      {children}
      {/* Offline indicator */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-50 text-center">
          <span className="text-sm font-medium">
            Mode hors ligne - Certaines fonctionnalités peuvent être limitées
          </span>
        </div>
      )}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
}