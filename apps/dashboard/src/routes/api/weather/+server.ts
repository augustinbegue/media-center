import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const LAT = env.WEATHER_LAT ?? '48.8566';
const LON = env.WEATHER_LON ?? '2.3522';

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

export const GET: RequestHandler = async () => {
  const params = new URLSearchParams({
    latitude: LAT,
    longitude: LON,
    current: 'temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m',
    daily: 'temperature_2m_max,temperature_2m_min,weather_code',
    timezone: 'auto',
    forecast_days: '7',
  });

  const res = await fetch(`${BASE_URL}?${params}`, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    return json({ error: 'Upstream failed' }, { status: 502 });
  }

  const raw = await res.json();

  return json({
    current: {
      temperature: raw.current.temperature_2m,
      weatherCode: raw.current.weather_code,
      windspeed: raw.current.wind_speed_10m,
      humidity: raw.current.relative_humidity_2m,
    },
    daily: (raw.daily.time as string[]).map((date: string, i: number) => ({
      date,
      tempMax: raw.daily.temperature_2m_max[i],
      tempMin: raw.daily.temperature_2m_min[i],
      weatherCode: raw.daily.weather_code[i],
    })),
  }, {
    headers: { 'Cache-Control': 'public, max-age=600' },
  });
};
