import { getRequestConfig } from 'next-intl/server';
import { headers } from 'next/headers';

export default getRequestConfig(async ({ locale }) => {
  // The locale parameter is automatically provided by Next.js based on the URL segment
  // Validate the locale and provide fallback
  const validLocale = ['fr', 'ar'].includes(locale as string) ? locale : 'fr';

  return {
    locale: validLocale,
    messages: (await import(`./messages/${validLocale}.json`)).default
  };
});