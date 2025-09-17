// PWA Notification Service for Blood Donation App
// Strictly French/Arabic languages only

class NotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported: boolean = false;

  constructor() {
    this.isSupported = this.checkSupport();
  }

  private checkSupport(): boolean {
    return (
      'serviceWorker' in navigator &&
      'Notification' in window &&
      'PushManager' in window
    );
  }

  async initialize(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Notifications not supported in this browser');
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered successfully');
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
  }

  async showLocalNotification(
    title: string,
    options: {
      body: string;
      icon?: string;
      badge?: string;
      data?: any;
      urgency?: 'low' | 'medium' | 'high' | 'urgent';
      soundFile?: string;
    }
  ): Promise<void> {
    if (!this.isSupported || Notification.permission !== 'granted') {
      console.warn('Cannot show notification: permission not granted');
      return;
    }

    // Play notification sound
    if (options.soundFile) {
      this.playNotificationSound(options.soundFile);
    } else {
      // Default sound based on urgency
      const soundFile = this.getSoundForUrgency(options.urgency || 'medium');
      this.playNotificationSound(soundFile);
    }

    // Create notification
    const notificationOptions: NotificationOptions = {
      body: options.body,
      icon: options.icon || '/icon-192x192.png',
      badge: options.badge || '/icon-72x72.png',
      data: options.data,
      vibrate: this.getVibrationPattern(options.urgency || 'medium'),
      requireInteraction: options.urgency === 'urgent',
      tag: options.data?.requestId || 'general',
    };

    if (this.registration) {
      // Use service worker for better background support
      await this.registration.showNotification(title, notificationOptions);
    } else {
      // Fallback to regular notification
      new Notification(title, notificationOptions);
    }
  }

  private getSoundForUrgency(urgency: 'low' | 'medium' | 'high' | 'urgent'): string {
    switch (urgency) {
      case 'urgent':
      case 'high':
        return '/sounds/urgent.mp3';
      case 'medium':
      case 'low':
      default:
        return '/sounds/normal.mp3';
    }
  }

  private getVibrationPattern(urgency: 'low' | 'medium' | 'high' | 'urgent'): number[] {
    switch (urgency) {
      case 'urgent':
        return [200, 100, 200, 100, 200]; // Strong pattern
      case 'high':
        return [200, 100, 200]; // Medium pattern
      case 'medium':
        return [200]; // Single vibration
      case 'low':
      default:
        return []; // No vibration
    }
  }

  private async playNotificationSound(soundFile: string): Promise<void> {
    try {
      const audio = new Audio(soundFile);
      audio.volume = 0.7; // Reasonable volume
      await audio.play();
    } catch (error) {
      console.warn('Could not play notification sound:', error);
      // Fallback: try to play a system beep or use silent notification
    }
  }

  async scheduleBloodRequestNotification(
    bloodType: string,
    location: string,
    urgency: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ): Promise<void> {
    const title = urgency === 'urgent'
      ? `🚨 Demande urgente de sang ${bloodType}`
      : `🩸 Nouvelle demande de sang ${bloodType}`;

    const body = urgency === 'urgent'
      ? `Demande urgente de sang ${bloodType} à ${location}. Votre aide est nécessaire immédiatement.`
      : `Une nouvelle demande de sang ${bloodType} a été créée à ${location}.`;

    await this.showLocalNotification(title, {
      body,
      urgency,
      data: {
        type: 'blood_request_created',
        bloodType,
        location
      }
    });
  }

  async scheduleResponseNotification(
    donorName: string,
    bloodType: string
  ): Promise<void> {
    const title = '✅ Nouvelle réponse à votre demande';
    const body = `${donorName} a répondu à votre demande de sang ${bloodType}.`;

    await this.showLocalNotification(title, {
      body,
      urgency: 'medium',
      soundFile: '/sounds/success.mp3',
      data: {
        type: 'blood_request_response',
        donorName,
        bloodType
      }
    });
  }

  async scheduleDonationConfirmation(
    recipientName: string,
    date: string
  ): Promise<void> {
    const title = '🎉 Don confirmé';
    const body = `Votre don de sang à ${recipientName} le ${date} a été confirmé. Merci pour votre générosité!`;

    await this.showLocalNotification(title, {
      body,
      urgency: 'low',
      soundFile: '/sounds/success.mp3',
      data: {
        type: 'donation_confirmed',
        recipientName,
        date
      }
    });
  }

  async scheduleEligibilityReminder(): Promise<void> {
    const title = '🔄 Vous êtes de nouveau éligible';
    const body = 'Vous pouvez maintenant donner du sang. Aidez à sauver des vies en répondant aux demandes.';

    await this.showLocalNotification(title, {
      body,
      urgency: 'low',
      data: {
        type: 'eligibility_reminder'
      }
    });
  }

  // Test notification for settings
  async testNotification(): Promise<void> {
    const title = '🔔 Test de notification';
    const body = 'Votre système de notifications fonctionne correctement!';

    await this.showLocalNotification(title, {
      body,
      urgency: 'medium',
      data: {
        type: 'test'
      }
    });
  }

  async getPushSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) {
      console.warn('Service worker not registered');
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      return subscription;
    } catch (error) {
      console.error('Error getting push subscription:', error);
      return null;
    }
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.registration) {
      console.warn('Service worker not registered');
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        )
      });

      console.log('Push subscription created:', subscription);
      return subscription;
    } catch (error) {
      console.error('Error creating push subscription:', error);
      return null;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Utility method to check current permission status
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  // Check if notifications are enabled and working
  isEnabled(): boolean {
    return (
      this.isSupported &&
      Notification.permission === 'granted' &&
      this.registration !== null
    );
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;