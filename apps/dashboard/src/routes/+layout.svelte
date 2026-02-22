<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { scene } from '$lib/stores/scene.svelte';
  import { liquidSettings } from '$lib/stores/liquidSettings.svelte';

  let { children } = $props();

  let cursorHidden = $state(false);
  let cursorTimer: ReturnType<typeof setTimeout>;

  function resetCursor() {
    cursorHidden = false;
    clearTimeout(cursorTimer);
    cursorTimer = setTimeout(() => { cursorHidden = true; }, 5000);
  }

  // Shared SVG filter — refs for imperative attribute updates (like the reference)
  let turbulenceEl: SVGFETurbulenceElement | undefined = $state();
  let displacementEl: SVGFEDisplacementMapElement | undefined = $state();

  let settings = $derived(liquidSettings.settings);
  let noiseFreq = $derived(`${settings.noiseFrequency} ${settings.noiseFrequency}`);
  let distScale = $derived(String(settings.distortionStrength));

  $effect(() => { turbulenceEl?.setAttribute('baseFrequency', noiseFreq); });
  $effect(() => { displacementEl?.setAttribute('scale', distScale); });

  onMount(() => {
    liquidSettings.hydrate();
    resetCursor();
    return () => clearTimeout(cursorTimer);
  });

  let isNight = $state(false);
  $effect(() => {
    const hour = new Date().getHours();
    console.log('Current hour:', hour, '→ isNight:', hour < 6 || hour >= 22);
    isNight = hour < 6 || hour >= 22;
  });
  let cssVars = $derived(liquidSettings.cssVars());
  let customBackground = $derived(liquidSettings.settings.backgroundUrl);
</script>

<div
  class="relative w-screen h-screen"
  class:cursor-hidden={cursorHidden}
  onmousemove={resetCursor}
  style={cssVars}
  role="presentation"
>
  {#if customBackground}
    <div
      class="absolute inset-0 bg-cover bg-center transition-opacity duration-[600ms] ease-out"
      style="background-image: url('{customBackground}'); opacity: 1;"
    ></div>
  {:else}
    <!-- Day wallpaper -->
    <div
      class="absolute inset-0 bg-cover bg-center transition-opacity duration-[1200ms] ease-in-out"
      style="background-image: url('/wallpapers/10-15-Day.jpg'); opacity: {isNight ? 0 : 1};"
    ></div>
    <!-- Night wallpaper -->
    <div
      class="absolute inset-0 bg-cover bg-center transition-opacity duration-[1200ms] ease-in-out"
      style="background-image: url('/wallpapers/10-15-Night.jpg'); opacity: {isNight ? 1 : 0};"
    ></div>
  {/if}
  <!-- Dark scrim so glass cards are readable -->
  <div class="absolute inset-0" style="background: rgba(0,0,0,0.28);"></div>

  <!-- Shared SVG noise/distortion filter (single instance, like reference) -->
  <svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute; overflow:hidden;">
    <defs>
      <filter id="glass-distortion" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence
          bind:this={turbulenceEl}
          type="fractalNoise"
          baseFrequency="0.008 0.008"
          numOctaves="2"
          seed="92"
          result="noise"
        />
        <feGaussianBlur in="noise" stdDeviation="2" result="blurred" />
        <feDisplacementMap
          bind:this={displacementEl}
          in="SourceGraphic"
          in2="blurred"
          scale="77"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </defs>
  </svg>

  {@render children()}
</div>
