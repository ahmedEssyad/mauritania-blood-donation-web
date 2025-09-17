import React from 'react';

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(name: string): void {
    this.metrics.set(name, performance.now());
  }

  endTimer(name: string): number {
    const startTime = this.metrics.get(name);
    if (!startTime) {
      console.warn(`Timer "${name}" not found`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.metrics.delete(name);

    if (duration > 100) {
      console.warn(`Performance warning: ${name} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.startTimer(name);
    return fn().finally(() => {
      this.endTimer(name);
    });
  }

  measureSync<T>(name: string, fn: () => T): T {
    this.startTimer(name);
    try {
      return fn();
    } finally {
      this.endTimer(name);
    }
  }
}

// Error tracking
export class ErrorTracker {
  private static errors: Array<{
    message: string;
    stack?: string;
    timestamp: number;
    url: string;
    userAgent: string;
  }> = [];

  static track(error: Error): void {
    if (typeof window === 'undefined') return;

    const errorInfo = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.errors.push(errorInfo);

    // Keep only last 50 errors
    if (this.errors.length > 50) {
      this.errors.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error tracked:', errorInfo);
    }
  }

  static getErrors(): typeof ErrorTracker.errors {
    return [...this.errors];
  }

  static clearErrors(): void {
    this.errors.length = 0;
  }
}

// Bundle analyzer
export function analyzeLoadedScripts(): void {
  if (typeof window === 'undefined') return;

  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const totalSize = scripts.length;

  console.group('🔍 Bundle Analysis');
  console.log(`Total scripts loaded: ${totalSize}`);

  scripts.forEach((script, index) => {
    const src = (script as HTMLScriptElement).src;
    if (src.includes('_next/static')) {
      console.log(`📦 Next.js chunk ${index + 1}: ${src.split('/').pop()}`);
    }
  });

  console.groupEnd();
}

// Memory usage monitoring
export function trackMemoryUsage(): void {
  if (typeof window === 'undefined' || !('memory' in performance)) return;

  const memory = (performance as any).memory;
  const usedMB = (memory.usedJSHeapSize / 1048576).toFixed(2);
  const limitMB = (memory.jsHeapSizeLimit / 1048576).toFixed(2);
  const usagePercent = ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(1);

  console.log(`🧠 Memory Usage: ${usedMB}MB / ${limitMB}MB (${usagePercent}%)`);

  // Warn if memory usage is high
  if (parseFloat(usagePercent) > 80) {
    console.warn('⚠️ High memory usage detected!');
  }
}

// Component render tracking
export function withRenderTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
): React.ComponentType<P> {
  return function TrackedComponent(props: P) {
    const monitor = PerformanceMonitor.getInstance();

    React.useEffect(() => {
      monitor.startTimer(`${componentName}-mount`);

      return () => {
        monitor.endTimer(`${componentName}-mount`);
      };
    }, []);

    return React.createElement(Component, props);
  };
}

// API call monitoring
export function trackApiCall(endpoint: string, duration: number, success: boolean): void {
  const status = success ? '✅' : '❌';
  console.log(`🌐 API ${status} ${endpoint}: ${duration.toFixed(2)}ms`);

  // Track slow API calls
  if (duration > 2000) {
    console.warn(`⚠️ Slow API call: ${endpoint} took ${duration.toFixed(2)}ms`);
  }
}

// Initialize monitoring
export function initializeMonitoring(): void {
  if (typeof window === 'undefined') return;

  // Track unhandled errors
  window.addEventListener('error', (event) => {
    ErrorTracker.track(new Error(event.message));
  });

  // Track unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    ErrorTracker.track(new Error(`Unhandled promise rejection: ${event.reason}`));
  });

  // Log initial memory usage
  setTimeout(trackMemoryUsage, 1000);

  // Log bundle info after page load
  window.addEventListener('load', () => {
    setTimeout(analyzeLoadedScripts, 2000);
  });

  console.log('🚀 Performance monitoring initialized');
}