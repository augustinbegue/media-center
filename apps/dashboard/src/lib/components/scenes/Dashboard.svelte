<script lang="ts">
  import { Widget, LiquidPill } from '$lib/components/ui/liquid';
  import Clock from '$lib/components/widgets/Clock.svelte';
  import Weather from '$lib/components/widgets/Weather.svelte';
  import ContinueWatching from '$lib/components/widgets/ContinueWatching.svelte';
  import RecentlyAdded from '$lib/components/widgets/RecentlyAdded.svelte';
  import UpcomingMedia from '$lib/components/widgets/UpcomingMedia.svelte';
  import { agent } from '$lib/stores/agent.svelte';
</script>

<div class="absolute inset-0">
  <!-- Agent status — floating accessory pill (not a grid widget) -->
  <div class="absolute top-6 right-6 z-10">
    <LiquidPill class="flex items-center gap-2 px-3.5 py-2">
      <div
        class="w-1.5 h-1.5 rounded-full {agent.connected ? 'bg-green-400' : 'bg-red-400'}"
        style="box-shadow: 0 0 5px {agent.connected ? '#4ade80' : '#f87171'};"
      ></div>
      <span class="text-xs text-white/45 font-medium">{agent.connected ? 'Agent' : 'Offline'}</span>
    </LiquidPill>
  </div>

  <!--
    Apple HIG widget grid — 6 columns × 4 rows
    ┌─────┬─────┬─────────────┬─────────────┐
    │Clock│ Wth │ Continue    │  Upcoming   │
    │ (S) │ (S) │ Watching(M) │    (L)      │
    ├─────┴─────┼─────────────┤  (2×2)      │
    │Weather (M)│Recently (M) │             │
    ├───────────┴─────────────┴─────────────┤
    │              (empty row 3)             │
    ├───────────────────────────────────────┤
    │              (empty row 4)             │
    └───────────────────────────────────────┘
  -->
  <div class="widget-grid">
    <!-- Row 1, col 1: Clock (small) -->
    <Widget size="small" animate animationDelay={0}>
      <Clock />
    </Widget>

    <!-- Row 1, col 2: Weather snapshot (small) -->
    <Widget size="small" animate animationDelay={50}>
      <Weather variant="small" />
    </Widget>

    <!-- Row 1, col 3-4: Continue Watching (medium) -->
    <Widget size="medium" animate animationDelay={100}>
      <ContinueWatching />
    </Widget>

    <!-- Row 1-2, col 5-6: Upcoming media list (large) -->
    <Widget size="large" animate animationDelay={150}>
      <UpcomingMedia />
    </Widget>

    <!-- Row 2, col 1-2: Weather detail with forecast (medium) -->
    <Widget size="medium" animate animationDelay={200}>
      <Weather variant="medium" />
    </Widget>

    <!-- Row 2, col 3-4: Recently Added (medium) -->
    <Widget size="medium" animate animationDelay={250}>
      <RecentlyAdded />
    </Widget>
  </div>
</div>
