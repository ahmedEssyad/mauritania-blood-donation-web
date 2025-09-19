import { AxiosError } from 'axios';
import { ProfileIncompleteError } from '@/types/api';

export interface ErrorInfo {
  type: 'api' | 'validation' | 'authentication' | 'location' | 'profile' | 'bloodRequest' | 'donation' | 'notification' | 'upload' | 'form' | 'general';
  code: string;
  message: string;
  translationKey: string;
  details?: any;
  statusCode?: number;
  retryable?: boolean;
}

export interface TranslationFunction {
  (key: string, params?: Record<string, any>): string;
}

/**
 * Standardized error handler for the application
 * Converts different types of errors into a consistent format with proper translations
 */
export class ErrorHandler {
  private t: TranslationFunction;

  constructor(t: TranslationFunction) {
    this.t = t;
  }

  /**
   * Parse and categorize an error
   */
  public parseError(error: any): ErrorInfo {
    // Handle ProfileIncompleteError
    if (error instanceof ProfileIncompleteError) {
      return {
        type: 'profile',
        code: 'PROFILE_INCOMPLETE',
        message: this.t('errors.profile.incomplete'),
        translationKey: 'errors.profile.incomplete',
        details: error.data,
        retryable: false
      };
    }

    // Handle AxiosError (API errors)
    if (error.isAxiosError || error.response) {
      return this.parseApiError(error as AxiosError);
    }

    // Handle network/connection errors
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return {
        type: 'api',
        code: 'TIMEOUT',
        message: this.t('errors.api.timeout'),
        translationKey: 'errors.api.timeout',
        retryable: true
      };
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return {
        type: 'api',
        code: 'NETWORK_ERROR',
        message: this.t('errors.api.network'),
        translationKey: 'errors.api.network',
        retryable: true
      };
    }

    // Handle geolocation errors
    if (error.code === 'PERMISSION_DENIED') {
      return {
        type: 'location',
        code: 'PERMISSION_DENIED',
        message: this.t('errors.location.denied'),
        translationKey: 'errors.location.denied',
        retryable: false
      };
    }

    if (error.code === 'POSITION_UNAVAILABLE') {
      return {
        type: 'location',
        code: 'POSITION_UNAVAILABLE',
        message: this.t('errors.location.unavailable'),
        translationKey: 'errors.location.unavailable',
        retryable: true
      };
    }

    if (error.code === 'TIMEOUT') {
      return {
        type: 'location',
        code: 'TIMEOUT',
        message: this.t('errors.location.timeout'),
        translationKey: 'errors.location.timeout',
        retryable: true
      };
    }

    // Handle validation errors
    if (error.name === 'ValidationError' || error.type === 'validation') {
      return this.parseValidationError(error);
    }

    // Handle generic JavaScript errors
    if (error instanceof Error) {
      return {
        type: 'general',
        code: 'UNKNOWN_ERROR',
        message: error.message || this.t('errors.general.unknown'),
        translationKey: 'errors.general.unknown',
        retryable: false
      };
    }

    // Fallback for unknown error types
    return {
      type: 'general',
      code: 'UNKNOWN_ERROR',
      message: this.t('errors.general.unknown'),
      translationKey: 'errors.general.unknown',
      retryable: false
    };
  }

  /**
   * Parse API errors (Axios errors)
   */
  private parseApiError(error: AxiosError): ErrorInfo {
    const statusCode = error.response?.status;
    const errorData = error.response?.data as any;

    // Map status codes to error types
    switch (statusCode) {
      case 400:
        return {
          type: 'api',
          code: 'BAD_REQUEST',
          message: this.t('errors.api.badRequest'),
          translationKey: 'errors.api.badRequest',
          statusCode,
          retryable: false
        };

      case 401:
        return {
          type: 'authentication',
          code: 'UNAUTHORIZED',
          message: this.t('errors.api.unauthorized'),
          translationKey: 'errors.api.unauthorized',
          statusCode,
          retryable: false
        };

      case 403:
        return {
          type: 'api',
          code: 'FORBIDDEN',
          message: this.t('errors.api.forbidden'),
          translationKey: 'errors.api.forbidden',
          statusCode,
          retryable: false
        };

      case 404:
        return {
          type: 'api',
          code: 'NOT_FOUND',
          message: this.t('errors.api.notFound'),
          translationKey: 'errors.api.notFound',
          statusCode,
          retryable: false
        };

      case 409:
        return {
          type: 'api',
          code: 'CONFLICT',
          message: this.t('errors.api.conflict'),
          translationKey: 'errors.api.conflict',
          statusCode,
          retryable: false
        };

      case 422:
        return {
          type: 'validation',
          code: 'UNPROCESSABLE_ENTITY',
          message: this.t('errors.api.unprocessableEntity'),
          translationKey: 'errors.api.unprocessableEntity',
          statusCode,
          details: errorData,
          retryable: false
        };

      case 429:
        return {
          type: 'api',
          code: 'RATE_LIMITED',
          message: this.t('errors.api.rateLimited'),
          translationKey: 'errors.api.rateLimited',
          statusCode,
          retryable: true
        };

      case 500:
        return {
          type: 'api',
          code: 'INTERNAL_SERVER_ERROR',
          message: this.t('errors.api.internalServerError'),
          translationKey: 'errors.api.internalServerError',
          statusCode,
          retryable: true
        };

      case 502:
        return {
          type: 'api',
          code: 'BAD_GATEWAY',
          message: this.t('errors.api.badGateway'),
          translationKey: 'errors.api.badGateway',
          statusCode,
          retryable: true
        };

      case 503:
        return {
          type: 'api',
          code: 'SERVICE_UNAVAILABLE',
          message: this.t('errors.api.serviceUnavailable'),
          translationKey: 'errors.api.serviceUnavailable',
          statusCode,
          retryable: true
        };

      case 504:
        return {
          type: 'api',
          code: 'GATEWAY_TIMEOUT',
          message: this.t('errors.api.gatewayTimeout'),
          translationKey: 'errors.api.gatewayTimeout',
          statusCode,
          retryable: true
        };

      default:
        return {
          type: 'api',
          code: 'SERVER_ERROR',
          message: this.t('errors.api.serverError'),
          translationKey: 'errors.api.serverError',
          statusCode,
          retryable: true
        };
    }
  }

  /**
   * Parse validation errors
   */
  private parseValidationError(error: any): ErrorInfo {
    // Handle Zod validation errors
    if (error.issues && Array.isArray(error.issues)) {
      const firstIssue = error.issues[0];
      const path = firstIssue.path?.join('.') || 'unknown';

      switch (firstIssue.code) {
        case 'too_small':
          if (firstIssue.type === 'string') {
            return {
              type: 'validation',
              code: 'FIELD_TOO_SHORT',
              message: this.t('errors.form.fieldTooShort'),
              translationKey: 'errors.form.fieldTooShort',
              details: { field: path, minimum: firstIssue.minimum },
              retryable: false
            };
          }
          break;

        case 'too_big':
          if (firstIssue.type === 'string') {
            return {
              type: 'validation',
              code: 'FIELD_TOO_LONG',
              message: this.t('errors.form.fieldTooLong'),
              translationKey: 'errors.form.fieldTooLong',
              details: { field: path, maximum: firstIssue.maximum },
              retryable: false
            };
          }
          break;

        case 'invalid_type':
          if (firstIssue.expected === 'string' && firstIssue.received === 'undefined') {
            return {
              type: 'validation',
              code: 'REQUIRED_FIELD',
              message: this.t('errors.validation.required'),
              translationKey: 'errors.validation.required',
              details: { field: path },
              retryable: false
            };
          }
          break;
      }
    }

    // Handle custom validation errors
    if (error.field && error.type) {
      const translationKey = `errors.validation.${error.type}`;
      return {
        type: 'validation',
        code: error.type.toUpperCase(),
        message: this.t(translationKey),
        translationKey,
        details: { field: error.field },
        retryable: false
      };
    }

    return {
      type: 'validation',
      code: 'VALIDATION_ERROR',
      message: this.t('errors.form.validationFailed'),
      translationKey: 'errors.form.validationFailed',
      retryable: false
    };
  }

  /**
   * Get user-friendly error message
   */
  public getErrorMessage(error: any): string {
    const errorInfo = this.parseError(error);
    return errorInfo.message;
  }

  /**
   * Check if error is retryable
   */
  public isRetryable(error: any): boolean {
    const errorInfo = this.parseError(error);
    return errorInfo.retryable || false;
  }

  /**
   * Get error type for UI handling
   */
  public getErrorType(error: any): string {
    const errorInfo = this.parseError(error);
    return errorInfo.type;
  }

  /**
   * Format error for logging
   */
  public formatErrorForLogging(error: any): {
    message: string;
    type: string;
    code: string;
    statusCode?: number;
    stack?: string;
    details?: any;
  } {
    const errorInfo = this.parseError(error);

    return {
      message: errorInfo.message,
      type: errorInfo.type,
      code: errorInfo.code,
      statusCode: errorInfo.statusCode,
      stack: error.stack,
      details: errorInfo.details
    };
  }
}

/**
 * Create an error handler instance with translations
 */
export function createErrorHandler(t: TranslationFunction): ErrorHandler {
  return new ErrorHandler(t);
}

/**
 * Utility function to handle API errors consistently
 */
export function handleApiError(error: any, t: TranslationFunction): ErrorInfo {
  const handler = createErrorHandler(t);
  return handler.parseError(error);
}

/**
 * Hook for error handling in React components
 */
export function useErrorHandler(t: TranslationFunction) {
  const handler = createErrorHandler(t);

  return {
    parseError: (error: any) => handler.parseError(error),
    getErrorMessage: (error: any) => handler.getErrorMessage(error),
    isRetryable: (error: any) => handler.isRetryable(error),
    getErrorType: (error: any) => handler.getErrorType(error),
    formatForLogging: (error: any) => handler.formatErrorForLogging(error)
  };
}