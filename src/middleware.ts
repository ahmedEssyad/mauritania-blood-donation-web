import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['fr', 'ar'],

  // Used when no locale matches
  defaultLocale: 'fr',

  // Always use locale prefix for all routes
  localePrefix: 'always'
});

export const config = {
  // Match only internationalized pathnames including dynamic segments
  matcher: [
    // Match all pathnames except for
    // - Next.js internals
    // - Static files
    '/((?!_next|.*\\..*|favicon.ico).*)'
  ]
};