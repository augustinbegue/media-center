import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

type FeaturedSource = 'explore' | 'memories' | 'off';
type PhotoSource = 'explore' | 'memories' | 'album' | 'random' | 'none';

interface PhotoItem {
  id: string;
  type?: string;
  createdAt?: string;
  thumbnailUrl: string;
}

interface PhotosResponse {
  source: PhotoSource;
  photos: PhotoItem[];
}

const BASE = (env.IMMICH_URL ?? '').replace(/\/$/, '');
const API_KEY = env.IMMICH_API_KEY ?? '';
const FALLBACK_ALBUM_ID = env.IMMICH_FALLBACK_ALBUM_ID ?? '';
const FEATURED_SOURCE: FeaturedSource = normalizeFeaturedSource(env.IMMICH_FEATURED_SOURCE);
const FETCH_SIZE = normalizeFetchSize(env.IMMICH_FETCH_SIZE);
const ALLOW_RANDOM_FALLBACK = (env.IMMICH_ALLOW_RANDOM_FALLBACK ?? 'false').toLowerCase() === 'true';

function normalizeFeaturedSource(raw: string | undefined): FeaturedSource {
  const value = (raw ?? 'explore').toLowerCase();
  if (value === 'off' || value === 'none') return 'off';
  if (value === 'memories') return 'memories';
  return 'explore';
}

function normalizeFetchSize(raw: string | undefined): number {
  const parsed = Number.parseInt(raw ?? '8', 10);
  if (!Number.isFinite(parsed)) return 8;
  return Math.max(1, Math.min(parsed, 24));
}

function hasAssetId(value: unknown): value is { id: string } {
  return !!value && typeof value === 'object' && typeof (value as { id?: unknown }).id === 'string';
}

function collectAssets(value: unknown, maxCount: number): Array<Record<string, unknown>> {
  const results: Array<Record<string, unknown>> = [];
  const seen = new Set<string>();

  const walk = (node: unknown, depth: number) => {
    if (results.length >= maxCount || depth > 6 || node == null) return;

    if (Array.isArray(node)) {
      for (const item of node) {
        walk(item, depth + 1);
        if (results.length >= maxCount) break;
      }
      return;
    }

    if (typeof node !== 'object') return;

    const record = node as Record<string, unknown>;
    if (hasAssetId(record)) {
      const id = record.id;
      if (!seen.has(id)) {
        seen.add(id);
        results.push(record);
      }
    }

    for (const child of Object.values(record)) {
      walk(child, depth + 1);
      if (results.length >= maxCount) break;
    }
  };

  walk(value, 0);
  return results;
}

function toPhotos(items: Array<Record<string, unknown>>): PhotoItem[] {
  return items.map((item) => {
    const id = String(item.id);
    const type = typeof item.type === 'string' ? item.type : undefined;
    const createdAt = typeof item.fileCreatedAt === 'string'
      ? item.fileCreatedAt
      : (typeof item.createdAt === 'string' ? item.createdAt : undefined);

    return {
      id,
      type,
      createdAt,
      thumbnailUrl: `/api/immich/assets/${id}/thumbnail?size=preview`,
    };
  });
}

async function immichFetch(path: string, init?: RequestInit): Promise<Response | null> {
  if (!BASE || !API_KEY) return null;

  try {
    return await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        'x-api-key': API_KEY,
        'Accept': 'application/json',
        ...(init?.headers ?? {}),
      },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return null;
  }
}

async function tryFeatured(): Promise<PhotosResponse | null> {
  if (FEATURED_SOURCE === 'off') return null;

  if (FEATURED_SOURCE === 'explore') {
    const res = await immichFetch('/search/explore');
    if (!res?.ok) return null;
    const raw = await res.json();
    const assets = collectAssets(raw, FETCH_SIZE);
    if (assets.length === 0) return null;
    return { source: 'explore', photos: toPhotos(assets) };
  }

  const res = await immichFetch('/memories');
  if (!res?.ok) return null;
  const raw = await res.json();
  const assets = collectAssets(raw, FETCH_SIZE);
  if (assets.length === 0) return null;
  return { source: 'memories', photos: toPhotos(assets) };
}

async function tryAlbumFallback(): Promise<PhotosResponse | null> {
  if (!FALLBACK_ALBUM_ID) return null;

  const body = {
    albumIds: [FALLBACK_ALBUM_ID],
    size: FETCH_SIZE,
    page: 1,
    order: 'desc',
    type: 'IMAGE',
  };

  const res = await immichFetch('/search/metadata', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res?.ok) return null;
  const raw = await res.json();
  const assets = collectAssets(raw, FETCH_SIZE);
  if (assets.length === 0) return null;

  return {
    source: 'album',
    photos: toPhotos(assets),
  };
}

async function tryRandomFallback(): Promise<PhotosResponse | null> {
  if (!ALLOW_RANDOM_FALLBACK) return null;

  const res = await immichFetch('/search/random', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ size: FETCH_SIZE }),
  });

  if (!res?.ok) return null;
  const raw = await res.json();
  const assets = collectAssets(raw, FETCH_SIZE);
  if (assets.length === 0) return null;

  return {
    source: 'random',
    photos: toPhotos(assets),
  };
}

export const GET: RequestHandler = async () => {
  if (!BASE || !API_KEY) {
    return json({ source: 'none', photos: [] } satisfies PhotosResponse, {
      headers: { 'Cache-Control': 'public, max-age=60' },
    });
  }

  const featured = await tryFeatured();
  if (featured) {
    return json(featured, { headers: { 'Cache-Control': 'public, max-age=120' } });
  }

  const album = await tryAlbumFallback();
  if (album) {
    return json(album, { headers: { 'Cache-Control': 'public, max-age=120' } });
  }

  const random = await tryRandomFallback();
  if (random) {
    return json(random, { headers: { 'Cache-Control': 'public, max-age=120' } });
  }

  return json({ source: 'none', photos: [] } satisfies PhotosResponse, {
    headers: { 'Cache-Control': 'public, max-age=60' },
  });
};
