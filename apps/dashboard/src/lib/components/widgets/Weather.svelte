<script lang="ts">
  import { onMount } from 'svelte';

  type Variant = 'small' | 'medium' | 'inline';

  interface Props {
    variant?: Variant;
  }
  let { variant = 'small' }: Props = $props();

  interface WeatherData {
    current: { temperature: number; weatherCode: number; windspeed: number; humidity: number };
    hourly: { time: string; temperature: number; weatherCode: number }[];
    daily: { date: string; tempMax: number; tempMin: number; weatherCode: number }[];
  }

  let weather = $state<WeatherData | null>(null);
  let error = $state(false);

  const WMO_ICONS: Record<number, string> = {
    0:'☀️',1:'🌤',2:'⛅',3:'☁️',45:'🌫',48:'🌫',
    51:'🌦',61:'🌧',71:'🌨',80:'🌦',81:'🌧',95:'⛈',96:'⛈',99:'⛈',
  };
  const WMO_LABELS: Record<number, string> = {
    0:'Clear',1:'Mostly clear',2:'Partly cloudy',3:'Overcast',
    45:'Foggy',48:'Foggy',51:'Light drizzle',61:'Light rain',
    71:'Light snow',80:'Showers',81:'Heavy showers',95:'Thunderstorm',96:'Thunderstorm',99:'Thunderstorm',
  };
  const icon  = (c: number) => WMO_ICONS[c]  ?? '🌡️';
  const label = (c: number) => WMO_LABELS[c] ?? 'Unknown';

  async function fetchWeather() {
    try {
      const res = await fetch('/api/weather');
      if (!res.ok) throw new Error('failed');
      weather = await res.json();
      error = false;
    } catch { error = true; }
  }

  let currentHourIndex = $derived(weather ? weather.hourly.findIndex(h => new Date(h.time).getTime() > Date.now()) - 1 : 0);
  let upcomingHours = $derived(weather ? weather.hourly.slice(Math.max(0, currentHourIndex), Math.max(0, currentHourIndex) + 6) : []);

  onMount(() => {
    fetchWeather();
    const id = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(id);
  });
</script>

{#if variant === 'inline'}
  <!-- Compact inline for Ambient scene -->
  <div class="flex items-center gap-3">
    {#if weather}
      <span class="text-2xl select-none">{icon(weather.current.weatherCode)}</span>
      <div>
        <div class="text-xl font-bold text-white/92 tabular-nums">{Math.round(weather.current.temperature)}°</div>
        <div class="text-[10px] text-white/45">{label(weather.current.weatherCode)}</div>
      </div>
    {:else}
      <span class="text-white/25 text-xs">{error ? 'Unavailable' : 'Loading…'}</span>
    {/if}
  </div>

{:else if variant === 'medium'}
  <!-- Apple HIG medium widget: current + hourly forecast -->
  <div class="flex flex-col h-full p-4 justify-between">
    {#if weather}
      <div class="flex justify-between items-start">
        <div class="flex flex-col">
          <div class="flex items-center gap-1 text-white font-semibold text-[15px]">
            Paris
            <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 3L3 10.53v.98l6.84 2.65L12.48 21h.98L21 3z"/>
            </svg>
          </div>
          <div class="text-[54px] font-light text-white tabular-nums leading-none tracking-tight mt-1">
            {Math.round(weather.current.temperature)}°
          </div>
        </div>
        <div class="flex flex-col items-end gap-1 mt-1">
          <div class="text-2xl">
            {icon(weather.current.weatherCode)}
          </div>
        </div>
      </div>

      <div class="flex justify-between items-end w-full mt-auto">
        {#each upcomingHours as hour}
          <div class="flex flex-col items-center gap-1.5">
            <span class="text-[13px] font-medium text-white/90">
              {new Date(hour.time).getHours()}
            </span>
            <span class="text-lg select-none">{icon(hour.weatherCode)}</span>
            <span class="text-[15px] font-medium text-white tabular-nums">{Math.round(hour.temperature)}°</span>
          </div>
        {/each}
      </div>
    {:else}
      <div class="mt-auto text-white/25 text-sm">{error ? 'Unavailable' : 'Loading…'}</div>
    {/if}
  </div>

{:else}
  <!-- Apple HIG small widget: current conditions -->
  <div class="flex flex-col h-full p-4 justify-between">
    {#if weather}
      <div class="flex flex-col">
        <div class="flex items-center gap-1 text-white font-semibold text-[15px]">
          Paris
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 3L3 10.53v.98l6.84 2.65L12.48 21h.98L21 3z"/>
          </svg>
        </div>
        <div class="text-[54px] font-light text-white tabular-nums leading-none tracking-tight mt-1">
          {Math.round(weather.current.temperature)}°
        </div>
      </div>
      
      <div class="flex flex-col gap-1 mt-auto">
        <span class="text-xl">{icon(weather.current.weatherCode)}</span>
      </div>
    {:else}
      <div class="mt-auto text-white/25 text-sm {error ? '' : 'liquid-skeleton rounded-xl px-3 py-2 inline-block'}">
        {error ? 'Unavailable' : 'Loading…'}
      </div>
    {/if}
  </div>
{/if}
