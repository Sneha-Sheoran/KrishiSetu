import { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { updateSession } from './utils/supabase/middleware';

const handleI18nRouting = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  // Step 1: Execute next-intl middleware
  const response = handleI18nRouting(request);

  // Step 2: Pass response to Supabase middleware to handle session updating
  // This modifies the response cookies if the session was refreshed
  return await updateSession(request, response);
}

export const config = {
  // Match only internationalized pathnames, skipping api, _next, static files
  matcher: ['/', '/(hi|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};
