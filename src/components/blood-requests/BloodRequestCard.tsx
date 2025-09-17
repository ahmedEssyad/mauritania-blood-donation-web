'use client';

import { BloodRequest, UrgencyLevel } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Droplets,
  MapPin,
  Clock,
  Phone,
  Hospital,
  Users,
  Calendar
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';
import { fr, ar } from 'date-fns/locale';
import Link from 'next/link';

interface BloodRequestCardProps {
  request: BloodRequest;
  locale: string;
  onRespond?: (requestId: string) => void;
  showActions?: boolean;
}

export default function BloodRequestCard({
  request,
  locale,
  onRespond,
  showActions = true
}: BloodRequestCardProps) {
  const t = useTranslations();

  const getUrgencyColor = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
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

  const timeAgo = formatDistanceToNow(new Date(request.createdAt), {
    addSuffix: true,
    locale: locale === 'ar' ? ar : fr
  });

  const expiresIn = formatDistanceToNow(new Date(request.expiresAt), {
    addSuffix: true,
    locale: locale === 'ar' ? ar : fr
  });

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-red-500 p-3 rounded-full">
                <Droplets className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <Badge className={getBloodTypeColor(request.bloodType)}>
                    {request.bloodType}
                  </Badge>
                  <Badge className={getUrgencyColor(request.urgencyLevel)}>
                    {t(`bloodRequests.urgency.${request.urgencyLevel}`)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1">{timeAgo}</p>
              </div>
            </div>

            {request.status && (
              <Badge
                variant={request.status === 'active' ? 'default' : 'secondary'}
                className="ml-2"
              >
                {t(`bloodRequests.status.${request.status}`)}
              </Badge>
            )}
          </div>

          {/* Description */}
          {request.description && (
            <p className="text-gray-700 text-sm leading-relaxed">
              {request.description}
            </p>
          )}

          {/* Medical Info */}
          {request.medicalInfo && (
            <div className="bg-gray-50 p-3 rounded-lg">
              {request.medicalInfo.hospitalName && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Hospital className="h-4 w-4" />
                  <span>{request.medicalInfo.hospitalName}</span>
                </div>
              )}
              {request.medicalInfo.condition && (
                <div className="text-sm text-gray-600 mt-1">
                  <strong>Condition:</strong> {request.medicalInfo.condition}
                </div>
              )}
            </div>
          )}

          {/* Location and Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {request.location.address && (
              <div className="flex items-center space-x-2 text-gray-600">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{request.location.address}</span>
              </div>
            )}

            {request.contactPhone && (
              <div className="flex items-center space-x-2 text-gray-600">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>{request.contactPhone}</span>
              </div>
            )}

            {request.distance && (
              <div className="flex items-center space-x-2 text-gray-600">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>{request.distance.toFixed(1)} km</span>
              </div>
            )}

            <div className="flex items-center space-x-2 text-gray-600">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs">
                {t('bloodRequests.details.expiresAt')}: {expiresIn}
              </span>
            </div>
          </div>

          {/* Responses Count */}
          {request.respondersCount > 0 && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>
                {t('bloodRequests.details.responses', { count: request.respondersCount })}
              </span>
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
              <Link href={`/${locale}/demandes/${request._id}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  {t('bloodRequests.details.title')}
                </Button>
              </Link>

              {request.status === 'active' && onRespond && (
                <Button
                  onClick={() => onRespond(request._id)}
                  className="flex-1 bg-red-500 hover:bg-red-600"
                >
                  {t('bloodRequests.details.respond')}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}