<script lang="ts">
  import { onMount } from 'svelte';

  interface Item {
    id: string;
    name: string;
    type: string;
    imageUrl: string | null;
    playedPercent: number;
    seriesName?: string;
    episodeLabel?: string;
  }

  let items = $state<Item[]>([]);
  let loading = $state(true);

  async function fetchItems() {
    try {
      const res = await fetch('/api/jellyfin/continue');
      if (!res.ok) return;
      items = await res.json();
    } catch { /* silent */ } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchItems();
    const id = setInterval(fetchItems, 5 * 60 * 1000);
    return () => clearInterval(id);
  });
</script>

<!-- Apple HIG medium widget: horizontal scroll of poster cards -->
<div class="flex flex-col h-full">
  <div class="flex items-center gap-1.5 px-4 pt-4 pb-2">
    <span class="widget-label">Continue Watching</span>
  </div>

  {#if loading}
    <div class="flex gap-3 px-4 pb-4 flex-1 items-center">
      {#each Array(4) as _}
        <div class="rounded-xl liquid-skeleton shrink-0" style="width:130px;height:90px;"></div>
      {/each}
    </div>
  {:else if items.length === 0}
    <div class="flex-1 flex items-center justify-center">
      <p class="text-white/30 text-sm">Nothing in progress</p>
    </div>
  {:else}
    <div class="flex gap-3 overflow-x-auto px-4 pb-4 flex-1 items-start">
      {#each items as item}
        <div class="widget-item-card shrink-0 overflow-hidden cursor-pointer" style="width:130px;">
          <div class="relative" style="height:78px;">
            {#if item.imageUrl}
              <img src={item.imageUrl} alt={item.name} class="w-full h-full object-cover" />
            {:else}
              <div class="w-full h-full bg-white/5 flex items-center justify-center text-2xl select-none">🎬</div>
            {/if}
            <!-- Progress bar -->
            <div class="absolute bottom-0 left-0 right-0 h-0.75 bg-black/40">
              <div class="h-full bg-accent/80 transition-all rounded-full" style="width:{item.playedPercent}%;"></div>
            </div>
          </div>
          <div class="px-2.5 py-2">
            <div class="text-white/85 text-[11px] font-semibold truncate leading-tight">
              {item.seriesName ?? item.name}
            </div>
            {#if item.episodeLabel}
              <div class="text-white/38 text-[10px] mt-0.5 truncate">{item.episodeLabel}</div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
