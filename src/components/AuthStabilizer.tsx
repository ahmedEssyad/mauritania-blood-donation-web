'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export function AuthStabilizer() {
  const pathname = usePathname();
  const { isAuthenticated, refreshUser } = useAuth();

  useEffect(() => {
    // Only refresh if authenticated and not on auth pages
    if (isAuthenticated && !pathname.includes('/auth/')) {
      // Small delay to allow navigation to complete
      const timer = setTimeout(() => {
        refreshUser();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [pathname, isAuthenticated, refreshUser]);

  return null; // This component doesn't render anything
}