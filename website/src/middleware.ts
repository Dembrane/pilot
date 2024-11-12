import { type NextRequest, NextResponse } from 'next/server';

import Negotiator from 'negotiator';
import linguiConfig from '../lingui.config';

const { locales, sourceLocale } = linguiConfig;

const DEBUG = false;

// Add this regex to match public files
const PUBLIC_FILE = /\.(.*)$/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for direct 32-character Notion ID URLs
  const notionIdRegex = /^\/([0-9a-f]{32})$/;
  const match = pathname.match(notionIdRegex);

  if (match) {
    const notionId = match[1];
    const url = request.nextUrl.clone();
    url.pathname = `en-US/notion/${notionId}`;
    return NextResponse.redirect(url);
  }

  // Add early return for public files and other static assets like Notion pages
  if (
    PUBLIC_FILE.test(pathname) ||
    pathname.startsWith('/blog/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/notion/') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  if (DEBUG)
    console.log(`[Middleware] Processing request for path: ${pathname}`);

  const pathnameHasLocale = locales.some(
    (locale: string) =>
      pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (pathnameHasLocale) {
    if (DEBUG)
      console.log(`[Middleware] Path already has locale, no redirect needed`);

    return NextResponse.next({
      headers: {
        'Set-Cookie': `NEXT_LOCALE=${pathname.split('/')[1]}; Path=/; HttpOnly; SameSite=Strict`,
      },
    });
  }

  // Check for a cookie that stores the user's language preference
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;

  // If a cookie exists, use that locale
  if (cookieLocale && locales.includes(cookieLocale)) {
    if (DEBUG)
      console.log(`[Middleware] Using locale from cookie: ${cookieLocale}`);
    request.nextUrl.pathname = `/${cookieLocale}${pathname}`;
    return NextResponse.redirect(request.nextUrl, {
      headers: {
        'Set-Cookie': `NEXT_LOCALE=${cookieLocale}; Path=/; HttpOnly; SameSite=Strict`,
      },
    });
  }

  // If no cookie, use the negotiated locale
  const locale = getRequestLocale(request);

  if (DEBUG) console.log(`[Middleware] Using negotiated locale: ${locale}`);
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl, {
    headers: {
      'Set-Cookie': `NEXT_LOCALE=${locale}; Path=/; HttpOnly; SameSite=Strict`,
    },
  });
}

function getRequestLocale(request: NextRequest): string {
  const langHeader = request.headers.get('accept-language');
  const languages = new Negotiator({
    headers: { 'accept-language': langHeader || undefined },
  }).languages(locales);

  return languages[0] || sourceLocale || 'en';
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};
