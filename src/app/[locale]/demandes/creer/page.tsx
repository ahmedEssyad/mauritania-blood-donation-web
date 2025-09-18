'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import LocationPicker from '@/components/blood-requests/LocationPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  ArrowLeft,
  Droplets,
  MapPin,
  Hospital,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import apiService from '@/lib/api';
import { BloodType, UrgencyLevel } from '@/types';

// Create schema factory function to use translations
const createRequestSchemaFactory = (t: any) => z.object({
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  urgencyLevel: z.enum(['low', 'medium', 'high', 'urgent']),
  description: z.string().min(10, t('bloodRequests.create.validationErrors.descriptionMin')).max(500),
  contactPhone: z.string().min(8, t('bloodRequests.create.validationErrors.phoneInvalid')),
  hospitalName: z.string().min(2, t('bloodRequests.create.validationErrors.hospitalRequired')),
  condition: z.string().optional(),
  doctorName: z.string().optional(),
});

type CreateRequestFormData = z.infer<ReturnType<typeof createRequestSchemaFactory>>;

export default function CreateRequestPage({ params: { locale } }: { params: { locale: string } }) {
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const t = useTranslations();

  const form = useForm<CreateRequestFormData>({
    resolver: zodResolver(createRequestSchemaFactory(t)),
    defaultValues: {
      bloodType: undefined,
      urgencyLevel: 'medium',
      description: '',
      contactPhone: '',
      hospitalName: '',
      condition: '',
      doctorName: '',
    },
  });

  const bloodTypes: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const urgencyLevels: UrgencyLevel[] = ['low', 'medium', 'high', 'urgent'];

  const getUrgencyIcon = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
    }
  };

  const onSubmit = async (data: CreateRequestFormData) => {
    if (!location) {
      setError(t('bloodRequests.create.locationError'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Map frontend urgency levels to API urgency levels
      const urgencyMapping = {
        'low': 'LOW',
        'medium': 'MEDIUM',
        'high': 'HIGH',
        'urgent': 'CRITICAL'
      };

      const requestData = {
        bloodType: data.bloodType,
        urgency: urgencyMapping[data.urgencyLevel as keyof typeof urgencyMapping],
        description: data.description,
        contactPhone: data.contactPhone,
        coordinates: {
          latitude: location.lat,
          longitude: location.lng
        }
      };

      const response = await apiService.createBloodRequest(requestData);

      if (response.success) {
        setSuccess(true);

        // Redirect to the new request details after a short delay
        setTimeout(() => {
          router.push(`/${locale}/demandes/${response.data._id}`);
        }, 2000);
      } else {
        setError(response.message || t('bloodRequests.create.createError'));
      }
    } catch (err: any) {
      setError(err.message || t('bloodRequests.create.networkError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <ProtectedRoute locale={locale}>
        <div className="min-h-screen bg-gray-50">
          <Navbar locale={locale} />
          <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Card className="text-center">
              <CardContent className="p-8">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {t('bloodRequests.create.success.title')}
                </h2>
                <p className="text-gray-600 mb-6">
                  {t('bloodRequests.create.success.message')}
                </p>
                <div className="space-x-4">
                  <Link href={`/${locale}/demandes`}>
                    <Button variant="outline">
                      {t('bloodRequests.create.success.viewAll')}
                    </Button>
                  </Link>
                  <Link href={`/${locale}/dashboard`}>
                    <Button>
                      {t('bloodRequests.create.success.backToDashboard')}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute locale={locale}>
      <div className="min-h-screen bg-gray-50">
        <Navbar locale={locale} />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href={`/${locale}/demandes`}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              {t('bloodRequests.create.backToRequests')}
            </Link>

            <div className="flex items-center space-x-3">
              <div className="bg-red-500 p-3 rounded-full">
                <Droplets className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {t('bloodRequests.create.title')}
                </h1>
                <p className="text-gray-600 mt-1">
                  {t('bloodRequests.create.subtitle')}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t('bloodRequests.create.formTitle')}</CardTitle>
                  <CardDescription>
                    {t('bloodRequests.create.formDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      {/* Blood Type & Urgency */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="bloodType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('bloodRequests.create.bloodType')}</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={t('bloodRequests.create.selectBloodType')} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {bloodTypes.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {type}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="urgencyLevel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('bloodRequests.create.urgency')}</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {urgencyLevels.map((level) => (
                                    <SelectItem key={level} value={level}>
                                      <div className="flex items-center space-x-2">
                                        {getUrgencyIcon(level)}
                                        <span>{t(`bloodRequests.urgency.${level}`)}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Description */}
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('bloodRequests.create.description')}</FormLabel>
                            <FormControl>
                              <textarea
                                {...field}
                                rows={4}
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder={t('bloodRequests.create.descriptionPlaceholder')}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Hospital Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="hospitalName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('bloodRequests.create.hospital')}</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder={t('bloodRequests.create.hospitalPlaceholder')} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="contactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('bloodRequests.create.contactPhone')}</FormLabel>
                              <FormControl>
                                <Input {...field} type="tel" placeholder={t('bloodRequests.create.phonePlaceholder')} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Optional Medical Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="condition"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('bloodRequests.create.condition')} ({t('bloodRequests.create.optional')})</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder={t('bloodRequests.create.conditionPlaceholder')} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="doctorName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('bloodRequests.create.doctorLabel')}</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder={t('bloodRequests.create.doctorPlaceholder')} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Location Picker */}
                      <div>
                        <Label className="text-sm font-medium mb-4 block">
                          <MapPin className="h-4 w-4 inline mr-2" />
                          {t('bloodRequests.create.location')}
                        </Label>
                        <LocationPicker onLocationSelect={setLocation} />
                      </div>

                      {/* Error Display */}
                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <p className="text-sm text-red-600">{error}</p>
                        </div>
                      )}

                      {/* Submit Button */}
                      <div className="flex justify-end space-x-4">
                        <Link href={`/${locale}/demandes`}>
                          <Button type="button" variant="outline">
                            {t('common.cancel')}
                          </Button>
                        </Link>
                        <Button
                          type="submit"
                          disabled={isSubmitting || !location}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              {t('common.creating')}
                            </>
                          ) : (
                            t('bloodRequests.create.submit')
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Hospital className="h-5 w-5 text-red-500" />
                    <span>{t('bloodRequests.create.tips.title')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">{t('bloodRequests.create.tips.realUrgency.title')}</h4>
                    <p className="text-gray-600">
                      {t('bloodRequests.create.tips.realUrgency.description')}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">{t('bloodRequests.create.tips.accurateInfo.title')}</h4>
                    <p className="text-gray-600">
                      {t('bloodRequests.create.tips.accurateInfo.description')}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">{t('bloodRequests.create.tips.exactLocation.title')}</h4>
                    <p className="text-gray-600">
                      {t('bloodRequests.create.tips.exactLocation.description')}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{t('bloodRequests.create.compatibility.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs space-y-2">
                    <div><strong>O-</strong>: {t('bloodRequests.create.compatibility.oNegative')}</div>
                    <div><strong>AB+</strong>: {t('bloodRequests.create.compatibility.abPositive')}</div>
                    <div><strong>A+</strong>: {t('bloodRequests.create.compatibility.aPositive')}</div>
                    <div><strong>B+</strong>: {t('bloodRequests.create.compatibility.bPositive')}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}