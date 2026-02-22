import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const BASE = env.SONARR_URL ?? '';
const API_KEY = env.SONARR_API_KEY ?? '';

export const GET: RequestHandler = async () => {
  if (!BASE || !API_KEY) return json([]);

  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 14);

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
  const items = data.map((ep: unknown) => {
    const e = ep as Record<string, unknown>;
    const series = e.series as Record<string, unknown> | undefined;
    return {
      id: String(e.id),
      title: series?.title ?? e.seriesTitle ?? 'Unknown Series',
      subtitle: `S${String(e.seasonNumber).padStart(2, '0')}E${String(e.episodeNumber).padStart(2, '0')} · ${e.title}`,
      airDate: e.airDateUtc as string,
      type: 'episode',
      imageUrl: null,
    };
  });

  return json(items, { headers: { 'Cache-Control': 'public, max-age=1800' } });
};
