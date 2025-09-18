'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  Bell,
  Languages,
  Shield,
  Volume2,
  VolumeX,
  Smartphone,
  MapPin,
  Save,
  Trash2,
  LogOut
} from 'lucide-react';
import apiService from '@/lib/api';
import { NotificationPreferences } from '@/types';

export default function SettingsPage({ params: { locale } }: { params: { locale: string } }) {
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    bloodRequests: true,
    eligibilityReminders: true,
    donationConfirmations: true,
    maxDistance: 50,
    soundEnabled: true,
    vibrationEnabled: true,
    nightModeStart: '22:00',
    nightModeEnd: '07:00',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { user, logout } = useAuth();
  const router = useRouter();
  const t = useTranslations();

  useEffect(() => {
    loadNotificationPreferences();
  }, []);

  const loadNotificationPreferences = async () => {
    try {
      const response = await apiService.getNotificationPreferences();
      if (response.success && response.data) {
        setNotificationPrefs({ ...notificationPrefs, ...response.data });
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  };

  const saveNotificationPreferences = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiService.updateNotificationPreferences(notificationPrefs);

      if (response.success) {
        setSuccess(t('settings.notifications.saveSuccess'));
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(t('settings.notifications.saveError'));
      }
    } catch (err: any) {
      setError(err.message || t('settings.notifications.networkError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotificationPrefChange = (key: keyof NotificationPreferences, value: any) => {
    setNotificationPrefs(prev => ({ ...prev, [key]: value }));
  };

  const switchLanguage = (newLocale: string) => {
    const currentPath = window.location.pathname;
    const newPath = currentPath.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  const handleLogout = async () => {
    await logout();
    router.push(`/${locale}`);
  };

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      // Auto-reset after 10 seconds if user doesn't confirm
      setTimeout(() => {
        setShowDeleteConfirm(false);
      }, 10000);
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await apiService.deleteAccount();

      if (response.success) {
        // Clear all local storage
        localStorage.clear();
        sessionStorage.clear();

        // Redirect to landing page with success message
        router.push(`/${locale}?deleted=true`);
      } else {
        // Don't throw here, just handle the API response directly
        const apiErrorMessage = response.message || 'Failed to delete account';
        console.error('Delete account API error:', apiErrorMessage);
        setError(apiErrorMessage);
        setShowDeleteConfirm(false);
      }
    } catch (error: any) {
      console.error('Delete account error:', error);
      // Show user-friendly error message based on the response
      const errorMessage = error.response?.data?.message ||
                          error.message ||
                          (locale === 'ar' ? 'حدث خطأ أثناء حذف الحساب' : 'Une erreur est survenue lors de la suppression du compte');
      setError(errorMessage);
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Test notification sound
  const testNotificationSound = () => {
    if (notificationPrefs.soundEnabled) {
      const audio = new Audio('/sounds/normal.mp3');
      audio.play().catch(() => {
        // Fallback if sound file doesn't exist
        console.log('Test notification sound');
      });
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
              <div className="bg-gray-500 p-3 rounded-full">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {t('settings.title')}
                </h1>
                <p className="text-gray-600 mt-1">
                  {t('settings.subtitle')}
                </p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="notifications" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="notifications">
                <Bell className="h-4 w-4 mr-2" />
                {t('settings.notifications.title')}
              </TabsTrigger>
              <TabsTrigger value="language">
                <Languages className="h-4 w-4 mr-2" />
                {t('settings.language.title')}
              </TabsTrigger>
              <TabsTrigger value="privacy">
                <Shield className="h-4 w-4 mr-2" />
                {t('settings.privacy.title')}
              </TabsTrigger>
            </TabsList>

            {/* Notifications Settings */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.notifications.preferencesTitle')}</CardTitle>
                  <CardDescription>
                    {t('settings.notifications.preferencesDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Notification Types */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">
                          {t('settings.notifications.bloodRequests')}
                        </Label>
                        <div className="text-sm text-gray-500">
                          {t('settings.notifications.bloodRequestsDesc')}
                        </div>
                      </div>
                      <Switch
                        checked={notificationPrefs.bloodRequests}
                        onCheckedChange={(checked) =>
                          handleNotificationPrefChange('bloodRequests', checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">
                          {t('settings.notifications.eligibilityReminders')}
                        </Label>
                        <div className="text-sm text-gray-500">
                          {t('settings.notifications.eligibilityRemindersDesc')}
                        </div>
                      </div>
                      <Switch
                        checked={notificationPrefs.eligibilityReminders}
                        onCheckedChange={(checked) =>
                          handleNotificationPrefChange('eligibilityReminders', checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">
                          {t('settings.notifications.donationConfirmations')}
                        </Label>
                        <div className="text-sm text-gray-500">
                          {t('settings.notifications.donationConfirmationsDesc')}
                        </div>
                      </div>
                      <Switch
                        checked={notificationPrefs.donationConfirmations}
                        onCheckedChange={(checked) =>
                          handleNotificationPrefChange('donationConfirmations', checked)
                        }
                      />
                    </div>
                  </div>

                  {/* Sound Settings */}
                  <div className="border-t pt-6 space-y-4">
                    <h3 className="text-lg font-medium">{t('settings.notifications.audioSettings')}</h3>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base flex items-center">
                          {notificationPrefs.soundEnabled ? (
                            <Volume2 className="h-4 w-4 mr-2" />
                          ) : (
                            <VolumeX className="h-4 w-4 mr-2" />
                          )}
                          {t('settings.notifications.sound')}
                        </Label>
                        <div className="text-sm text-gray-500">
                          {t('settings.notifications.soundDesc')}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={testNotificationSound}
                          disabled={!notificationPrefs.soundEnabled}
                        >
                          {t('settings.notifications.testSound')}
                        </Button>
                        <Switch
                          checked={notificationPrefs.soundEnabled}
                          onCheckedChange={(checked) =>
                            handleNotificationPrefChange('soundEnabled', checked)
                          }
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base flex items-center">
                          <Smartphone className="h-4 w-4 mr-2" />
                          {t('settings.notifications.vibration')}
                        </Label>
                        <div className="text-sm text-gray-500">
                          {t('settings.notifications.vibrationDesc')}
                        </div>
                      </div>
                      <Switch
                        checked={notificationPrefs.vibrationEnabled}
                        onCheckedChange={(checked) =>
                          handleNotificationPrefChange('vibrationEnabled', checked)
                        }
                      />
                    </div>
                  </div>

                  {/* Distance & Time Settings */}
                  <div className="border-t pt-6 space-y-4">
                    <h3 className="text-lg font-medium">{t('settings.notifications.locationSettings')}</h3>

                    <div>
                      <Label className="text-base flex items-center mb-2">
                        <MapPin className="h-4 w-4 mr-2" />
                        {t('settings.notifications.maxDistance')}
                      </Label>
                      <div className="flex items-center space-x-4">
                        <Input
                          type="range"
                          min="5"
                          max="100"
                          step="5"
                          value={notificationPrefs.maxDistance}
                          onChange={(e) =>
                            handleNotificationPrefChange('maxDistance', parseInt(e.target.value))
                          }
                          className="flex-1"
                        />
                        <div className="text-sm font-medium w-16 text-center">
                          {notificationPrefs.maxDistance} km
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {t('settings.notifications.maxDistanceDesc')}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nightStart">{t('settings.notifications.nightModeStart')}</Label>
                        <Input
                          id="nightStart"
                          type="time"
                          value={notificationPrefs.nightModeStart}
                          onChange={(e) =>
                            handleNotificationPrefChange('nightModeStart', e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="nightEnd">{t('settings.notifications.nightModeEnd')}</Label>
                        <Input
                          id="nightEnd"
                          type="time"
                          value={notificationPrefs.nightModeEnd}
                          onChange={(e) =>
                            handleNotificationPrefChange('nightModeEnd', e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {t('settings.notifications.nightModeDesc')}
                    </div>
                  </div>

                  {/* Error/Success Messages */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  {success && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-600">{success}</p>
                    </div>
                  )}

                  {/* Save Button */}
                  <div className="flex justify-end pt-6 border-t">
                    <Button
                      onClick={saveNotificationPreferences}
                      disabled={isSaving}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          {t('settings.notifications.saving')}
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {t('common.save')}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Language Settings */}
            <TabsContent value="language">
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.language.title')}</CardTitle>
                  <CardDescription>
                    {t('settings.language.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      variant={locale === 'fr' ? 'default' : 'outline'}
                      onClick={() => switchLanguage('fr')}
                      className="h-16 justify-start"
                    >
                      <div className="text-left">
                        <div className="font-medium">{t('settings.language.french')}</div>
                        <div className="text-sm opacity-70">{t('settings.language.primaryLanguage')}</div>
                      </div>
                    </Button>

                    <Button
                      variant={locale === 'ar' ? 'default' : 'outline'}
                      onClick={() => switchLanguage('ar')}
                      className="h-16 justify-start"
                    >
                      <div className="text-left">
                        <div className="font-medium">{t('settings.language.arabic')}</div>
                        <div className="text-sm opacity-70">{t('settings.language.secondaryLanguage')}</div>
                      </div>
                    </Button>
                  </div>

                  <div className="text-sm text-gray-500 mt-4">
                    {t('settings.language.supportInfo')}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy Settings */}
            <TabsContent value="privacy">
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.privacy.title')}</CardTitle>
                  <CardDescription>
                    {t('settings.privacy.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Account Info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">{t('settings.privacy.accountInfo')}</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>{t('settings.privacy.name')}:</strong> {user?.name || t('settings.privacy.notProvided')}</div>
                      <div><strong>{t('settings.privacy.phone')}:</strong> {user?.phone}</div>
                      <div><strong>{t('settings.privacy.bloodType')}:</strong> {user?.bloodType}</div>
                      <div><strong>{t('settings.privacy.memberSince')}:</strong> {user?.joinDate ? new Date(user.joinDate).toLocaleDateString(locale === 'ar' ? 'ar-MR' : 'fr-FR') : t('settings.privacy.unknownDate')}</div>
                    </div>
                  </div>

                  {/* Data Management */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">{t('settings.privacy.dataManagement')}</h3>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{t('settings.privacy.exportData')}</div>
                        <div className="text-sm text-gray-500">
                          {t('settings.privacy.exportDataDesc')}
                        </div>
                      </div>
                      <Button variant="outline">
                        {t('settings.privacy.export')}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                      <div>
                        <div className="font-medium text-red-900">
                          {t('settings.privacy.deleteAccount')}
                        </div>
                        <div className="text-sm text-red-600">
                          {t('settings.privacy.deleteAccountDesc')}
                        </div>
                        {showDeleteConfirm && (
                          <div className="text-sm text-red-700 mt-2 font-medium">
                            {locale === 'ar'
                              ? 'انقر مرة أخرى للتأكيد - هذا الإجراء لا يمكن التراجع عنه!'
                              : 'Cliquez encore pour confirmer - cette action est irréversible !'
                            }
                          </div>
                        )}
                      </div>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                        className={showDeleteConfirm ? 'bg-red-600 hover:bg-red-700' : ''}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {isDeleting ? (
                          locale === 'ar' ? 'جاري الحذف...' : 'Suppression...'
                        ) : showDeleteConfirm ? (
                          locale === 'ar' ? 'تأكيد الحذف' : 'Confirmer suppression'
                        ) : (
                          t('settings.privacy.delete')
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Logout */}
                  <div className="border-t pt-6">
                    <Button
                      variant="outline"
                      onClick={handleLogout}
                      className="w-full"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {t('navigation.logout')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ProtectedRoute>
  );
}