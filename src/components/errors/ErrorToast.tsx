'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle, CheckCircle, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useErrorHandler, ErrorInfo } from '@/lib/error-handler';

interface ErrorToastProps {
  error: any;
  onRetry?: () => void;
  onDismiss?: () => void;
  autoHide?: boolean;
  duration?: number;
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
}

export default function ErrorToast({
  error,
  onRetry,
  onDismiss,
  autoHide = true,
  duration = 5000,
  position = 'top-right'
}: ErrorToastProps) {
  const t = useTranslations();
  const { parseError, isRetryable } = useErrorHandler(t);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHide && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss?.(), 300); // Wait for animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoHide, duration, onDismiss]);

  if (!error || !isVisible) return null;

  const errorInfo: ErrorInfo = parseError(error);
  const canRetry = isRetryable(error);

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'fixed top-4 right-4 z-50';
      case 'top-center':
        return 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50';
      case 'top-left':
        return 'fixed top-4 left-4 z-50';
      case 'bottom-right':
        return 'fixed bottom-4 right-4 z-50';
      case 'bottom-center':
        return 'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50';
      case 'bottom-left':
        return 'fixed bottom-4 left-4 z-50';
      default:
        return 'fixed top-4 right-4 z-50';
    }
  };

  const getToastColor = () => {
    switch (errorInfo.type) {
      case 'api':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'validation':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'location':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-red-50 border-red-200 text-red-800';
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss?.(), 300);
  };

  return (
    <div className={`${getPositionClasses()} max-w-sm w-full transition-all duration-300 ${
      isVisible ? 'animate-in slide-in-from-top-2' : 'animate-out slide-out-to-top-2'
    }`}>
      <div className={`p-4 rounded-lg border shadow-lg ${getToastColor()}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {errorInfo.message}
            </p>

            {canRetry && onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="mt-2 h-7 px-2 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                {t('errors.general.retry')}
              </Button>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 hover:bg-transparent"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}