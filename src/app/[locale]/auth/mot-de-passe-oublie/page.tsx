'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import apiService from '@/lib/api';

export default function ForgotPasswordPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const t = useTranslations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await apiService.forgotPassword(phone);

      if (response.success) {
        setSuccess(true);
        // Redirect to password reset page after short delay
        setTimeout(() => {
          router.push(`/${locale}/auth/reinitialiser-mot-de-passe?phone=${encodeURIComponent(phone)}`);
        }, 2000);
      } else {
        setError(response.message || 'Erreur lors de l\'envoi du code');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur réseau');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {t('auth.forgotPassword.codeSent')}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {t('auth.forgotPassword.codeSentMessage')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-500 mb-4">
              {t('auth.forgotPassword.redirecting')}
            </p>
            <Link href={`/${locale}/auth/reinitialiser-mot-de-passe?phone=${encodeURIComponent(phone)}`}>
              <Button className="w-full">
                {t('auth.forgotPassword.continue')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            {t('auth.forgotPassword.title')}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {t('auth.forgotPassword.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">{t('auth.forgotPassword.phone')}</Label>
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

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? t('auth.forgotPassword.sending') : t('auth.forgotPassword.sendCode')}
            </Button>

            <div className="text-center space-y-2">
              <Link
                href={`/${locale}/auth/connexion`}
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                {t('auth.forgotPassword.backToLogin')}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}