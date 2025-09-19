'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets } from 'lucide-react';
import apiService from '@/lib/api';

export default function VerificationPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const phone = searchParams.get('phone') || '';
  const type = searchParams.get('type') || 'login';

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
      setError(t('errors.required'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await apiService.verifyOTP(phone, otpCode);

      if (response.success) {
        // Marquer OTP comme vérifié
        localStorage.setItem('otpVerified', 'true');

        if (type === 'register') {
          // Rediriger vers la page de définition de mot de passe
          router.push(`/${locale}/auth/definir-mot-de-passe?phone=${encodeURIComponent(phone)}`);
        } else {
          // Pour reset password
          router.push(`/${locale}/auth/reinitialiser-mot-de-passe?phone=${encodeURIComponent(phone)}`);
        }
      } else {
        setError(response.message || t('errors.validationError'));
      }
    } catch (err: any) {
      setError(err.message || t('errors.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setIsLoading(true);
    setError('');

    try {
      await apiService.sendOTP(phone);
      setTimer(60);
      setCanResend(false);
    } catch (err: any) {
      setError(err.message || t('errors.networkError'));
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
            {t('auth.otp.title')}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {t('auth.otp.subtitle')}
          </CardDescription>
          <div className="text-sm text-gray-500 mt-2">
            {phone}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || code.join('').length !== 6}
            >
              {isLoading ? t('common.loading') : t('auth.otp.submit')}
            </Button>

            <div className="text-center">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                  disabled={isLoading}
                >
                  {t('auth.otp.resend')}
                </button>
              ) : (
                <div className="text-sm text-gray-500">
                  {t('auth.otp.timer', { seconds: timer })}
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}