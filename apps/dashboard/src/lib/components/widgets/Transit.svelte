<script lang="ts">
  import { onMount } from 'svelte';

  interface Departure {
    id: string;
    line: string;
    destination: string;
    expectedDepartureTime: string;
    minutes: number;
  }

  interface TransitResponse {
    stopLabel: string;
    departures: Departure[];
    disruptions: string[];
    fetchedAt: string;
    error?: string;
  }

  let loading = $state(true);
  let stopLabel = $state('');
  let departures = $state<Departure[]>([]);
  let disruptions = $state<string[]>([]);
  let apiError = $state<string | undefined>(undefined);

  function normalizeResponse(payload: unknown): TransitResponse | null {
    if (!payload || typeof payload !== 'object') return null;

    const maybe = payload as Partial<TransitResponse>;
    return {
      stopLabel: typeof maybe.stopLabel === 'string' ? maybe.stopLabel : '',
      departures: Array.isArray(maybe.departures)
        ? maybe.departures
            .filter((item): item is Departure => {
              if (!item || typeof item !== 'object') return false;
              const d = item as Partial<Departure>;
              return (
                typeof d.id === 'string' &&
                typeof d.line === 'string' &&
                typeof d.destination === 'string' &&
                typeof d.expectedDepartureTime === 'string' &&
                typeof d.minutes === 'number'
              );
            })
            .slice(0, 4)
        : [],
      disruptions: Array.isArray(maybe.disruptions)
        ? maybe.disruptions.filter((item): item is string => typeof item === 'string')
        : [],
      fetchedAt: typeof maybe.fetchedAt === 'string' ? maybe.fetchedAt : '',
      error: typeof maybe.error === 'string' ? maybe.error : undefined,
    };
  }

  async function fetchTransit() {
    try {
      const res = await fetch('/api/transit/prim');
      if (!res.ok) {
        apiError = `Status ${res.status}`;
        return;
      }

      const parsed = normalizeResponse(await res.json());
      if (!parsed) {
        apiError = 'Malformed response';
        return;
      }

      stopLabel = parsed.stopLabel;
      departures = parsed.departures;
      disruptions = parsed.disruptions;
      apiError = parsed.error;
    } catch {
      apiError = 'Transit data unavailable';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchTransit();
    const id = setInterval(fetchTransit, 30 * 1000);
    return () => clearInterval(id);
  });
</script>

<div class="flex flex-col h-full">
  <div class="flex items-center justify-between gap-2 px-4 pt-4 pb-2">
    <span class="widget-label">Transit</span>
    <span class="text-white/45 text-[10px] font-semibold uppercase tracking-wider truncate max-w-[55%]">
      {stopLabel || '—'}
    </span>
  </div>

  {#if loading}
    <div class="flex flex-col gap-2 px-4 pb-2">
      {#each Array(4) as _}
        <div class="widget-item-card px-3 py-2.5">
          <div class="liquid-skeleton rounded-lg h-8 w-full"></div>
        </div>
      {/each}
    </div>
  {:else if departures.length === 0}
    <div class="flex-1 flex items-center justify-center px-4 pb-2">
      <p class="text-white/30 text-sm">No upcoming departures</p>
    </div>
  {:else}
    <div class="flex flex-col gap-1.5 px-4 pb-2">
      {#each departures as departure}
        <div class="widget-item-card flex items-center gap-3 px-3 py-2.5">
          <span class="shrink-0 rounded-md bg-white/10 text-white/85 text-[10px] font-bold uppercase tracking-wider px-2 py-1 min-w-10 text-center">
            {departure.line}
          </span>
          <span class="flex-1 min-w-0 text-white/82 text-[12px] font-medium truncate">
            {departure.destination}
          </span>
          <span class="shrink-0 text-[10px] font-semibold text-white/45 tabular-nums">
            {departure.minutes === 0 ? 'Now' : `${departure.minutes} min`}
          </span>
        </div>
      {/each}
    </div>
  {/if}

  <div class="mt-auto px-4 pb-4 pt-1 flex flex-col gap-1.5">
    {#if disruptions.length > 0}
      <div class="widget-item-card flex items-center gap-2 px-2.5 py-1.5">
        <span class="text-[11px]">⚠️</span>
        <span class="text-white/50 text-[10px] truncate">{disruptions[0]}</span>
      </div>
    {/if}

    {#if apiError}
      <p class="text-white/35 text-[10px] truncate">Status: {apiError}</p>
    {/if}
  </div>
</div>
