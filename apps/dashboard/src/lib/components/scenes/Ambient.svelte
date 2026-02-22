<script lang="ts">
  import Clock from '$lib/components/widgets/Clock.svelte';
  import Weather from '$lib/components/widgets/Weather.svelte';
</script>

<!-- Full-screen ambient scene: dark, clock centered, subtle weather -->
<div class="absolute inset-0 flex flex-col items-center justify-center gap-8 select-none">
  <!-- Subtle vignette -->
  <div
    class="absolute inset-0 pointer-events-none"
    style="background: radial-gradient(ellipse 70% 70% at 50% 50%, transparent 40%, rgba(0,0,0,0.6) 100%);"
  ></div>

  <div class="relative flex flex-col items-center gap-6">
    <Clock variant="ambient" />

    <div class="flex items-center gap-4 mt-4">
      <Weather variant="inline" />
    </div>
  </div>
</div>
