'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, MapPin, Shield, Zap, Globe, Download } from 'lucide-react';
import InstallPrompt from '@/components/InstallPrompt';
import Link from 'next/link';
import { useInstallPWA } from '@/hooks/useInstallPWA';

export default function HomePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { isAuthenticated, loading } = useAuth();
  const t = useTranslations('landing');
  const { isInstallable, installPWA } = useInstallPWA();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace(`/${locale}/dashboard`);
    }
  }, [isAuthenticated, loading, router, locale]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white">
      <InstallPrompt />

      {/* Navigation Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-red-500" />
            <span className="text-2xl font-bold text-red-500">Munkidh</span>
          </div>

          {/* Language Selector */}
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4 text-gray-600" />
            <div className="flex space-x-1">
              <Link href="/fr" locale="fr">
                <Button
                  variant={locale === 'fr' ? 'default' : 'outline'}
                  size="sm"
                  className={locale === 'fr' ? 'bg-red-500 hover:bg-red-600' : ''}
                >
                  Français
                </Button>
              </Link>
              <Link href="/ar" locale="ar">
                <Button
                  variant={locale === 'ar' ? 'default' : 'outline'}
                  size="sm"
                  className={locale === 'ar' ? 'bg-red-500 hover:bg-red-600' : ''}
                >
                  العربية
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            {t('hero.title')}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/${locale}/auth/inscription`}>
              <Button size="lg" className="bg-red-500 hover:bg-red-600 text-white px-8 py-3">
                {t('hero.cta')}
              </Button>
            </Link>
            <Link href={`/${locale}/auth/connexion`}>
              <Button variant="outline" size="lg" className="px-8 py-3">
                {t('hero.login')}
              </Button>
            </Link>
          </div>

          {/* Install PWA Button */}
          {isInstallable && (
            <div className="mt-6">
              <Button
                onClick={installPWA}
                variant="outline"
                size="lg"
                className="px-6 py-3 border-red-200 text-red-600 hover:bg-red-50"
              >
                <Download className="h-5 w-5 mr-2" />
                {t('install.install')}
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t('features.title')}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-red-500" />
              </div>
              <CardTitle className="text-xl font-semibold">
                {t('features.emergency.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                {t('features.emergency.description')}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-red-500" />
              </div>
              <CardTitle className="text-xl font-semibold">
                {t('features.location.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                {t('features.location.description')}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-red-500" />
              </div>
              <CardTitle className="text-xl font-semibold">
                {t('features.secure.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                {t('features.secure.description')}
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Heart className="h-6 w-6 text-red-500" />
            <span className="text-lg font-semibold text-gray-800">Munkidh</span>
          </div>
          <p className="text-gray-600">
            {locale === 'fr'
              ? 'Ensemble pour sauver des vies en Mauritanie'
              : 'معاً لإنقاذ الأرواح في موريتانيا'
            }
          </p>
        </div>
      </footer>
    </div>
  );
}