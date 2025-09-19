'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets } from 'lucide-react';
import Link from 'next/link';
import apiService from '@/lib/api';

export default function RegisterPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [formData, setFormData] = useState({
    phone: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const t = useTranslations();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!formData.phone.trim()) {
      setError(t('errors.phoneRequired'));
      setIsLoading(false);
      return;
    }

    try {
      // Send OTP first
      await apiService.sendOTP(formData.phone);

      // Store phone for registration flow
      localStorage.setItem('registrationPhone', formData.phone);
      router.push(`/${locale}/auth/verification?phone=${encodeURIComponent(formData.phone)}&type=register`);
    } catch (err: any) {
      setError(err.message || t('errors.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-red-500 p-3 rounded-full">
              <Droplets className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {t('auth.register.title')}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {t('auth.register.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">{t('auth.register.phone')}</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+222 XX XX XX XX"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                {t('auth.register.phoneHelp')}
              </p>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-red-500 hover:bg-red-600"
              disabled={isLoading || !formData.phone.trim()}
            >
              {isLoading ? t('common.loading') : t('auth.register.sendVerificationCode')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {t('auth.register.alreadyHaveAccount')}{' '}
              <Link
                href={`/${locale}/auth/connexion`}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                {t('auth.register.login')}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}