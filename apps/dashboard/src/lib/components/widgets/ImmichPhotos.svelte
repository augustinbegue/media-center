<script lang="ts">
  import { onMount } from 'svelte';

  type Source = 'explore' | 'memories' | 'album' | 'random' | 'none';

  interface Photo {
    id: string;
    type?: string;
    createdAt?: string;
    thumbnailUrl: string;
  }

  interface PhotosResponse {
    source: Source;
    photos: Photo[];
  }

  let loading = $state(true);
  let source = $state<Source>('none');
  let photos = $state<Photo[]>([]);

  function normalizeResponse(value: unknown): PhotosResponse | null {
    if (!value || typeof value !== 'object') return null;

    const maybe = value as Partial<PhotosResponse>;
    const normalizedSource: Source =
      maybe.source === 'explore' ||
      maybe.source === 'memories' ||
      maybe.source === 'album' ||
      maybe.source === 'random' ||
      maybe.source === 'none'
        ? maybe.source
        : 'none';

    const normalizedPhotos = Array.isArray(maybe.photos)
      ? maybe.photos
          .filter((item): item is Photo => {
            if (!item || typeof item !== 'object') return false;
            const p = item as Partial<Photo>;
            return typeof p.id === 'string' && typeof p.thumbnailUrl === 'string';
          })
          .slice(0, 4)
      : [];

    return {
      source: normalizedSource,
      photos: normalizedPhotos,
    };
  }

  async function fetchPhotos() {
    try {
      const res = await fetch('/api/immich/photos');
      if (!res.ok) return;

      const parsed = normalizeResponse(await res.json());
      if (!parsed) return;

      source = parsed.source;
      photos = parsed.photos;
    } catch {
      source = 'none';
      photos = [];
    } finally {
      loading = false;
    }
  }

  function sourceLabel(value: Source): string {
    if (value === 'explore') return 'Explore';
    if (value === 'memories') return 'Memories';
    if (value === 'album') return 'Album';
    if (value === 'random') return 'Random';
    return 'Unavailable';
  }

  onMount(() => {
    fetchPhotos();
    const id = setInterval(fetchPhotos, 2 * 60 * 1000);
    return () => clearInterval(id);
  });
</script>

<div class="flex flex-col h-full">
  <div class="flex items-center justify-between gap-2 px-4 pt-4 pb-2">
    <span class="widget-label">Immich</span>
    <span class="text-white/45 text-[10px] font-semibold uppercase tracking-wider">
      {sourceLabel(source)}
    </span>
  </div>

  {#if loading}
    <div class="grid grid-cols-2 gap-2 px-4 pb-4 flex-1">
      {#each Array(4) as _}
        <div class="liquid-skeleton rounded-xl w-full h-full min-h-18"></div>
      {/each}
    </div>
  {:else if photos.length === 0}
    <div class="flex-1 flex items-center justify-center px-4 pb-4">
      <p class="text-white/30 text-sm">No photos available</p>
    </div>
  {:else}
    <div class="grid grid-cols-2 gap-2 px-4 pb-4 flex-1">
      {#each photos as photo}
        <div class="widget-item-card overflow-hidden">
          <img
            src={photo.thumbnailUrl}
            alt="Immich"
            loading="lazy"
            class="w-full h-full min-h-18 object-cover"
          />
        </div>
      {/each}
    </div>
  {/if}
</div>
