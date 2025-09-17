'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import apiService from '@/lib/api';

export default function ResetPasswordPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const phone = searchParams.get('phone') || '';

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = code.join('');

    if (otpCode.length !== 6) {
      setError(t('auth.resetPassword.enterCode'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.resetPassword.passwordsDontMatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.resetPassword.passwordTooShort'));
      return;
    }

    // Check password strength
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      setError(t('auth.resetPassword.passwordRequirements'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await apiService.resetPassword(phone, otpCode, password);

      if (response.success) {
        setSuccess(true);
        // Redirect to login after success
        setTimeout(() => {
          router.push(`/${locale}/auth/connexion`);
        }, 2000);
      } else {
        setError(response.message || 'Erreur lors de la réinitialisation du mot de passe');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur réseau');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setIsLoading(true);
    setError('');

    try {
      await apiService.forgotPassword(phone);
      setTimer(60);
      setCanResend(false);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du renvoi du code');
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
              {t('auth.resetPassword.success')}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {t('auth.resetPassword.successMessage')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-500 mb-4">
              {t('auth.resetPassword.redirectingToLogin')}
            </p>
            <Link href={`/${locale}/auth/connexion`}>
              <Button className="w-full">
                {t('auth.resetPassword.goToLogin')}
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
            {t('auth.resetPassword.title')}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {t('auth.resetPassword.subtitle')}
          </CardDescription>
          <div className="text-sm text-gray-500 mt-2">
            {phone}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Code Input */}
            <div>
              <Label className="text-sm font-medium mb-4 block">
                {t('auth.resetPassword.verificationCode')}
              </Label>
              <div className="flex justify-center space-x-2">
                {code.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="w-12 h-12 text-center text-lg font-semibold"
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={isLoading}
                  />
                ))}
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.resetPassword.newPassword')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder={t('auth.resetPassword.passwordPlaceholder')}
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

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('auth.resetPassword.confirmPassword')}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
              <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || code.join('').length !== 6 || !password || !confirmPassword}
            >
              {isLoading ? t('auth.resetPassword.submitting') : t('auth.resetPassword.submit')}
            </Button>

            <div className="text-center space-y-2">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                  disabled={isLoading}
                >
                  {t('auth.resetPassword.resendCode')}
                </button>
              ) : (
                <div className="text-sm text-gray-500">
                  {t('auth.resetPassword.resendTimer', { seconds: timer })}
                </div>
              )}

              <div>
                <Link
                  href={`/${locale}/auth/connexion`}
                  className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  {t('auth.resetPassword.backToLogin')}
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}