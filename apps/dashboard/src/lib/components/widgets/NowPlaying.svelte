<script lang="ts">
  import { LiquidSurface } from '$lib/components/ui/liquid';
  import { agent } from '$lib/stores/agent.svelte';

  let uxplay = $derived(agent.uxplay);
  let meta = $derived(uxplay.metadata);
</script>

<div class="flex items-center gap-6 w-full">
  <!-- Album art -->
  <LiquidSurface
    class="overflow-hidden flex-shrink-0"
    radius="sm"
    tone="soft"
    blur="soft"
    style="width: 80px; height: 80px; background: rgba(255,255,255,0.08);"
  >
    {#if meta?.artwork}
      <img src={meta.artwork} alt="Album art" class="w-full h-full object-cover" />
    {:else}
      <div class="w-full h-full flex items-center justify-center text-3xl">♪</div>
    {/if}
  </LiquidSurface>

  <!-- Track info -->
  <div class="flex flex-col min-w-0">
    <span class="text-white/95 font-semibold text-lg truncate">{meta?.title || 'Unknown Track'}</span>
    <span class="text-white/60 text-sm truncate mt-0.5">{meta?.artist || 'Unknown Artist'}</span>
    {#if meta?.album}
      <span class="text-white/35 text-xs truncate mt-0.5">{meta.album}</span>
    {/if}
  </div>
</div>
