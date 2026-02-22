<script lang="ts">
  import { liquidSettings } from '$lib/stores/liquidSettings.svelte';

  interface Props {
    class?: string;
    radius?: 'sm' | 'md' | 'lg';
    interactive?: boolean;
    tone?: 'soft' | 'default' | 'strong';
    style?: string;
    blur?: 'soft' | 'medium' | 'strong';
  }

  let {
    class: cls = '',
    radius = 'md',
    interactive = false,
    tone = 'default',
    style = '',
    blur = 'medium',
    children,
  }: Props & { children?: import('svelte').Snippet } = $props();

  let settings = $derived(liquidSettings.settings);

  let blurOffset = $derived(blur === 'soft' ? 0 : blur === 'strong' ? 8 : 4);
  let frostBlurPx = $derived(settings.frostBlur + blurOffset);

  let toneMultiplier = $derived(tone === 'soft' ? 0.8 : tone === 'strong' ? 1.25 : 1);
  let tintOpacity = $derived(Math.min(1, (settings.tintOpacity / 100) * toneMultiplier));

  let radiusClass = "rounded-[40px]"
</script>

<!--
  Structure mirrors the reference exactly:
  - .liquid-glass-outer: isolation: isolate, NO overflow: hidden
  - ::before (CSS): tint + inner shadow (z-index: 0)
  - ::after (CSS): backdrop-filter + SVG filter (z-index: -1)
  - Shared SVG filter #glass-distortion defined once in +layout.svelte
  - Content sits at z-index: 1
-->
<div
  class="liquid-glass-outer {radiusClass} {interactive ? 'liquid-interactive' : ''} {cls}"
  style="--glass-frost-blur: {frostBlurPx}px; --glass-tint-bg: rgba(var(--liquid-tint-rgb), {tintOpacity}); --glass-shadow: inset 0 0 var(--liquid-shadow-blur) var(--liquid-shadow-spread) var(--liquid-shadow-color); {style} corner-shape: superellipse(1.20);"
>
  <div class="relative h-full" style="z-index:1;">
    {@render children?.()}
  </div>
</div>

<style>
  .liquid-glass-outer {
    position: relative;
    isolation: isolate;
    border: 1px solid rgba(255, 255, 255, 0.14);
    box-shadow: 0px 6px 24px rgba(0, 0, 0, 0.2);
    /* NO overflow: hidden — critical for backdrop-filter on ::after */
  }

  /* Tint + inner shadow (matches reference ::before) */
  .liquid-glass-outer::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    border-radius: inherit;
    corner-shape: superellipse(1.20);
    pointer-events: none;
    background-color: var(--glass-tint-bg);
    box-shadow: var(--glass-shadow);
  }

  /* Backdrop blur + SVG noise distortion (matches reference ::after exactly) */
  .liquid-glass-outer::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: inherit;
    corner-shape: superellipse(1.20);
    backdrop-filter: blur(var(--glass-frost-blur, 2px));
    -webkit-backdrop-filter: blur(var(--glass-frost-blur, 2px));
    filter: url(#glass-distortion);
    -webkit-filter: url("#glass-distortion");
    isolation: isolate;
  }
</style>
