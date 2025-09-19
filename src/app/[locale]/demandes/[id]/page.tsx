'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ErrorAlert } from '@/components/errors';
import { useBloodRequestDetail } from '@/hooks/useBloodRequestDetail';
import { BloodRequestDetailSkeleton } from '@/components/LoadingStates';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Phone,
  User,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Heart
} from 'lucide-react';
import Link from 'next/link';

function getUrgencyColor(urgency: string) {
  switch (urgency) {
    case 'CRITICAL': return 'bg-red-500 text-white';
    case 'HIGH': return 'bg-orange-500 text-white';
    case 'MEDIUM': return 'bg-yellow-500 text-black';
    case 'LOW': return 'bg-blue-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE': return 'bg-green-500 text-white';
    case 'FULFILLED': return 'bg-blue-500 text-white';
    case 'CANCELLED': return 'bg-red-500 text-white';
    case 'EXPIRED': return 'bg-gray-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
}

export default function BloodRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations();
  const locale = params.locale as string;
  const requestId = params.id as string;

  const [responseMessage, setResponseMessage] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [closeReason, setCloseReason] = useState<'FULFILLED' | 'CANCELLED'>('FULFILLED');
  const [closeNotes, setCloseNotes] = useState('');

  const { data, loading, error, refetch, respondToRequest, closeRequest, confirmDonor } = useBloodRequestDetail(requestId, t);

  const handleRespond = async () => {
    setIsResponding(true);
    try {
      const result = await respondToRequest(responseMessage);
      if (result.success) {
        setResponseMessage('');
        // Show success message
      } else {
        // Show error message
        console.error('Failed to respond:', result.error);
      }
    } finally {
      setIsResponding(false);
    }
  };

  const handleCloseRequest = async () => {
    setIsClosing(true);
    try {
      const result = await closeRequest(closeReason, closeNotes);
      if (result.success) {
        setCloseNotes('');
        // Request closed successfully, data will be refetched
      } else {
        console.error('Failed to close request:', result.error);
      }
    } finally {
      setIsClosing(false);
    }
  };

  const handleConfirmDonor = async (responseId: string) => {
    try {
      const result = await confirmDonor(responseId);
      if (result.success) {
        // Donor confirmed successfully
      } else {
        console.error('Failed to confirm donor:', result.error);
      }
    } catch (error) {
      console.error('Error confirming donor:', error);
    }
  };

  if (loading) return <BloodRequestDetailSkeleton />;

  if (error) {
    return (
      <ProtectedRoute locale={locale}>
        <div className="min-h-screen bg-gray-50">
          <Navbar locale={locale} />
          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ErrorAlert
              error={error}
              onRetry={refetch}
              onDismiss={() => router.back()}
            />
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  const { request, responses, userContext } = data;

  if (!request) {
    return (
      <ProtectedRoute locale={locale}>
        <div className="min-h-screen bg-gray-50">
          <Navbar locale={locale} />
          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('bloodRequests.notFound')}
              </h3>
              <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('common.back')}
              </Button>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  const isExpired = new Date(request.expiresAt) < new Date();
  const timeRemaining = Math.max(0, new Date(request.expiresAt).getTime() - new Date().getTime());
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <ProtectedRoute locale={locale}>
      <div className="min-h-screen bg-gray-50">
        <Navbar locale={locale} />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <div className="mb-6">
            <Link href={`/${locale}/demandes`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('bloodRequests.backToList')}
              </Button>
            </Link>
          </div>

          {/* Request Header */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getUrgencyColor(request.urgencyLevel)}>
                      {t(`bloodRequests.urgency.${request.urgencyLevel.toLowerCase()}`)}
                    </Badge>
                    <Badge className={getStatusColor(request.status)}>
                      {t(`bloodRequests.status.${request.status.toLowerCase()}`)}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl">
                    {t('bloodRequests.bloodTypeNeeded', { bloodType: request.bloodType })}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {request.description || t('bloodRequests.noDescription')}
                  </CardDescription>
                </div>

                {/* Time Info */}
                <div className="text-right text-sm text-gray-600">
                  <div className="flex items-center gap-1 mb-1">
                    <Clock className="h-4 w-4" />
                    {isExpired ? (
                      <span className="text-red-600 font-medium">{t('bloodRequests.expired')}</span>
                    ) : (
                      <span>
                        {hoursRemaining > 0 && `${hoursRemaining}h `}
                        {minutesRemaining}m {t('bloodRequests.remaining')}
                      </span>
                    )}
                  </div>
                  <div>{new Date(request.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Requester Info */}
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>{request.requester?.name || t('common.anonymous')}</span>
                </div>

                {/* Contact Info */}
                {request.contactPhone && (userContext.isOwner || userContext.hasResponded) && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <a href={`tel:${request.contactPhone}`} className="text-blue-600 hover:underline">
                      {request.contactPhone}
                    </a>
                  </div>
                )}

                {/* Location Info */}
                {request.distance && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{request.distance} km {t('bloodRequests.away')}</span>
                  </div>
                )}

                {/* Response Count */}
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-gray-400" />
                  <span>{request.respondersCount} {t('bloodRequests.responses')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions for Non-owners */}
          {!userContext.isOwner && request.status === 'ACTIVE' && !isExpired && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{t('bloodRequests.respond.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                {userContext.hasResponded ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span>{t('bloodRequests.respond.alreadyResponded')}</span>
                  </div>
                ) : userContext.canRespond ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="response-message">{t('bloodRequests.respond.message')}</Label>
                      <Textarea
                        id="response-message"
                        placeholder={t('bloodRequests.respond.messagePlaceholder')}
                        value={responseMessage}
                        onChange={(e) => setResponseMessage(e.target.value)}
                        maxLength={200}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {responseMessage.length}/200
                      </div>
                    </div>
                    <Button
                      onClick={handleRespond}
                      disabled={isResponding}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      {isResponding ? t('common.sending') : t('bloodRequests.respond.submit')}
                    </Button>
                  </div>
                ) : (
                  <div className="text-gray-600">
                    {t('bloodRequests.respond.notEligible')}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Owner Actions */}
          {userContext.isOwner && request.status === 'ACTIVE' && !isExpired && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{t('bloodRequests.manage.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setCloseReason('FULFILLED')}
                      variant={closeReason === 'FULFILLED' ? 'default' : 'outline'}
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {t('bloodRequests.manage.markFulfilled')}
                    </Button>
                    <Button
                      onClick={() => setCloseReason('CANCELLED')}
                      variant={closeReason === 'CANCELLED' ? 'destructive' : 'outline'}
                      size="sm"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {t('bloodRequests.manage.cancel')}
                    </Button>
                  </div>

                  <div>
                    <Label htmlFor="close-notes">{t('bloodRequests.manage.notes')}</Label>
                    <Textarea
                      id="close-notes"
                      placeholder={t('bloodRequests.manage.notesPlaceholder')}
                      value={closeNotes}
                      onChange={(e) => setCloseNotes(e.target.value)}
                      maxLength={200}
                    />
                  </div>

                  <Button
                    onClick={handleCloseRequest}
                    disabled={isClosing}
                    variant={closeReason === 'CANCELLED' ? 'destructive' : 'default'}
                  >
                    {isClosing ? t('common.processing') : t('bloodRequests.manage.confirm')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Responses List (for owners) */}
          {userContext.isOwner && responses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('bloodRequests.responses.title')} ({responses.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {responses.map((response, index) => (
                    <div key={response._id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">
                            {response.donor?.name || t('common.anonymous')}
                          </h4>
                          <div className="text-sm text-gray-600">
                            {response.donor?.bloodType} • {response.donor?.totalDonations} {t('bloodRequests.donations')}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(response.respondedAt).toLocaleDateString()}
                        </div>
                      </div>

                      {response.message && (
                        <div className="mb-3">
                          <div className="bg-gray-50 rounded p-2 text-sm">
                            <MessageSquare className="h-4 w-4 inline mr-1" />
                            {response.message}
                          </div>
                        </div>
                      )}

                      {request.status === 'ACTIVE' && !response.isSelected && (
                        <Button
                          onClick={() => handleConfirmDonor(response._id)}
                          size="sm"
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {t('bloodRequests.responses.selectDonor')}
                        </Button>
                      )}

                      {response.isSelected && (
                        <Badge className="bg-green-500 text-white">
                          {t('bloodRequests.responses.selectedDonor')}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}