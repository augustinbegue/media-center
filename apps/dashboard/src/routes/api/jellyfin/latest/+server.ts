import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const BASE = env.JELLYFIN_URL ?? '';
const API_KEY = env.JELLYFIN_API_KEY ?? '';
const HEADERS = { 'X-Emby-Token': API_KEY, 'Accept': 'application/json' };

export const GET: RequestHandler = async () => {
  if (!BASE || !API_KEY) return json([]);

  const usersRes = await fetch(`${BASE}/Users?api_key=${API_KEY}`, {
    headers: HEADERS,
    signal: AbortSignal.timeout(10_000),
  });
  if (!usersRes.ok) return json([]);
  const users = await usersRes.json();
  const userId: string = users[0]?.Id;
  if (!userId) return json([]);

  const params = new URLSearchParams({
    Limit: '12',
    Fields: 'PrimaryImageAspectRatio',
    ImageTypeLimit: '1',
    EnableImageTypes: 'Primary',
    IncludeItemTypes: 'Movie,Series',
  });

  const res = await fetch(`${BASE}/Users/${userId}/Items/Latest?${params}`, {
    headers: HEADERS,
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) return json([]);

  const data: unknown[] = await res.json();
  const items = data.map((item: unknown) => {
    const i = item as Record<string, unknown>;
    return {
      id: i.Id,
      name: i.Name,
      type: i.Type,
      year: i.ProductionYear,
      imageUrl: (i.ImageTags as Record<string, unknown>)?.Primary
        ? `${BASE}/Items/${i.Id}/Images/Primary?api_key=${API_KEY}&maxHeight=300`
        : null,
    };
  });

  return json(items, { headers: { 'Cache-Control': 'public, max-age=300' } });
};
