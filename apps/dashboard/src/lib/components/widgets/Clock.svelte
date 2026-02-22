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
  <div class="flex flex-col h-full p-4">
    <div class="flex items-center gap-1.5">
      <span class="widget-label">Clock</span>
    </div>
    <div class="mt-auto">
      <div class="text-[44px] font-bold text-white/95 tabular-nums tracking-tight leading-none">
        {time}
      </div>
      <div class="text-[13px] text-white/50 mt-2 font-medium">{date}</div>
    </div>
  </div>
{/if}
