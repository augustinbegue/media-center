<script lang="ts">
  import { LiquidPill, LiquidSurface } from '$lib/components/ui/liquid';
  import { agent } from '$lib/stores/agent.svelte';

  let meta = $derived(agent.uxplay.metadata);
  let artwork = $derived(meta?.artwork);
</script>

<div class="absolute inset-0 overflow-hidden">
  <!-- Blurred album art backdrop -->
  {#if artwork}
    <div
      class="absolute inset-0 scale-110"
      style="background: url({artwork}) center/cover no-repeat; filter: blur(60px) brightness(0.4) saturate(1.8);"
    ></div>


    <!-- Vignette -->
    <div class="absolute inset-0" style="background: rgba(0,0,0,0.4);"></div>
  {/if}

  <!-- Content -->
  <div class="absolute inset-0 flex items-center justify-center">
    <div class="flex flex-col items-center gap-8 max-w-2xl w-full px-12">
      <!-- Large album art -->
      <LiquidSurface
        class="overflow-hidden"
        radius="lg"
        tone="strong"
        blur="strong"
        style="width: clamp(200px, 28vw, 360px); height: clamp(200px, 28vw, 360px);"
      >
        {#if artwork}
          <img src={artwork} alt="Album art" class="w-full h-full object-cover" />
        {:else}
          <div class="w-full h-full flex items-center justify-center text-8xl select-none">♪</div>
        {/if}
      </LiquidSurface>

      <!-- Track metadata -->
      <div class="flex flex-col items-center text-center gap-2">
        <div class="text-4xl font-bold text-white/95 leading-tight">
          {meta?.title || 'Now Playing'}
        </div>
        <div class="text-xl text-white/65 font-light">
          {meta?.artist || 'AirPlay'}
        </div>
        {#if meta?.album}
          <div class="text-base text-white/40 font-light">{meta.album}</div>
        {/if}
      </div>

      <!-- AirPlay indicator -->
      <LiquidPill class="flex items-center gap-2 px-4 py-2">
        <div class="w-2 h-2 rounded-full bg-blue-400" style="box-shadow: 0 0 8px #60a5fa;"></div>
        <span class="text-sm text-white/60">AirPlay</span>
      </LiquidPill>
    </div>
  </div>
</div>
