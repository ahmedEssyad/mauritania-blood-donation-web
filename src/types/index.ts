// Types correspondant exactement aux modèles backend
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'urgent';

export type RequestStatus = 'active' | 'fulfilled' | 'cancelled' | 'expired';

export type DonationStatus = 'pending' | 'confirmed' | 'disputed' | 'cancelled';

export type NotificationType =
  | 'blood_request_created'
  | 'blood_request_response'
  | 'donor_selected'
  | 'donation_confirmed'
  | 'donation_received'
  | 'eligibility_reminder';

export type UserRole = 'donor' | 'requester';

// Interface User correspondant au modèle backend
export interface User {
  _id: string;
  phone: string;
  name?: string;
  bloodType: BloodType;
  passwordSet: boolean;
  isEligible: boolean;
  totalDonations: number;
  lastDonationDate?: string;
  profileCompleted?: boolean;
  joinDate: string;
  isActive: boolean;
  pushTokens?: string[];
  location?: {
    coordinates: [number, number];
    lastUpdated: string;
  };
  notificationPreferences: NotificationPreferences;
  eligibilityHistory?: Array<{
    date: string;
    isEligible: boolean;
    reason?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Interface BloodRequest correspondant au modèle backend
export interface BloodRequest {
  _id: string;
  requesterUserId: string;
  bloodType: BloodType;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude] format MongoDB
    address?: string;
  };
  urgencyLevel: UrgencyLevel;
  description?: string;
  contactPhone?: string;
  medicalInfo?: {
    condition?: string;
    hospitalName?: string;
    doctorName?: string;
    urgentNeed?: boolean;
  };
  status: RequestStatus;
  expiresAt: string;
  closedAt?: string;
  closedReason?: string;
  selectedDonorId?: string;
  responses: BloodRequestResponse[];
  respondersCount: number;
  createdAt: string;
  updatedAt: string;

  // Champs calculés côté frontend
  distance?: number;
  requester?: {
    _id: string;
    name?: string;
    phone: string;
    bloodType: BloodType;
  };
}

// Interface BloodRequestResponse correspondant au modèle backend
export interface BloodRequestResponse {
  _id: string;
  donorUserId: string;
  message?: string;
  respondedAt: string;
  isSelected: boolean;
  contacted: boolean;
  availableAt?: string;
  createdAt: string;

  // Champs populés côté backend
  donor?: {
    _id: string;
    name?: string;
    phone: string;
    bloodType: BloodType;
    totalDonations: number;
    isEligible: boolean;
  };
}

// Interface pour les réponses étendues (utilisée dans les écrans de détail)
export interface DonorResponse extends BloodRequestResponse {
  status: 'pending' | 'selected' | 'rejected';
}

// Interface DonationRecord correspondant au modèle backend
export interface DonationRecord {
  _id: string;
  requestId: string;
  responseId: string;
  donorUserId: string;
  requesterUserId: string;
  donationDate: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
    address?: string;
  };
  notes?: string;

  // Confirmations et évaluations
  donorConfirmed: boolean;
  donorConfirmedAt?: string;
  requesterConfirmed: boolean;
  requesterConfirmedAt?: string;

  // Ratings (1-5 étoiles)
  donorRating?: number;
  donorFeedback?: string;
  requesterRating?: number;
  requesterFeedback?: string;

  status: DonationStatus;
  disputeReason?: string;
  disputeDetails?: string;
  resolvedAt?: string;

  confirmationDeadline: string;
  createdAt: string;
  updatedAt: string;

  // Champs calculés/populés côté frontend
  userRole?: UserRole;
  otherParty?: {
    _id: string;
    name?: string;
    phone: string;
    bloodType: BloodType;
  };
  request?: {
    _id: string;
    bloodType: BloodType;
    urgencyLevel: UrgencyLevel;
    description?: string;
  };
}

// Interface NotificationPreferences correspondant au modèle backend
export interface NotificationPreferences {
  bloodRequests: boolean;
  eligibilityReminders: boolean;
  donationConfirmations: boolean;
  maxDistance: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  nightModeStart?: string; // HH:mm format
  nightModeEnd?: string; // HH:mm format
}

// Interface Notification correspondant au modèle backend
export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: {
    requestId?: string;
    donationId?: string;
    responseId?: string;
    [key: string]: any;
  };
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  expiresAt?: string;
}

// Interface pour les statistiques utilisateur
export interface UserStats {
  totalDonations: number;
  thisYearDonations: number;
  thisMonthDonations: number;
  avgRating: number;
  totalResponses: number;
  successfulDonations: number;
  lastDonationDate?: string;
  monthlyStats: Array<{
    month: string;
    year: number;
    donations: number;
  }>;
  yearlyStats: Array<{
    year: number;
    donations: number;
  }>;
  ratingDistribution: Array<{
    rating: number;
    count: number;
  }>;
  achievements: string[];
}

// Interface pour les tokens d'authentification
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

// Interface pour les réponses API standardisées
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  code?: string;
}

// Interface pour la pagination
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Interface pour les réponses paginées
export interface PaginatedResponse<T> extends ApiResponse {
  data: {
    items: T[];
    pagination: PaginationMeta;
  };
}

// Interface pour les coordonnées géographiques
export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
  timestamp?: number;
}

// Interface pour les paramètres de recherche de donneurs
export interface NearbyDonorsParams {
  lat: number;
  lng: number;
  radius?: number;
  limit?: number;
  bloodType?: BloodType;
  isEligibleOnly?: boolean;
}

// Interface pour les paramètres de création de demande de sang
export interface CreateBloodRequestParams {
  bloodType: BloodType;
  coordinates: [number, number];
  urgencyLevel: UrgencyLevel;
  description?: string;
  contactPhone?: string;
  medicalInfo?: {
    condition?: string;
    hospitalName?: string;
    doctorName?: string;
    urgentNeed?: boolean;
  };
}

// Interface pour les paramètres de recherche de demandes de sang
export interface BloodRequestsParams {
  lat?: number;
  lng?: number;
  radius?: number;
  bloodType?: BloodType;
  urgency?: UrgencyLevel;
  page?: number;
  limit?: number;
  status?: RequestStatus;
}

// Interface pour les erreurs de validation
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Types utilitaires
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type SortOrder = 'asc' | 'desc';

export type DateRange = {
  start: string;
  end: string;
};

// Configuration de l'environnement
export interface AppConfig {
  apiUrl: string;
  environment: 'development' | 'staging' | 'production';
  version: string;
  buildNumber: string;
}