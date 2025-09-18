import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { AuthProvider } from '@/contexts/AuthContext';
import { PWAProvider } from '@/contexts/PWAContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { cn } from '@/lib/utils';
import MonitoringInitializer from '@/components/MonitoringInitializer';

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Ensure we have a valid locale with fallback
  const validLocale = locale && ['fr', 'ar'].includes(locale) ? locale : 'fr';
  const messages = await getMessages({ locale: validLocale });

  return (
    <html lang={validLocale} dir={validLocale === 'ar' ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ef4444" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="DonSang MR" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          validLocale === 'ar' && 'font-arabic'
        )}
        suppressHydrationWarning
      >
        <NextIntlClientProvider locale={validLocale} messages={messages}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}