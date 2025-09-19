'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle, RefreshCw, X, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useErrorHandler, ErrorInfo } from '@/lib/error-handler';

interface ErrorAlertProps {
  error: any;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  showIcon?: boolean;
  showTitle?: boolean;
  variant?: 'default' | 'destructive';
}

export default function ErrorAlert({
  error,
  onRetry,
  onDismiss,
  className,
  showIcon = true,
  showTitle = true,
  variant = 'destructive'
}: ErrorAlertProps) {
  const t = useTranslations();
  const { parseError, isRetryable } = useErrorHandler(t);

  if (!error) return null;

  const errorInfo: ErrorInfo = parseError(error);
  const canRetry = isRetryable(error);

  const getErrorIcon = () => {
    switch (errorInfo.type) {
      case 'api':
        if (errorInfo.code === 'NETWORK_ERROR' || errorInfo.code === 'OFFLINE') {
          return <WifiOff className="h-4 w-4" />;
        }
        return <Wifi className="h-4 w-4" />;
      case 'location':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getErrorTitle = () => {
    switch (errorInfo.type) {
      case 'api':
        return t('errors.api.title');
      case 'location':
        return t('errors.location.denied');
      case 'validation':
        return t('errors.form.validationFailed');
      case 'authentication':
        return t('errors.authentication.loginFailed');
      case 'profile':
        return t('errors.profile.incomplete');
      default:
        return t('errors.general.title');
    }
  };

  return (
    <Alert variant={variant} className={className}>
      {showIcon && getErrorIcon()}
      <div className="flex-1">
        {showTitle && (
          <AlertTitle className="mb-1">
            {getErrorTitle()}
          </AlertTitle>
        )}
        <AlertDescription className="text-sm">
          {errorInfo.message}
        </AlertDescription>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-3">
          {canRetry && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="h-8 px-3"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              {t('errors.general.retry')}
            </Button>
          )}
        </div>
      </div>

      {/* Dismiss button */}
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="h-8 w-8 p-0 hover:bg-transparent"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </Alert>
  );
}