import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  // Debug logging
  console.log('🌐 i18n request config - locale received:', locale);
  console.log('🌐 i18n request config - typeof locale:', typeof locale);

  // Ensure we have a valid locale with fallback
  const validLocale = locale && ['fr', 'ar'].includes(locale) ? locale : 'fr';

  console.log('🌐 i18n request config - validLocale:', validLocale);

  return {
    locale: validLocale,
    messages: (await import(`./messages/${validLocale}.json`)).default
  };
});