import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const BASE = env.RADARR_URL ?? '';
const API_KEY = env.RADARR_API_KEY ?? '';

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
    return {
      id: String(movie.id),
      title: movie.title as string,
      subtitle: String(movie.year ?? ''),
      airDate: (movie.digitalRelease ?? movie.physicalRelease ?? movie.inCinemas) as string,
      type: 'movie',
      imageUrl: null,
    };
  }).filter((item) => item.airDate);

  return json(items, { headers: { 'Cache-Control': 'public, max-age=3600' } });
};
