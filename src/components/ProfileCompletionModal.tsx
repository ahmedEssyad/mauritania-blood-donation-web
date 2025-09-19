'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, User, Droplet, Calendar, MapPin } from 'lucide-react';

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingFields: Record<string, string>;
  completionPercentage: number;
  locale: string;
  nextSteps?: string;
}

export default function ProfileCompletionModal({
  isOpen,
  onClose,
  missingFields,
  completionPercentage,
  locale,
  nextSteps
}: ProfileCompletionModalProps) {
  const router = useRouter();
  const t = useTranslations();

  const handleCompleteProfile = () => {
    onClose();
    router.push(`/${locale}/auth/completer-profil`);
  };

  const getFieldIcon = (fieldName: string) => {
    switch (fieldName) {
      case 'bloodType':
        return <Droplet className="h-5 w-5 text-red-500" />;
      case 'lastDonationDate':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'coordinates':
        return <MapPin className="h-5 w-5 text-green-500" />;
      case 'profileCompleted':
        return <User className="h-5 w-5 text-purple-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-orange-100 p-2 rounded-full">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                {t('profile.incomplete.title')}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                {t('profile.incomplete.subtitle')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{t('profile.incomplete.progress')}</span>
              <span>{Math.round(completionPercentage)}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>

          {/* Missing Fields */}
          {Object.entries(missingFields).length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                {t('profile.incomplete.missingFields')}
              </h4>
              <div className="space-y-2">
                {Object.entries(missingFields).map(([field, message]) => (
                  <div key={field} className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg">
                    {getFieldIcon(field)}
                    <span className="text-sm text-gray-700">{message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Steps */}
          {nextSteps && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>{t('profile.incomplete.nextSteps')}:</strong> {nextSteps}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              {t('profile.incomplete.later')}
            </Button>
            <Button
              type="button"
              onClick={handleCompleteProfile}
              className="flex-1 bg-red-500 hover:bg-red-600"
            >
              {t('profile.incomplete.completeNow')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}