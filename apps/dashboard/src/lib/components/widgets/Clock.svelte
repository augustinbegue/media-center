<script lang="ts">
  import { onMount } from 'svelte';

  type Variant = 'widget' | 'ambient' | 'inline';

  interface Props {
    variant?: Variant;
  }
  let { variant = 'widget' }: Props = $props();

  let now = $state(new Date());

  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  let time = $derived(timeFormatter.format(now));
  let date = $derived(dateFormatter.format(now));
  let seconds = $derived(now.getSeconds());

  // Ticks distributed evenly along the rounded-rectangle perimeter,
  // matching the widget's squircle border shape.
  const TICK_COUNT = 60;
  const TICK_LEN = 4;   // inward tick length (SVG units)

  // Rounded-rect geometry in 0‥100 coordinate space
  const _M = 4;          // margin from SVG edge
  const _S = 92;         // rect side (100 − 2*_M)
  const _RX = 22;        // corner radius — proportional to widget's border-radius
  const _st = _S - 2 * _RX;                   // straight-edge length
  const _arc = (Math.PI * _RX) / 2;           // quarter-arc length
  const _totalPerim = 4 * _st + 4 * _arc;     // total perimeter

  /** Returns a point on the rounded-rect perimeter and its inward unit normal. */
  function pointOnRoundedRect(dist: number): { x: number; y: number; nx: number; ny: number } {
    let rem = ((dist % _totalPerim) + _totalPerim) % _totalPerim;
    // Top edge — left → right
    if (rem < _st) {
      return { x: _M + _RX + (rem / _st) * _st, y: _M, nx: 0, ny: 1 };
    }
    rem -= _st;
    // Top-right arc — −90° → 0°
    if (rem < _arc) {
      const a = -Math.PI / 2 + (rem / _arc) * (Math.PI / 2);
      return { x: (_M + _S - _RX) + _RX * Math.cos(a), y: (_M + _RX) + _RX * Math.sin(a), nx: -Math.cos(a), ny: -Math.sin(a) };
    }
    rem -= _arc;
    // Right edge — top → bottom
    if (rem < _st) {
      return { x: _M + _S, y: _M + _RX + (rem / _st) * _st, nx: -1, ny: 0 };
    }
    rem -= _st;
    // Bottom-right arc — 0° → 90°
    if (rem < _arc) {
      const a = (rem / _arc) * (Math.PI / 2);
      return { x: (_M + _S - _RX) + _RX * Math.cos(a), y: (_M + _S - _RX) + _RX * Math.sin(a), nx: -Math.cos(a), ny: -Math.sin(a) };
    }
    rem -= _arc;
    // Bottom edge — right → left
    if (rem < _st) {
      return { x: _M + _S - _RX - (rem / _st) * _st, y: _M + _S, nx: 0, ny: -1 };
    }
    rem -= _st;
    // Bottom-left arc — 90° → 180°
    if (rem < _arc) {
      const a = Math.PI / 2 + (rem / _arc) * (Math.PI / 2);
      return { x: (_M + _RX) + _RX * Math.cos(a), y: (_M + _S - _RX) + _RX * Math.sin(a), nx: -Math.cos(a), ny: -Math.sin(a) };
    }
    rem -= _arc;
    // Left edge — bottom → top
    if (rem < _st) {
      return { x: _M, y: _M + _S - _RX - (rem / _st) * _st, nx: 1, ny: 0 };
    }
    rem -= _st;
    // Top-left arc — 180° → 270°
    const a = Math.PI + (rem / _arc) * (Math.PI / 2);
    return { x: (_M + _RX) + _RX * Math.cos(a), y: (_M + _RX) + _RX * Math.sin(a), nx: -Math.cos(a), ny: -Math.sin(a) };
  }

  function tickOpacity(i: number): number {
    const secsPerTick = 60 / TICK_COUNT;
    const tickThreshold = i * secsPerTick;
    if (seconds < tickThreshold) return 0.12;
    const age = Math.floor((seconds - tickThreshold) / secsPerTick);
    return Math.max(0.25, 1.0 - age * 0.065);
  }

  onMount(() => {
    const id = setInterval(() => {
      now = new Date();
    }, 1000);
    return () => clearInterval(id);
  });
</script>

{#if variant === 'inline'}
  <!-- Compact inline for pills / top bar -->
  <div class="flex flex-col">
    <span class="text-3xl font-bold text-white/90 tabular-nums tracking-tight">{time}</span>
    <span class="text-sm text-white/50 mt-0.5">{date}</span>
  </div>

{:else if variant === 'ambient'}
  <!-- Large centered clock for Ambient scene -->
  <div class="flex flex-col items-center select-none">
    <span
      class="font-bold text-white/95 tabular-nums tracking-tight leading-none"
      style="font-size: clamp(5rem, 14vw, 12rem);"
    >
      {time}
    </span>
    <span class="text-2xl text-white/60 mt-3 font-light tracking-wide">{date}</span>
  </div>

{:else}
  <!-- Apple HIG small widget layout -->
  <div class="relative flex items-center justify-center h-full w-full select-none">
    <!-- Animated tick marks following the rounded-rectangle border -->
    <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
      {#each Array(TICK_COUNT) as _, i}
        {@const pt = pointOnRoundedRect((i / TICK_COUNT) * _totalPerim)}
        <line
          x1={pt.x}
          y1={pt.y}
          x2={pt.x + pt.nx * TICK_LEN}
          y2={pt.y + pt.ny * TICK_LEN}
          stroke="white"
          stroke-width="1.5"
          stroke-linecap="round"
          opacity={tickOpacity(i)}
        />
      {/each}
    </svg>

    <div class="text-[56px] font-semibold text-white tabular-nums tracking-tight leading-none z-10">
      {time}
    </div>
  </div>
{/if}
