import { lazy } from 'react';

// Lazy load components with proper error boundaries
export const LazyBloodRequestDetails = lazy(() =>
  import('@/app/[locale]/demandes/[id]/page').then(module => ({
    default: module.default
  }))
);

export const LazyProfilePage = lazy(() =>
  import('@/app/[locale]/profil/page').then(module => ({
    default: module.default
  }))
);

export const LazyNotificationsPage = lazy(() =>
  import('@/app/[locale]/notifications/page').then(module => ({
    default: module.default
  }))
);

// Performance monitoring utilities
export function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();

  return fn().then(result => {
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds`);
    return result;
  });
}

// Debounce utility for search inputs
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility for scroll events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Memory usage monitoring
export function logMemoryUsage() {
  if (typeof window !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory;
    console.log({
      usedJSHeapSize: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
      totalJSHeapSize: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
      jsHeapSizeLimit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`
    });
  }
}

// Intersection Observer for lazy loading images
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }

  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  });
}

// Web Vitals monitoring
export function measureWebVitals() {
  if (typeof window === 'undefined') return;

  // Measure LCP (Largest Contentful Paint)
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    console.log('LCP:', lastEntry.startTime);
  }).observe({ entryTypes: ['largest-contentful-paint'] });

  // Measure FID (First Input Delay)
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry) => {
      console.log('FID:', entry.processingStart - entry.startTime);
    });
  }).observe({ entryTypes: ['first-input'] });

  // Measure CLS (Cumulative Layout Shift)
  let clsValue = 0;
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!(entry as any).hadRecentInput) {
        clsValue += (entry as any).value;
        console.log('CLS:', clsValue);
      }
    }
  }).observe({ entryTypes: ['layout-shift'] });
}

// Bundle size analyzer helper
export function analyzeBundleSize() {
  if (typeof window === 'undefined') return;

  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));

  console.group('Bundle Analysis');
  console.log('Scripts:', scripts.length);
  console.log('Stylesheets:', styles.length);

  scripts.forEach((script, index) => {
    console.log(`Script ${index + 1}:`, (script as HTMLScriptElement).src);
  });

  styles.forEach((style, index) => {
    console.log(`Stylesheet ${index + 1}:`, (style as HTMLLinkElement).href);
  });

  console.groupEnd();
}

// Cache management for API responses
const cache = new Map();

export function getCachedData(key: string) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes
    return cached.data;
  }
  return null;
}

export function setCachedData(key: string, data: any) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

export function clearCache() {
  cache.clear();
}