<script lang="ts">
  import { onMount } from 'svelte';
  import { scene } from '$lib/stores/scene.svelte';
  import { agent } from '$lib/stores/agent.svelte';
  import AmbientScene from '$lib/components/scenes/Ambient.svelte';
  import DashboardScene from '$lib/components/scenes/Dashboard.svelte';
  import NowPlayingScene from '$lib/components/scenes/NowPlaying.svelte';
  import HiddenScene from '$lib/components/scenes/Hidden.svelte';

  // Connect agent WebSocket on mount
  onMount(() => {
    agent.connect();
    // Sync time-based scene every minute
    const timer = setInterval(() => scene.sync(), 60_000);
    return () => clearInterval(timer);
  });

  // Keyboard shortcuts
  function onKeyDown(e: KeyboardEvent) {
    if (e.key === '1') scene.setOverride('dashboard');
    if (e.key === '2') scene.setOverride('ambient');
    if (e.key === '3') scene.setOverride('nowPlaying');
    if (e.key === '0') scene.setOverride(null);
  }
</script>

<svelte:window onkeydown={onKeyDown} />

<div class="absolute inset-0">
  {#if scene.current === 'ambient'}
    <div class="absolute inset-0">
      <AmbientScene />
      <!-- Sibling overlay fades OUT so glass is never inside an animated layer -->
      <div class="scene-fade-overlay absolute inset-0 pointer-events-none"></div>
    </div>
  {:else if scene.current === 'dashboard'}
    <div class="absolute inset-0">
      <DashboardScene />
      <div class="scene-fade-overlay absolute inset-0 pointer-events-none"></div>
    </div>
  {:else if scene.current === 'nowPlaying'}
    <div class="absolute inset-0">
      <NowPlayingScene />
      <div class="scene-fade-overlay absolute inset-0 pointer-events-none"></div>
    </div>
  {:else if scene.current === 'hidden'}
    <div class="absolute inset-0">
      <HiddenScene />
    </div>
  {/if}
</div>
