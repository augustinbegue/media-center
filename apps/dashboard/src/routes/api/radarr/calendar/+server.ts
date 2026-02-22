import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const BASE = env.RADARR_URL ?? '';
const PUBLIC_BASE = env.RADARR_PUBLIC_URL ?? BASE;
const API_KEY = env.RADARR_API_KEY ?? '';

function toPublicImageUrl(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw) return null;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  const normalized = raw.startsWith('/') ? raw : `/${raw}`;
  return `${PUBLIC_BASE}${normalized}`;
}

export const GET: RequestHandler = async () => {
  if (!BASE || !API_KEY) return json([]);

  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 30);

  const params = new URLSearchParams({
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
    unmonitored: 'false',
  });

  const res = await fetch(`${BASE}/api/v3/calendar?${params}`, {
    headers: { 'X-Api-Key': API_KEY, 'Accept': 'application/json' },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) return json([]);

  const data: unknown[] = await res.json();
  const items = data.map((m: unknown) => {
    const movie = m as Record<string, unknown>;
    const images = Array.isArray(movie.images)
      ? (movie.images as Record<string, unknown>[])
      : [];
    const poster = images.find((img) => img.coverType === 'poster' || img.coverType === 'fanart' || img.coverType === 'banner');
    const imageUrl = toPublicImageUrl(poster?.remoteUrl ?? poster?.url);

    return {
      id: String(movie.id),
      title: movie.title as string,
      subtitle: String(movie.year ?? ''),
      airDate: (movie.digitalRelease ?? movie.physicalRelease ?? movie.inCinemas) as string,
      type: 'movie',
      imageUrl,
    };
  }).filter((item) => item.airDate);

  return json(items, { headers: { 'Cache-Control': 'public, max-age=3600' } });
};
