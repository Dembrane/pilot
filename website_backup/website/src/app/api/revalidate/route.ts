import { revalidatePath } from 'next/cache';
import { NextRequest } from 'next/server';

const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET_NEXT;

if (!REVALIDATE_SECRET) {
  throw new Error('REVALIDATE_SECRET is not set');
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  const path = request.nextUrl.searchParams.get('path');

  if (secret !== REVALIDATE_SECRET) {
    return Response.json({
      revalidated: false,
      now: Date.now(),
      message: 'Invalid secret',
    });
  }

  if (path) {
    // specific path
    revalidatePath(path, 'page');
  } else {
    // this means revalidate the entire layout (everyting)
    revalidatePath('/', 'layout');
  }

  return Response.json({
    revalidated: true,
    now: Date.now(),
    message: 'Revalidated ' + (path ? path : '/'),
  });
}
