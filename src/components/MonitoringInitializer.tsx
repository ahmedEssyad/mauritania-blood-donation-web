'use client';

import { useEffect } from 'react';
import { initializeMonitoring } from '@/lib/monitoring';

export default function MonitoringInitializer() {
  useEffect(() => {
    // Only initialize in production or when explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_MONITORING === 'true') {
      initializeMonitoring();
    }
  }, []);

  return null;
}