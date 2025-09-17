import { getRequestConfig } from 'next-intl/server';
import { headers } from 'next/headers';

export default getRequestConfig(async () => {
  // This can either be defined statically if only a single locale
  // is supported, or alternatively read from the user settings,
  // a database, the `Accept-Language` header, etc.
  let locale = 'fr'; // Default to French

  try {
    // Try to get locale from headers or other sources
    const headersList = headers();
    const acceptLanguage = headersList.get('accept-language');

    if (acceptLanguage?.includes('ar')) {
      locale = 'ar';
    }
  } catch (error) {
    // Fallback to French if there's any error
    locale = 'fr';
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});