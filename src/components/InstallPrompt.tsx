'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface InstallPromptProps {
  showManual?: boolean;
  onManualTrigger?: () => void;
}

export default function InstallPrompt({ showManual = false, onManualTrigger }: InstallPromptProps = {}) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const t = useTranslations('landing.install');

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);

      // Show our custom install prompt after 3 seconds or immediately if manual
      if (!showManual) {
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
    if (onManualTrigger) {
      onManualTrigger();
    }
  };

  const showManualPrompt = () => {
    if (isInstallable && !sessionStorage.getItem('installPromptDismissed')) {
      setShowInstallPrompt(true);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('installPromptDismissed', 'true');
  };

  // For manual mode, provide the trigger function but don't show the popup automatically
  if (showManual) {
    return { isInstallable, showManualPrompt, deferredPrompt };
  }

  // Don't show if dismissed in this session
  if (sessionStorage.getItem('installPromptDismissed')) {
    return null;
  }

  if (!showInstallPrompt || !isInstallable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
      <Card className="bg-white shadow-lg border-l-4 border-l-red-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-red-500 p-2 rounded-full">
                <Smartphone className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-sm font-semibold">{t('title')}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-xs text-gray-600">
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex space-x-2">
            <Button
              onClick={handleInstall}
              size="sm"
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              <Download className="h-3 w-3 mr-1" />
              {t('install')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDismiss}
              className="flex-1"
            >
              {t('later')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}