import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const BASE = env.JELLYFIN_URL ?? '';
const PUBLIC_BASE = env.JELLYFIN_PUBLIC_URL ?? BASE;
const API_KEY = env.JELLYFIN_API_KEY ?? '';
const HEADERS = { 'X-Emby-Token': API_KEY, 'Accept': 'application/json' };

export const GET: RequestHandler = async () => {
  if (!BASE || !API_KEY) return json([], { status: 200 });

  // Get user ID first
  const usersRes = await fetch(`${BASE}/Users?api_key=${API_KEY}`, {
    headers: HEADERS,
    signal: AbortSignal.timeout(10_000),
  });
  if (!usersRes.ok) return json([], { status: 200 });
  const users = await usersRes.json();
  const userId: string = users[0]?.Id;
  if (!userId) return json([]);

  const params = new URLSearchParams({
    Limit: '8',
    Fields: 'PrimaryImageAspectRatio,UserData',
    ImageTypeLimit: '1',
    EnableImageTypes: 'Backdrop,Thumb',
  });

  const res = await fetch(`${BASE}/Users/${userId}/Items/Resume?${params}`, {
    headers: HEADERS,
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) return json([]);

  const data = await res.json();
  const items = (data.Items ?? []).map((item: Record<string, unknown>) => ({
    id: item.Id,
    name: item.Name,
    type: item.Type,
    seriesName: item.SeriesName,
    episodeLabel: item.Type === 'Episode'
      ? `S${String(item.ParentIndexNumber).padStart(2, '0')}E${String(item.IndexNumber).padStart(2, '0')}`
      : undefined,
    imageUrl: item.BackdropImageTags && (item.BackdropImageTags as string[]).length > 0
      ? `${PUBLIC_BASE}/Items/${item.Id}/Images/Backdrop?api_key=${API_KEY}&maxHeight=200`
      : item.ImageTags && (item.ImageTags as Record<string, unknown>).Thumb
        ? `${PUBLIC_BASE}/Items/${item.Id}/Images/Thumb?api_key=${API_KEY}&maxHeight=200`
        : null,
    playedPercent: (item.UserData as Record<string, unknown>)?.PlayedPercentage ?? 0,
  }));

  return json(items, { headers: { 'Cache-Control': 'public, max-age=60' } });
};
