import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const BASE = (env.IMMICH_URL ?? '').replace(/\/$/, '');
const API_KEY = env.IMMICH_API_KEY ?? '';

export const GET: RequestHandler = async ({ params, url }) => {
  if (!BASE || !API_KEY) {
    return new Response('Immich not configured', { status: 503 });
  }

  const size = url.searchParams.get('size') === 'thumbnail' ? 'thumbnail' : 'preview';
  const upstream = `${BASE}/assets/${encodeURIComponent(params.id)}/thumbnail?size=${size}`;

  let res: Response;
  try {
    res = await fetch(upstream, {
      headers: {
        'x-api-key': API_KEY,
        'Accept': 'image/*',
      },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return new Response('Upstream timeout', { status: 504 });
  }

  if (!res.ok || !res.body) {
    return new Response('Upstream error', { status: res.status || 502 });
  }

  const headers = new Headers();
  headers.set('Cache-Control', 'public, max-age=3600');

  const contentType = res.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);

  const etag = res.headers.get('etag');
  if (etag) headers.set('ETag', etag);

  return new Response(res.body, {
    status: 200,
    headers,
  });
};
