'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Droplets,
  MapPin,
  Clock,
  Phone,
  Hospital,
  Users,
  Heart,
  AlertCircle,
  Send,
  User
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { fr, ar } from 'date-fns/locale';
import apiService from '@/lib/api';
import { BloodRequest, BloodRequestResponse, UrgencyLevel } from '@/types';

export default function BloodRequestDetailsPage({ params: { locale } }: { params: { locale: string } }) {
  const [request, setRequest] = useState<BloodRequest | null>(null);
  const [responses, setResponses] = useState<BloodRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRespondModalOpen, setIsRespondModalOpen] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const t = useTranslations();

  const requestId = params.id as string;

  useEffect(() => {
    if (requestId) {
      loadRequestDetails();
    }
  }, [requestId]);

  const loadRequestDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const [requestResponse, responsesResponse] = await Promise.all([
        apiService.getBloodRequest(requestId),
        apiService.getBloodRequestResponses(requestId)
      ]);

      if (requestResponse.success) {
        setRequest(requestResponse.data);
      } else {
        setError(t('bloodRequests.details.notFound'));
      }

      if (responsesResponse.success) {
        setResponses(responsesResponse.data.responses || []);
      }
    } catch (err: any) {
      console.error('Failed to load request details:', err);
      setError(err.message || t('bloodRequests.details.loadingError'));
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async () => {
    if (!responseMessage.trim()) return;

    setIsSubmittingResponse(true);

    try {
      const response = await apiService.respondToBloodRequest(requestId, {
        message: responseMessage
      });

      if (response.success) {
        setIsRespondModalOpen(false);
        setResponseMessage('');
        loadRequestDetails(); // Refresh to show new response
      }
    } catch (error) {
      console.error('Failed to respond:', error);
    } finally {
      setIsSubmittingResponse(false);
    }
  };

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

  if (loading) {
    return (
      <ProtectedRoute locale={locale}>
        <div className="min-h-screen bg-gray-50">
          <Navbar locale={locale} />
          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-6">
              <Skeleton className="h-8 w-64" />
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !request) {
    return (
      <ProtectedRoute locale={locale}>
        <div className="min-h-screen bg-gray-50">
          <Navbar locale={locale} />
          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {error || t('bloodRequests.details.notFound')}
              </h3>
              <Link href={`/${locale}/demandes`}>
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('bloodRequests.details.backToRequests')}
                </Button>
              </Link>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  const timeAgo = formatDistanceToNow(new Date(request.createdAt), {
    addSuffix: true,
    locale: locale === 'ar' ? ar : fr
  });

  const expiresIn = formatDistanceToNow(new Date(request.expiresAt), {
    addSuffix: true,
    locale: locale === 'ar' ? ar : fr
  });

  const isOwner = user?._id === request.requesterUserId;
  const hasResponded = responses.some(r => r.donorUserId === user?._id);

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
              {t('bloodRequests.details.backToRequests')}
            </Link>

            <div className="flex items-center space-x-3">
              <div className="bg-red-500 p-3 rounded-full">
                <Droplets className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {t('bloodRequests.details.title')}
                </h1>
                <p className="text-gray-600 mt-1">{timeAgo}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Request Details */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge className={getBloodTypeColor(request.bloodType)}>
                        {request.bloodType}
                      </Badge>
                      <Badge className={getUrgencyColor(request.urgencyLevel)}>
                        {t(`bloodRequests.urgency.${request.urgencyLevel}`)}
                      </Badge>
                    </div>
                    <Badge
                      variant={request.status === 'active' ? 'default' : 'secondary'}
                    >
                      {t(`bloodRequests.status.${request.status}`)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Description */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">{t('bloodRequests.details.description')}</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {request.description}
                    </p>
                  </div>

                  {/* Medical Information */}
                  {request.medicalInfo && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-medium text-blue-900 mb-3 flex items-center">
                        <Hospital className="h-4 w-4 mr-2" />
                        {t('bloodRequests.details.medicalInfo')}
                      </h3>
                      <div className="space-y-2 text-sm">
                        {request.medicalInfo.hospitalName && (
                          <div>
                            <strong>{t('bloodRequests.details.hospital')}:</strong> {request.medicalInfo.hospitalName}
                          </div>
                        )}
                        {request.medicalInfo.condition && (
                          <div>
                            <strong>{t('bloodRequests.details.condition')}:</strong> {request.medicalInfo.condition}
                          </div>
                        )}
                        {request.medicalInfo.doctorName && (
                          <div>
                            <strong>{t('bloodRequests.details.doctor')}:</strong> {request.medicalInfo.doctorName}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Location & Contact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {request.location.address && (
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-gray-900">{t('bloodRequests.details.location')}</div>
                          <div className="text-sm text-gray-600">{request.location.address}</div>
                        </div>
                      </div>
                    )}

                    {request.contactPhone && (
                      <div className="flex items-start space-x-2">
                        <Phone className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-gray-900">{t('bloodRequests.details.contact')}</div>
                          <div className="text-sm text-gray-600">{request.contactPhone}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  {!isOwner && request.status === 'active' && (
                    <div className="pt-4 border-t">
                      {hasResponded ? (
                        <div className="flex items-center space-x-2 text-green-600">
                          <Heart className="h-4 w-4" />
                          <span className="text-sm font-medium">{t('bloodRequests.details.alreadyResponded')}</span>
                        </div>
                      ) : (
                        <Dialog open={isRespondModalOpen} onOpenChange={setIsRespondModalOpen}>
                          <DialogTrigger asChild>
                            <Button className="bg-red-500 hover:bg-red-600">
                              <Heart className="h-4 w-4 mr-2" />
                              {t('bloodRequests.details.respond')}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{t('bloodRequests.details.respondToRequest')}</DialogTitle>
                              <DialogDescription>
                                {t('bloodRequests.details.respondDescription')}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="message">{t('bloodRequests.details.messageLabel')}</Label>
                                <textarea
                                  id="message"
                                  rows={3}
                                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
                                  placeholder={t('bloodRequests.details.messagePlaceholder')}
                                  value={responseMessage}
                                  onChange={(e) => setResponseMessage(e.target.value)}
                                />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setIsRespondModalOpen(false)}
                                >
                                  {t('bloodRequests.details.cancel')}
                                </Button>
                                <Button
                                  onClick={handleRespond}
                                  disabled={isSubmittingResponse}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  {isSubmittingResponse ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                      {t('bloodRequests.details.sending')}
                                    </>
                                  ) : (
                                    <>
                                      <Send className="h-4 w-4 mr-2" />
                                      {t('bloodRequests.details.sendResponse')}
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Responses */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>
                      {t('bloodRequests.details.responses', { count: responses.length })}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {responses.length > 0 ? (
                    <div className="space-y-4">
                      {responses.map((response) => (
                        <div
                          key={response._id}
                          className={`p-4 rounded-lg border ${
                            response.isSelected ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="bg-blue-500 p-2 rounded-full">
                              <User className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">
                                  {response.donor?.name || t('bloodRequests.details.anonymousDonor')}
                                </span>
                                <Badge variant="outline">
                                  {response.donor?.bloodType}
                                </Badge>
                                {response.isSelected && (
                                  <Badge className="bg-green-100 text-green-800">
                                    {t('bloodRequests.details.selected')}
                                  </Badge>
                                )}
                              </div>
                              {response.message && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {response.message}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-2">
                                {formatDistanceToNow(new Date(response.respondedAt), {
                                  addSuffix: true,
                                  locale: locale === 'ar' ? ar : fr
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">{t('bloodRequests.details.noResponses')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Time Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>{t('bloodRequests.details.timeInfo')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <div className="font-medium text-gray-900">{t('bloodRequests.details.created')}</div>
                    <div className="text-gray-600">{timeAgo}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{t('bloodRequests.details.expires')}</div>
                    <div className="text-gray-600">{expiresIn}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Info */}
              {request.urgencyLevel === 'urgent' && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-sm text-red-800 flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4" />
                      <span>{t('bloodRequests.details.urgentRequest')}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-red-700">
                      {t('bloodRequests.details.urgentDescription')}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Compatibility Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{t('bloodRequests.details.compatibility')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-2">
                    <div className="font-medium">
                      {t('bloodRequests.details.typeNeeded')}: <Badge className={getBloodTypeColor(request.bloodType)}>
                        {request.bloodType}
                      </Badge>
                    </div>
                    <div className="text-gray-600">
                      {t('bloodRequests.details.compatibilityDescription')}
                    </div>
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