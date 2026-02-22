<script lang="ts">
  import { onMount } from 'svelte';

  interface Item {
    id: string;
    name: string;
    type: string;
    imageUrl: string | null;
    year?: number;
  }

  let items = $state<Item[]>([]);
  let loading = $state(true);

  async function fetchItems() {
    try {
      const res = await fetch('/api/jellyfin/latest');
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

<!-- Apple HIG medium widget: horizontal scroll of poster art -->
<div class="flex flex-col h-full">
  <div class="flex items-center gap-1.5 px-4 pt-4 pb-2">
    <span class="text-sm leading-none select-none">🆕</span>
    <span class="widget-label">Recently Added</span>
  </div>

  {#if loading}
    <div class="flex gap-3 px-4 pb-4 flex-1 items-center">
      {#each Array(5) as _}
        <div class="rounded-xl liquid-skeleton shrink-0" style="width:88px;height:132px;"></div>
      {/each}
    </div>
  {:else if items.length === 0}
    <div class="flex-1 flex items-center justify-center">
      <p class="text-white/30 text-sm">Nothing recently added</p>
    </div>
  {:else}
    <div class="flex gap-3 overflow-x-auto px-4 pb-4 flex-1 items-start">
      {#each items as item}
        <div class="widget-item-card shrink-0 overflow-hidden cursor-pointer" style="width:88px;">
          <div class="relative bg-white/5" style="height:125px;">
            {#if item.imageUrl}
              <img src={item.imageUrl} alt={item.name} class="w-full h-full object-cover" />
            {:else}
              <div class="w-full h-full flex items-center justify-center text-3xl select-none">
                {item.type === 'Movie' ? '🎬' : '📺'}
              </div>
            {/if}
          </div>
          <div class="px-2 py-1.5">
            <div class="text-white/80 text-[10px] font-semibold truncate leading-tight">{item.name}</div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
