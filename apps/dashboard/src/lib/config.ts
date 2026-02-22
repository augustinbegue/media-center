import { env } from '$env/dynamic/public';

export const AGENT_WS_URL = env.PUBLIC_AGENT_WS_URL ?? 'ws://localhost:9100';
export const WEATHER_LAT = env.PUBLIC_WEATHER_LAT ?? '48.8566';
export const WEATHER_LON = env.PUBLIC_WEATHER_LON ?? '2.3522';
export const AMBIENT_START = env.PUBLIC_AMBIENT_START ?? '23:00';
export const AMBIENT_END = env.PUBLIC_AMBIENT_END ?? '07:00';

/** Returns true if current time is within the ambient (night) window */
export function isAmbientTime(): boolean {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const current = h * 60 + m;

  const [startH, startM] = AMBIENT_START.split(':').map(Number);
  const [endH, endM] = AMBIENT_END.split(':').map(Number);
  const start = startH * 60 + startM;
  const end = endH * 60 + endM;

  // Wraps midnight
  if (start > end) {
    return current >= start || current < end;
  }
  return current >= start && current < end;
}
