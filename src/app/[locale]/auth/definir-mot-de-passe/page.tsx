'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/lib/api';

export default function SetPasswordPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const phone = searchParams.get('phone') || '';

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const t = useTranslations();
  const { login } = useAuth();

  useEffect(() => {
    // Vérifier si l'utilisateur arrive bien de la vérification OTP
    const verificationCompleted = localStorage.getItem('otpVerified');
    if (!verificationCompleted || !phone) {
      router.push(`/${locale}/auth/inscription`);
    }
  }, [phone, locale, router]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validatePassword = (password: string) => {
    // Pattern API: ^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    const isLongEnough = password.length >= 8;

    if (!isLongEnough) return t('errors.passwordTooShort');
    if (!hasLowercase) return t('errors.passwordNeedsLowercase');
    if (!hasUppercase) return t('errors.passwordNeedsUppercase');
    if (!hasDigit) return t('errors.passwordNeedsDigit');

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('errors.passwordMismatch'));
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiService.setPassword(phone, formData.password);

      if (response.success) {
        // L'API retourne les tokens et l'utilisateur
        const { user, tokens } = response.data;

        // Stocker les tokens et données utilisateur manuellement
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        // Nettoyer localStorage
        localStorage.removeItem('otpVerified');
        localStorage.removeItem('registrationPhone');

        // Vérifier si le profil est complet
        if (!user.profileCompleted) {
          router.push(`/${locale}/auth/completer-profil`);
        } else {
          router.push(`/${locale}/auth/connexion`);
        }
      }
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
            {t('auth.setPassword.title')}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {t('auth.setPassword.subtitle', { phone })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.setPassword.password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
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
              <div className="text-xs text-gray-500 space-y-1">
                <p>• {t('auth.setPassword.requirements.length')}</p>
                <p>• {t('auth.setPassword.requirements.uppercase')}</p>
                <p>• {t('auth.setPassword.requirements.lowercase')}</p>
                <p>• {t('auth.setPassword.requirements.digit')}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('auth.setPassword.confirmPassword')}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-red-500 hover:bg-red-600"
              disabled={isLoading || !formData.password || !formData.confirmPassword}
            >
              {isLoading ? t('common.loading') : t('auth.setPassword.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}