<script lang="ts">
  import { onMount } from 'svelte';

  type Variant = 'small' | 'medium' | 'inline';

  interface Props {
    variant?: Variant;
  }
  let { variant = 'small' }: Props = $props();

  interface WeatherData {
    current: { temperature: number; weatherCode: number; windspeed: number; humidity: number };
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
  <!-- Apple HIG medium widget: current + forecast row -->
  <div class="flex h-full p-4 gap-5">
    <!-- Left: current conditions -->
    <div class="flex flex-col flex-1 min-w-0">
      <div class="flex items-center gap-1.5">
        <span class="widget-label">Weather</span>
      </div>
      {#if weather}
        <div class="mt-auto">
          <div class="text-[42px] font-bold text-white/95 tabular-nums leading-none tracking-tight">
            {Math.round(weather.current.temperature)}°C
          </div>
          <div class="text-[13px] text-white/55 font-medium mt-1">{label(weather.current.weatherCode)}</div>
          <div class="text-[11px] text-white/30 mt-0.5">
            Wind {Math.round(weather.current.windspeed)} km/h · {weather.current.humidity}%
          </div>
        </div>
      {:else}
        <div class="mt-auto text-white/25 text-sm">{error ? 'Unavailable' : 'Loading…'}</div>
      {/if}
    </div>

    <!-- Divider -->
    <div class="w-px bg-white/10 self-stretch my-2"></div>

    <!-- Right: 5-day forecast -->
    {#if weather}
      <div class="flex items-end gap-2 flex-1">
        {#each weather.daily.slice(0, 5) as day}
          <div class="flex flex-col items-center gap-1.5 flex-1">
            <span class="text-[9px] font-bold text-white/35 uppercase tracking-widest">
              {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
            </span>
            <span class="text-base select-none">{icon(day.weatherCode)}</span>
            <span class="text-xs font-semibold text-white/80 tabular-nums">{Math.round(day.tempMax)}°</span>
            <span class="text-[9px] text-white/30 tabular-nums">{Math.round(day.tempMin)}°</span>
          </div>
        {/each}
      </div>
    {/if}
  </div>

{:else}
  <!-- Apple HIG small widget: current conditions -->
  <div class="flex flex-col h-full p-4">
    <div class="flex items-center justify-between">
      <span class="widget-label">Weather</span>
      {#if weather}
        <span class="text-2xl select-none">{icon(weather.current.weatherCode)}</span>
      {/if}
    </div>
    {#if weather}
      <div class="mt-auto">
        <div class="text-[44px] font-bold text-white/95 tabular-nums leading-none tracking-tight">
          {Math.round(weather.current.temperature)}°
        </div>
        <div class="text-[13px] text-white/50 mt-1 font-medium">{label(weather.current.weatherCode)}</div>
        <div class="text-[11px] text-white/30 mt-0.5">
          H:{Math.round(weather.daily[0]?.tempMax ?? 0)}° L:{Math.round(weather.daily[0]?.tempMin ?? 0)}°
        </div>
      </div>
    {:else}
      <div class="mt-auto text-white/25 text-sm {error ? '' : 'liquid-skeleton rounded-xl px-3 py-2 inline-block'}">
        {error ? 'Unavailable' : 'Loading…'}
      </div>
    {/if}
  </div>
{/if}
