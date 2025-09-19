'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';
import { useErrorHandler } from '@/lib/error-handler';

interface InlineErrorProps {
  error?: any;
  fieldName?: string;
  className?: string;
  showIcon?: boolean;
}

export default function InlineError({
  error,
  fieldName,
  className = '',
  showIcon = true
}: InlineErrorProps) {
  const t = useTranslations();
  const { getErrorMessage, getErrorType } = useErrorHandler(t);

  if (!error) return null;

  const errorMessage = getErrorMessage(error);
  const errorType = getErrorType(error);

  return (
    <div className={`flex items-center gap-1 text-sm text-red-600 mt-1 ${className}`}>
      {showIcon && <AlertCircle className="h-3 w-3 flex-shrink-0" />}
      <span>{errorMessage}</span>
    </div>
  );
}