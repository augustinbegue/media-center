import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

type JsonObject = Record<string, unknown>;

type Departure = {
  id: string;
  line: string;
  destination: string;
  expectedDepartureTime: string;
  minutes: number;
};

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function getString(value: unknown): string | null {
  return isString(value) && value.trim().length > 0 ? value.trim() : null;
}

function extractText(value: unknown): string | null {
  const direct = getString(value);
  if (direct) return direct;

  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = extractText(item);
      if (nested) return nested;
    }
    return null;
  }

  if (!isObject(value)) return null;

  const objectValue =
    value.value
    ?? value.text
    ?? value.Name
    ?? value.name
    ?? value.Text
    ?? value.Message;

  return extractText(objectValue);
}

function getNestedString(value: unknown, keys: string[]): string | null {
  if (!isObject(value)) return null;
  for (const key of keys) {
    const text = extractText(value[key]);
    if (text) return text;
  }
  return null;
}

function collectObjects(input: unknown, bucket: JsonObject[] = []): JsonObject[] {
  if (Array.isArray(input)) {
    for (const item of input) collectObjects(item, bucket);
    return bucket;
  }

  if (!isObject(input)) return bucket;

  bucket.push(input);
  for (const value of Object.values(input)) {
    collectObjects(value, bucket);
  }
  return bucket;
}

function toIsoDate(value: unknown): string | null {
  const raw = getString(value);
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function toMinutes(expectedDepartureTime: string, nowMs: number): number {
  const timeMs = new Date(expectedDepartureTime).getTime();
  if (Number.isNaN(timeMs)) return 0;
  return Math.max(0, Math.floor((timeMs - nowMs) / 60_000));
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function extractDepartures(payload: unknown, limit: number, nowMs: number): Departure[] {
  const objects = collectObjects(payload);
  const departures: Departure[] = [];
  const seen = new Set<string>();

  for (const item of objects) {
    const expectedDepartureTime = toIsoDate(
      item.ExpectedDepartureTime
      ?? item.ExpectedArrivalTime
      ?? item.AimedDepartureTime
      ?? item.AimedArrivalTime
      ?? item.DepartureTime
      ?? item.OriginAimedDepartureTime
    );
    if (!expectedDepartureTime) continue;

    const id = getNestedString(item, [
      'StopVisitRef',
      'DatedVehicleJourneyRef',
      'VehicleJourneyRef',
      'JourneyRef',
      'ItemIdentifier',
      'id',
      'Id',
    ]) ?? `${expectedDepartureTime}-${departures.length}`;

    const line = getNestedString(item, [
      'PublishedLineName',
      'LineName',
      'LineRef',
      'Line',
      'RouteRef',
      'RouteName',
    ]) ?? 'N/A';

    const destination = getNestedString(item, [
      'DestinationName',
      'DestinationRef',
      'DirectionName',
      'DirectionRef',
      'DestinationDisplay',
      'Destination',
    ]) ?? 'N/A';

    const dedupeKey = `${id}|${line}|${destination}|${expectedDepartureTime}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    departures.push({
      id,
      line,
      destination,
      expectedDepartureTime,
      minutes: toMinutes(expectedDepartureTime, nowMs),
    });
  }

  departures.sort((a, b) =>
    new Date(a.expectedDepartureTime).getTime() - new Date(b.expectedDepartureTime).getTime()
  );

  return departures.slice(0, limit);
}

function shortenMessage(text: string): string {
  const compact = text.replace(/\s+/g, ' ').trim();
  return compact.length <= 140 ? compact : `${compact.slice(0, 137).trimEnd()}...`;
}

function extractDisruptions(payload: unknown): string[] {
  const objects = collectObjects(payload);
  const candidates: string[] = [];

  for (const item of objects) {
    const message = getNestedString(item, [
      'MessageText',
      'Message',
      'Text',
      'Summary',
      'Description',
      'Content',
      'Title',
      'Reason',
      'InfoMessageIdentifier',
    ]);

    if (message && message.length >= 4) {
      candidates.push(shortenMessage(message));
    }
  }

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const candidate of candidates) {
    const key = candidate.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(candidate);
    if (unique.length >= 3) break;
  }

  return unique;
}

async function fetchJsonSafe(url: string, headers: HeadersInit): Promise<unknown | null> {
  try {
    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export const GET: RequestHandler = async () => {
  const primApiKey = env.PRIM_API_KEY ?? '';
  const primBaseUrl = env.PRIM_BASE_URL ?? 'https://prim.iledefrance-mobilites.fr/marketplace';
  const primNextDeparturesUrl = env.PRIM_NEXT_DEPARTURES_URL ?? `${primBaseUrl}/stop-monitoring`;
  const primMessagesUrl = env.PRIM_MESSAGES_URL ?? `${primBaseUrl}/general-message`;
  const primMonitoringRef = env.PRIM_MONITORING_REF;
  const primLineRef = env.PRIM_LINE_REF;
  const primDestinationRef = env.PRIM_DESTINATION_REF;
  const primLimit = parsePositiveInt(env.PRIM_LIMIT, 4);
  const stopLabel = env.PRIM_STOP_LABEL ?? 'Transit';

  if (!primApiKey) {
    return json({ stopLabel, departures: [], disruptions: [], error: 'Missing PRIM_API_KEY' }, { status: 200 });
  }

  const params = new URLSearchParams();
  if (primMonitoringRef) params.set('MonitoringRef', primMonitoringRef);
  if (primLineRef) params.set('LineRef', primLineRef);
  if (primDestinationRef) params.set('DestinationRef', primDestinationRef);
  params.set('MaximumStopVisits', String(primLimit));

  const headers: HeadersInit = {
    Accept: 'application/json',
    apikey: primApiKey,
  };

  let departures: Departure[] = [];
  let disruptions: string[] = [];

  try {
    const departuresUrl = new URL(primNextDeparturesUrl);
    for (const [key, value] of params.entries()) {
      departuresUrl.searchParams.set(key, value);
    }

    const [departuresPayload, messagesPayload] = await Promise.all([
      fetchJsonSafe(departuresUrl.toString(), headers),
      fetchJsonSafe(primMessagesUrl, headers),
    ]);

    const nowMs = Date.now();
    departures = departuresPayload ? extractDepartures(departuresPayload, primLimit, nowMs) : [];
    disruptions = messagesPayload ? extractDisruptions(messagesPayload) : [];
  } catch {
    departures = [];
    disruptions = [];
  }

  return json(
    {
      stopLabel,
      departures,
      disruptions,
      fetchedAt: new Date().toISOString(),
    },
    {
      headers: { 'Cache-Control': 'public, max-age=30' },
    }
  );
};
