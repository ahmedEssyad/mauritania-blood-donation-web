'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Droplets, MapPin, Calendar, User, Droplet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { BloodType } from '@/types';
import apiService from '@/lib/api';

export default function CompleteProfilePage() {
  const params = useParams();
  const locale = params.locale as string;

  const [formData, setFormData] = useState({
    name: '',
    bloodType: '' as BloodType,
    lastDonationDate: '',
    coordinates: {
      latitude: 0,
      longitude: 0
    }
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationGranted, setLocationGranted] = useState(false);

  const router = useRouter();
  const t = useTranslations();
  const { user, refreshUser } = useAuth();

  const bloodTypes: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  useEffect(() => {
    // Rediriger si l'utilisateur n'est pas connecté
    if (!user) {
      router.push(`/${locale}/auth/connexion`);
      return;
    }

    // Rediriger si le profil est déjà complet
    if (user.profileCompleted) {
      router.push(`/${locale}/dashboard`);
      return;
    }

    // Pré-remplir les données existantes
    if (user.name) setFormData(prev => ({ ...prev, name: user.name! }));
    if (user.bloodType) setFormData(prev => ({ ...prev, bloodType: user.bloodType }));
    if (user.lastDonationDate) {
      const date = new Date(user.lastDonationDate).toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, lastDonationDate: date }));
    }
  }, [user, locale, router]);

  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const getLocation = useCallback(async () => {
    setLocationLoading(true);
    setError('');

    try {
      if (!navigator.geolocation) {
        throw new Error(t('errors.geolocationNotSupported'));
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      });

      setFormData(prev => ({
        ...prev,
        coordinates: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }
      }));
      setLocationGranted(true);
    } catch (err: any) {
      setError(t('errors.locationPermissionDenied'));
    } finally {
      setLocationLoading(false);
    }
  }, [t]);

  const canProceedToNextStep = React.useMemo(() => {
    switch (currentStep) {
      case 1: return formData.name.trim().length >= 2;
      case 2: return formData.bloodType !== '';
      case 3: return true; // Toujours valide (date optionnelle)
      case 4: return locationGranted;
      default: return false;
    }
  }, [currentStep, formData.name, formData.bloodType, locationGranted]);

  const handleNext = useCallback(() => {
    if (canProceedToNextStep && currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  }, [canProceedToNextStep, currentStep, totalSteps]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');

    try {
      const updateData = {
        name: formData.name,
        bloodType: formData.bloodType,
        coordinates: formData.coordinates,
        lastDonationDate: formData.lastDonationDate ? new Date(formData.lastDonationDate).toISOString() : null,
        profileCompleted: true
      };

      const response = await apiService.updateProfile(updateData);

      if (response.success) {
        // Actualiser les données utilisateur
        await refreshUser();

        // Rediriger vers le dashboard
        router.push(`/${locale}/dashboard`);
      }
    } catch (err: any) {
      setError(err.message || t('errors.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = useMemo(() => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <User className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">{t('auth.completeProfile.step1.title')}</h3>
              <p className="text-sm text-gray-600">{t('auth.completeProfile.step1.subtitle')}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">{t('auth.completeProfile.step1.name')}</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder={t('auth.completeProfile.step1.namePlaceholder')}
                required
              />
              <p className="text-xs text-gray-500">
                {t('auth.completeProfile.step1.nameHelp')}
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Droplet className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">{t('auth.completeProfile.step2.title')}</h3>
              <p className="text-sm text-gray-600">{t('auth.completeProfile.step2.subtitle')}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bloodType">{t('auth.completeProfile.step2.bloodType')}</Label>
              <select
                id="bloodType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.bloodType}
                onChange={(e) => handleInputChange('bloodType', e.target.value)}
                required
              >
                <option value="">{t('auth.completeProfile.step2.selectBloodType')}</option>
                {bloodTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Calendar className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">{t('auth.completeProfile.step3.title')}</h3>
              <p className="text-sm text-gray-600">{t('auth.completeProfile.step3.subtitle')}</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lastDonationDate">{t('auth.completeProfile.step3.lastDonationDate')}</Label>
                <Input
                  id="lastDonationDate"
                  type="date"
                  value={formData.lastDonationDate}
                  onChange={(e) => handleInputChange('lastDonationDate', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  {t('auth.completeProfile.step3.firstTimeHelp')}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleInputChange('lastDonationDate', '')}
                >
                  {t('auth.completeProfile.step3.firstTimeDonor')}
                </Button>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <MapPin className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">{t('auth.completeProfile.step4.title')}</h3>
              <p className="text-sm text-gray-600">{t('auth.completeProfile.step4.subtitle')}</p>
            </div>
            <div className="space-y-4">
              {!locationGranted ? (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    {t('auth.completeProfile.step4.locationHelp')}
                  </p>
                  <Button
                    type="button"
                    onClick={getLocation}
                    disabled={locationLoading}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    {locationLoading ? t('common.loading') : t('auth.completeProfile.step4.enableLocation')}
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-700 font-medium">
                      {t('auth.completeProfile.step4.locationSuccess')}
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      {t('auth.completeProfile.step4.locationCoords', {
                        lat: formData.coordinates.latitude.toFixed(4),
                        lng: formData.coordinates.longitude.toFixed(4)
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  }, [currentStep, formData, locationGranted, locationLoading, getLocation, handleInputChange, t]);

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
            {t('auth.completeProfile.title')}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {t('auth.completeProfile.subtitle')}
          </CardDescription>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{t('auth.completeProfile.step')} {currentStep} {t('auth.completeProfile.of')} {totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>
        <CardContent>
          {renderStep}

          {error && (
            <div className="text-red-600 text-sm text-center mt-4">
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                className="flex-1"
              >
                {t('auth.completeProfile.previous')}
              </Button>
            )}

            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canProceedToNextStep}
                className="flex-1 bg-red-500 hover:bg-red-600"
              >
                {t('auth.completeProfile.next')}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!canProceedToNextStep || isLoading}
                className="flex-1 bg-red-500 hover:bg-red-600"
              >
                {isLoading ? t('common.loading') : t('auth.completeProfile.finish')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}