'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  User,
  Edit,
  Calendar,
  Droplets,
  Heart,
  Star,
  Award,
  Phone,
  CheckCircle,
  XCircle,
  Save
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { fr, ar } from 'date-fns/locale';
import apiService from '@/lib/api';
import { BloodType, UserStats } from '@/types';

const profileSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  lastDonationDate: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage({ params: { locale } }: { params: { locale: string } }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [eligibilityInfo, setEligibilityInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const { user, refreshUser } = useAuth();
  const t = useTranslations();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      bloodType: user?.bloodType || undefined,
      lastDonationDate: user?.lastDonationDate ? user.lastDonationDate.split('T')[0] : '',
    },
  });

  const bloodTypes: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    loadUserStats();
    loadEligibilityInfo();
  }, []);

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || '',
        bloodType: user.bloodType || undefined,
        lastDonationDate: user.lastDonationDate ? user.lastDonationDate.split('T')[0] : '',
      });
    }
  }, [user, form]);

  const loadUserStats = async () => {
    try {
      const response = await apiService.getUserStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  const loadEligibilityInfo = async () => {
    try {
      const response = await apiService.getEligibilityStatus();
      if (response.success) {
        setEligibilityInfo(response.data);
      }
    } catch (error) {
      console.error('Failed to load eligibility info:', error);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    setError(null);

    try {
      // Get current location for coordinates
      let coordinates = undefined;
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
        } catch (err) {
          console.warn('Could not get location:', err);
        }
      }

      const updateData = {
        name: data.name,
        bloodType: data.bloodType,
        lastDonationDate: data.lastDonationDate || null,
        profileCompleted: true,
        ...(coordinates && { coordinates })
      };

      const response = await apiService.updateProfile(updateData);

      if (response.success) {
        await refreshUser();
        setIsEditing(false);
      } else {
        setError(response.message || 'Erreur lors de la mise à jour du profil');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur réseau');
    } finally {
      setIsSaving(false);
    }
  };

  const getBloodTypeColor = (bloodType: string) => {
    const colors = {
      'O-': 'bg-purple-100 text-purple-800',
      'O+': 'bg-blue-100 text-blue-800',
      'A-': 'bg-green-100 text-green-800',
      'A+': 'bg-emerald-100 text-emerald-800',
      'B-': 'bg-orange-100 text-orange-800',
      'B+': 'bg-red-100 text-red-800',
      'AB-': 'bg-pink-100 text-pink-800',
      'AB+': 'bg-indigo-100 text-indigo-800',
    };
    return colors[bloodType as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatJoinDate = (date: string) => {
    try {
      return formatDistanceToNow(parseISO(date), {
        addSuffix: false,
        locale: locale === 'ar' ? ar : fr
      });
    } catch {
      return 'Date inconnue';
    }
  };

  return (
    <ProtectedRoute locale={locale}>
      <div className="min-h-screen bg-gray-50">
        <Navbar locale={locale} />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500 p-3 rounded-full">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {t('profile.title')}
                </h1>
                <p className="text-gray-600 mt-1">
                  Gérez vos informations personnelles et vos préférences
                </p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="personal">
                {t('profile.personal.title')}
              </TabsTrigger>
              <TabsTrigger value="stats">
                {t('profile.stats.title')}
              </TabsTrigger>
            </TabsList>

            {/* Personal Information Tab */}
            <TabsContent value="personal" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{t('profile.personal.title')}</CardTitle>
                    <CardDescription>
                      Informations de base sur votre profil de donneur
                    </CardDescription>
                  </div>
                  {!isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {t('common.edit')}
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('profile.personal.name')}</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="bloodType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('profile.personal.bloodType')}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Sélectionner votre groupe sanguin" />
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
                        </div>

                        <FormField
                          control={form.control}
                          name="lastDonationDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('profile.personal.lastDonation')}</FormLabel>
                              <FormControl>
                                <Input {...field} type="date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {error && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-sm text-red-600">{error}</p>
                          </div>
                        )}

                        <div className="flex justify-end space-x-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsEditing(false)}
                            disabled={isSaving}
                          >
                            {t('common.cancel')}
                          </Button>
                          <Button
                            type="submit"
                            disabled={isSaving}
                            className="bg-blue-500 hover:bg-blue-600"
                          >
                            {isSaving ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                Enregistrement...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                {t('common.save')}
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  ) : (
                    <div className="space-y-6">
                      {/* Basic Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">
                            {t('profile.personal.name')}
                          </Label>
                          <div className="mt-1 text-lg font-medium text-gray-900">
                            {user?.name || 'Non renseigné'}
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-600">
                            {t('profile.personal.phone')}
                          </Label>
                          <div className="mt-1 flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span className="text-lg font-medium text-gray-900">
                              {user?.phone}
                            </span>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-600">
                            {t('profile.personal.bloodType')}
                          </Label>
                          <div className="mt-1">
                            {user?.bloodType ? (
                              <Badge className={getBloodTypeColor(user.bloodType)}>
                                <Droplets className="h-3 w-3 mr-1" />
                                {user.bloodType}
                              </Badge>
                            ) : (
                              <span className="text-gray-500">Non renseigné</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-600">
                            Membre depuis
                          </Label>
                          <div className="mt-1 flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-lg font-medium text-gray-900">
                              {user?.joinDate ? formatJoinDate(user.joinDate) : 'Date inconnue'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Last Donation */}
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          {t('profile.personal.lastDonation')}
                        </Label>
                        <div className="mt-1">
                          {user?.lastDonationDate ? (
                            <div className="flex items-center space-x-2">
                              <Heart className="h-4 w-4 text-red-500" />
                              <span className="text-lg font-medium text-gray-900">
                                {new Date(user.lastDonationDate).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-500">Aucun don enregistré</span>
                          )}
                        </div>
                      </div>

                      {/* Eligibility Status */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {user?.isEligible ? (
                            <>
                              <CheckCircle className="h-5 w-5 text-green-500" />
                              <div>
                                <div className="font-medium text-green-900">
                                  {t('profile.personal.eligible')}
                                </div>
                                <div className="text-sm text-green-700">
                                  Vous êtes éligible pour donner du sang
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-5 w-5 text-red-500" />
                              <div>
                                <div className="font-medium text-red-900">
                                  {t('profile.personal.notEligible')}
                                </div>
                                <div className="text-sm text-red-700">
                                  {eligibilityInfo?.nextEligibleDate
                                    ? `Prochaine éligibilité: ${new Date(eligibilityInfo.nextEligibleDate).toLocaleDateString('fr-FR')}`
                                    : 'Contactez votre médecin pour plus d\'informations'
                                  }
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="stats" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Heart className="h-8 w-8 text-red-500" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">
                          {t('profile.stats.totalDonations')}
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {stats?.totalDonations || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Calendar className="h-8 w-8 text-blue-500" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">
                          {t('profile.stats.thisYear')}
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {stats?.thisYearDonations || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Star className="h-8 w-8 text-yellow-500" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">
                          {t('profile.stats.rating')}
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {stats?.avgRating?.toFixed(1) || '0.0'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Award className="h-8 w-8 text-purple-500" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">
                          Réalisations
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {stats?.achievements?.length || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Achievements */}
              {stats?.achievements && stats.achievements.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Award className="h-5 w-5 text-purple-500" />
                      <span>{t('profile.stats.achievements')}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {stats.achievements.map((achievement, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg"
                        >
                          <Award className="h-6 w-6 text-purple-500" />
                          <span className="font-medium text-purple-900">
                            {achievement}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ProtectedRoute>
  );
}