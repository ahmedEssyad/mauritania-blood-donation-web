'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useErrorHandler, ErrorInfo } from '@/lib/error-handler';
import Link from 'next/link';

interface FullPageErrorProps {
  error: any;
  onRetry?: () => void;
  onGoHome?: () => void;
  onGoBack?: () => void;
  showActions?: boolean;
  locale?: string;
}

export default function FullPageError({
  error,
  onRetry,
  onGoHome,
  onGoBack,
  showActions = true,
  locale = 'fr'
}: FullPageErrorProps) {
  const t = useTranslations();
  const { parseError, isRetryable } = useErrorHandler(t);

  if (!error) return null;

  const errorInfo: ErrorInfo = parseError(error);
  const canRetry = isRetryable(error);

  const getErrorTitle = () => {
    switch (errorInfo.type) {
      case 'api':
        if (errorInfo.code === 'NETWORK_ERROR' || errorInfo.code === 'OFFLINE') {
          return t('errors.api.offline');
        }
        return t('errors.api.title');
      case 'authentication':
        return t('errors.authentication.tokenExpired');
      case 'profile':
        return t('errors.profile.incomplete');
      default:
        return t('errors.general.title');
    }
  };

  const getErrorDescription = () => {
    switch (errorInfo.type) {
      case 'api':
        return t('errors.api.description');
      case 'authentication':
        return t('errors.authentication.tokenExpired');
      default:
        return t('errors.general.description');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-red-100 p-3 rounded-full">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            {getErrorTitle()}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {errorInfo.message}
          </CardDescription>
        </CardHeader>

        {showActions && (
          <CardContent className="space-y-3">
            {/* Retry button */}
            {canRetry && onRetry && (
              <Button
                onClick={onRetry}
                className="w-full"
                variant="default"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('errors.general.retry')}
              </Button>
            )}

            {/* Go Home button */}
            {onGoHome ? (
              <Button
                onClick={onGoHome}
                className="w-full"
                variant="outline"
              >
                <Home className="h-4 w-4 mr-2" />
                {t('navigation.dashboard')}
              </Button>
            ) : (
              <Link href={`/${locale}/dashboard`}>
                <Button className="w-full" variant="outline">
                  <Home className="h-4 w-4 mr-2" />
                  {t('navigation.dashboard')}
                </Button>
              </Link>
            )}

            {/* Go Back button */}
            {onGoBack && (
              <Button
                onClick={onGoBack}
                className="w-full"
                variant="ghost"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('common.back')}
              </Button>
            )}

            {/* Additional error details for development */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 p-3 bg-gray-100 rounded-md text-xs">
                <summary className="cursor-pointer font-medium text-gray-700">
                  Détails de l'erreur (développement)
                </summary>
                <pre className="mt-2 text-gray-600 whitespace-pre-wrap">
                  {JSON.stringify(errorInfo, null, 2)}
                </pre>
              </details>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}