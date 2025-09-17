// Service Worker for Blood Donation PWA
// Provides offline functionality and background notifications
// Strictly French/Arabic content only

const CACHE_NAME = 'blood-donation-v1';
const API_CACHE_NAME = 'blood-donation-api-v1';

// Files to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/fr',
  '/ar',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/sounds/urgent.mp3',
  '/sounds/normal.mp3',
  '/sounds/success.mp3'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /^https:\/\/mauritania-blood-donation-api\.onrender\.com\/api\/v1\//
];

// Install event - cache static resources
self.addEventListener('install', event => {
  console.log('Service Worker installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching static resources');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('Static resources cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Failed to cache static resources:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');

  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategy
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (API_CACHE_PATTERNS.some(pattern => pattern.test(request.url))) {
    event.respondWith(
      handleApiRequest(request)
    );
    return;
  }

  // Handle static assets and pages
  if (request.method === 'GET') {
    event.respondWith(
      handleStaticRequest(request)
    );
  }
});

// API request handler - Network First strategy
async function handleApiRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }

    throw new Error('Network response not ok');
  } catch (error) {
    console.log('Network failed, trying cache for:', request.url);

    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline response for critical API calls
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Service hors ligne. Veuillez vérifier votre connexion internet.',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Static request handler - Cache First strategy
async function handleStaticRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fallback to network
    const networkResponse = await fetch(request);

    // Cache the response if successful
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('Failed to fetch:', request.url, error);

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const cache = await caches.open(CACHE_NAME);
      return cache.match('/') || new Response('Service hors ligne', { status: 503 });
    }

    return new Response('Resource not available offline', { status: 503 });
  }
}

// Push event - handle background notifications
self.addEventListener('push', event => {
  console.log('Push notification received');

  let data = {};

  if (event.data) {
    try {
      data = event.data.json();
    } catch (error) {
      console.error('Error parsing push data:', error);
      data = { title: 'Nouvelle notification', body: 'Vous avez reçu une nouvelle notification.' };
    }
  }

  const options = {
    body: data.body || 'Nouvelle notification de don de sang',
    icon: data.icon || '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: getVibrationPattern(data.urgency),
    data: data.data || {},
    actions: getNotificationActions(data.type),
    requireInteraction: data.urgency === 'urgent',
    tag: data.tag || 'blood-donation'
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Donation de Sang',
      options
    )
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event.notification);

  event.notification.close();

  const data = event.notification.data;
  const action = event.action;

  let targetUrl = '/fr'; // Default to French

  // Determine target URL based on notification data
  if (data.requestId) {
    targetUrl = `/fr/demandes/${data.requestId}`;
  } else if (data.type === 'donation_confirmed') {
    targetUrl = '/fr/historique';
  } else if (data.type === 'eligibility_reminder') {
    targetUrl = '/fr/profil';
  }

  // Handle action buttons
  if (action === 'respond') {
    targetUrl = `/fr/demandes/${data.requestId}`;
  } else if (action === 'view') {
    targetUrl = `/fr/demandes`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url.includes(targetUrl.split('/')[2]) && 'focus' in client) {
            return client.focus();
          }
        }

        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Background sync event
self.addEventListener('sync', event => {
  console.log('Background sync triggered:', event.tag);

  if (event.tag === 'blood-requests-sync') {
    event.waitUntil(syncBloodRequests());
  } else if (event.tag === 'notifications-sync') {
    event.waitUntil(syncNotifications());
  }
});

// Helper functions
function getVibrationPattern(urgency) {
  switch (urgency) {
    case 'urgent':
      return [200, 100, 200, 100, 200];
    case 'high':
      return [200, 100, 200];
    case 'medium':
      return [200];
    case 'low':
    default:
      return [];
  }
}

function getNotificationActions(type) {
  switch (type) {
    case 'blood_request_created':
      return [
        {
          action: 'respond',
          title: 'Répondre',
          icon: '/icon-72x72.png'
        },
        {
          action: 'view',
          title: 'Voir toutes',
          icon: '/icon-72x72.png'
        }
      ];
    case 'blood_request_response':
      return [
        {
          action: 'view',
          title: 'Voir la réponse',
          icon: '/icon-72x72.png'
        }
      ];
    default:
      return [];
  }
}

// Background sync functions
async function syncBloodRequests() {
  try {
    console.log('Syncing blood requests in background...');

    // Get cached requests and try to sync with server
    const cache = await caches.open(API_CACHE_NAME);
    const requests = await cache.keys();

    for (const request of requests) {
      if (request.url.includes('/blood-requests')) {
        try {
          const response = await fetch(request);
          if (response.ok) {
            await cache.put(request, response.clone());
          }
        } catch (error) {
          console.log('Failed to sync request:', request.url);
        }
      }
    }

    console.log('Blood requests sync completed');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

async function syncNotifications() {
  try {
    console.log('Syncing notifications in background...');

    // Similar sync logic for notifications
    const cache = await caches.open(API_CACHE_NAME);

    // Try to fetch latest notifications
    try {
      const response = await fetch('https://mauritania-blood-donation-api.onrender.com/api/v1/notifications/history');
      if (response.ok) {
        await cache.put(response.url, response.clone());
      }
    } catch (error) {
      console.log('Failed to sync notifications');
    }

    console.log('Notifications sync completed');
  } catch (error) {
    console.error('Notifications sync failed:', error);
  }
}

// Message event for communication with main thread
self.addEventListener('message', event => {
  console.log('Service Worker received message:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'PLAY_SOUND') {
    // Handle sound playback requests from notifications
    playNotificationSound(event.data.sound);
  }
});

function playNotificationSound(soundFile) {
  // Note: Audio playback in service worker is limited
  // This would typically be handled by the main thread
  console.log('Playing notification sound:', soundFile);
}