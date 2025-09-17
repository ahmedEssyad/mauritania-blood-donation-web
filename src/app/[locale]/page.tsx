'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';

export default function HomePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { isAuthenticated, loading } = useAuth();
  const t = useTranslations('common');

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.replace(`/${locale}/dashboard`);
      } else {
        router.replace(`/${locale}/auth/connexion`);
      }
    }
  }, [isAuthenticated, loading, router, locale]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">{t('loading')}</p>
      </div>
    </div>
  );
}