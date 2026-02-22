<script lang="ts">
  import { onMount } from 'svelte';

  interface UpcomingItem {
    id: string;
    title: string;
    subtitle: string;
    airDate: string;
    type: 'episode' | 'movie';
    imageUrl: string | null;
  }

  let items = $state<UpcomingItem[]>([]);
  let loading = $state(true);

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  async function fetchItems() {
    try {
      const [sonarrRes, radarrRes] = await Promise.allSettled([
        fetch('/api/sonarr/calendar'),
        fetch('/api/radarr/calendar'),
      ]);
      const all: UpcomingItem[] = [];
      if (sonarrRes.status === 'fulfilled' && sonarrRes.value.ok) all.push(...await sonarrRes.value.json());
      if (radarrRes.status === 'fulfilled' && radarrRes.value.ok) all.push(...await radarrRes.value.json());
      all.sort((a, b) => new Date(a.airDate).getTime() - new Date(b.airDate).getTime());
      items = all.slice(0, 12);
    } catch { /* silent */ } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchItems();
    const id = setInterval(fetchItems, 30 * 60 * 1000);
    return () => clearInterval(id);
  });
</script>

<!-- Apple HIG large widget: scrollable list -->
<div class="flex flex-col h-full">
  <div class="flex items-center gap-1.5 px-4 pt-4 pb-2">
    <span class="text-sm leading-none select-none">📅</span>
    <span class="widget-label">Upcoming</span>
  </div>

  {#if loading}
    <div class="flex flex-col gap-2 px-4 pb-4 flex-1">
      {#each Array(5) as _}
        <div class="rounded-xl liquid-skeleton h-13"></div>
      {/each}
    </div>
  {:else if items.length === 0}
    <div class="flex-1 flex items-center justify-center">
      <p class="text-white/30 text-sm">Nothing upcoming</p>
    </div>
  {:else}
    <div class="flex flex-col gap-1.5 px-4 pb-4 overflow-y-auto flex-1">
      {#each items as item}
        <div class="widget-item-card flex items-center gap-3 px-3 py-2.5">
          <div class="shrink-0 rounded-lg overflow-hidden bg-white/8 flex items-center justify-center select-none"
               style="width:38px;height:38px;">
            {#if item.imageUrl}
              <img src={item.imageUrl} alt={item.title} class="w-full h-full object-cover" />
            {:else}
              <span class="text-sm">{item.type === 'movie' ? '🎬' : '📺'}</span>
            {/if}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-white/85 text-[12px] font-semibold truncate leading-tight">{item.title}</div>
            <div class="text-white/38 text-[10px] truncate mt-0.5">{item.subtitle}</div>
          </div>
          <div class="shrink-0 text-[9px] font-bold text-white/38 uppercase tracking-wider">
            {formatDate(item.airDate)}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
