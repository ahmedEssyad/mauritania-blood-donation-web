'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import apiService from '@/lib/api';
import { ErrorAlert } from '@/components/errors';

export default function LoginPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const router = useRouter();
  const { login } = useAuth();
  const t = useTranslations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(phone, password);

      // Vérifier le statut de completion du profil
      try {
        const profileStatus = await apiService.getProfileCompletionStatus();
        if (profileStatus.success && !profileStatus.data.isProfileComplete) {
          router.push(`/${locale}/auth/completer-profil`);
        } else {
          router.push(`/${locale}/dashboard`);
        }
      } catch (profileError) {
        // En cas d'erreur de vérification du profil, rediriger vers le dashboard
        console.warn('Profile completion check failed:', profileError);
        router.push(`/${locale}/dashboard`);
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-red-500 p-3 rounded-full">
              <Droplets className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {t('auth.login.title')}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {t('common.appName')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">{t('auth.login.phone')}</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+222 XX XX XX XX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.login.password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <ErrorAlert
                error={error}
                onRetry={() => setError(null)}
                onDismiss={() => setError(null)}
                className="mb-4"
              />
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? t('common.loading') : t('auth.login.submit')}
            </Button>

            <div className="text-center space-y-2">
              <Link
                href={`/${locale}/auth/mot-de-passe-oublie`}
                className="text-sm text-red-600 hover:text-red-700"
              >
                {t('auth.login.forgotPassword')}
              </Link>
              <div className="text-sm text-gray-600">
                {t('auth.login.noAccount')}{' '}
                <Link
                  href={`/${locale}/auth/inscription`}
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  {t('auth.login.register')}
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}