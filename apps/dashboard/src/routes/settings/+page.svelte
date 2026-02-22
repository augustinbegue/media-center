<script lang="ts">
  import { onMount } from 'svelte';
  import { LiquidButton, LiquidSurface } from '$lib/components/ui/liquid';
  import { liquidSettings } from '$lib/stores/liquidSettings.svelte';

  const labels = {
    shadowColor: 'Shadow color',
    shadowBlur: 'Shadow blur',
    shadowSpread: 'Shadow spread',
    tintColor: 'Tint color',
    tintOpacity: 'Tint opacity',
    frostBlur: 'Frost blur',
    noiseFrequency: 'Noise frequency',
    distortionStrength: 'Distortion strength',
    backgroundUrl: 'Background URL',
  } as const;

  let settings = $derived(liquidSettings.settings);

  /* ── Reference-replica reactive values ─────────────────────── */
  let refShadowColor = $derived(settings.shadowColor);
  let refShadowBlur = $derived(`${settings.shadowBlur}px`);
  let refShadowSpread = $derived(`${settings.shadowSpread}px`);
  let refTintRgb = $derived(() => {
    const hex = settings.tintColor.replace('#', '');
    const parts = hex.match(/.{2}/g) ?? ['ff', 'ff', 'ff'];
    return parts.map((p) => Number.parseInt(p, 16)).join(', ');
  });
  let refTintOpacity = $derived(settings.tintOpacity / 100);
  let refFrostBlur = $derived(`${settings.frostBlur}px`);

  /* ── CSS variables on :root (matching reference) ───────────── */
  $effect(() => {
    const root = document.documentElement;
    root.style.setProperty('--ref-shadow-color', refShadowColor);
    root.style.setProperty('--ref-shadow-blur', refShadowBlur);
    root.style.setProperty('--ref-shadow-spread', refShadowSpread);
    root.style.setProperty('--ref-tint-color', refTintRgb());
    root.style.setProperty('--ref-tint-opacity', String(refTintOpacity));
    root.style.setProperty('--ref-frost-blur', refFrostBlur);
  });

  onMount(() => {
    return () => {
      const root = document.documentElement;
      ['--ref-shadow-color','--ref-shadow-blur','--ref-shadow-spread',
       '--ref-tint-color','--ref-tint-opacity','--ref-frost-blur'].forEach(v => root.style.removeProperty(v));
    };
  });

  function onText<K extends 'backgroundUrl'>(key: K, event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    liquidSettings.set(key, input.value);
  }

  function onColor<K extends 'shadowColor' | 'tintColor'>(key: K, event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    liquidSettings.set(key, input.value);
  }

  function onInt<K extends 'shadowBlur' | 'shadowSpread' | 'tintOpacity' | 'frostBlur' | 'distortionStrength'>(
    key: K,
    event: Event,
  ) {
    const input = event.currentTarget as HTMLInputElement;
    liquidSettings.set(key, Number.parseInt(input.value, 10));
  }

  function onFloat<K extends 'noiseFrequency'>(key: K, event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    liquidSettings.set(key, Number.parseFloat(input.value));
  }
</script>

<!-- Both reference replica and LiquidSurface now use the shared
     #glass-distortion SVG filter defined in +layout.svelte -->

<div class="absolute inset-0 p-7 overflow-y-auto">
  <div class="max-w-4xl mx-auto flex flex-col gap-4">
    <!-- ═════════ LiquidSurface component (for comparison) ═════════ -->
    <div style="position: relative; display: flex; align-items: center; justify-content: center; min-height: 300px;">
      <LiquidSurface radius="lg" style="width: 300px; height: 200px;">
        <div style="display:flex;align-items:center;justify-content:center;height:100%;color:rgba(255,255,255,0.4);font-size:12px;">
          LiquidSurface component
        </div>
      </LiquidSurface>
    </div>

    <!-- ═════════ Controls (same as before) ═════════ -->
    <LiquidSurface radius="lg" class="p-6" tone="strong">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-white/92">Liquid Glass Settings</h1>
          <p class="text-sm text-white/55 mt-1">Compare: reference replica vs LiquidSurface component.</p>
        </div>
        <div class="flex items-center gap-2">
          <a href="/" class="liquid-button inline-flex items-center justify-center px-4 py-2 text-sm font-medium">
            Back to Dashboard
          </a>
          <LiquidButton class="px-4 py-2 text-sm font-medium" onclick={() => liquidSettings.reset()}>
            Reset
          </LiquidButton>
        </div>
      </div>
    </LiquidSurface>

    <LiquidSurface radius="lg" class="p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <label class="flex items-center justify-between gap-3">
          <span class="text-sm text-white/70">{labels.shadowColor}</span>
          <input type="color" value={settings.shadowColor} oninput={(e) => onColor('shadowColor', e)} class="w-10 h-8 rounded-md bg-transparent" />
        </label>

        <label class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between gap-3">
            <span class="text-sm text-white/70">{labels.shadowBlur}</span>
            <span class="text-xs text-white/45">{settings.shadowBlur}px</span>
          </div>
          <input type="range" min="0" max="20" step="1" value={settings.shadowBlur} oninput={(e) => onInt('shadowBlur', e)} />
        </label>

        <label class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between gap-3">
            <span class="text-sm text-white/70">{labels.shadowSpread}</span>
            <span class="text-xs text-white/45">{settings.shadowSpread}px</span>
          </div>
          <input type="range" min="-10" max="10" step="1" value={settings.shadowSpread} oninput={(e) => onInt('shadowSpread', e)} />
        </label>

        <label class="flex items-center justify-between gap-3">
          <span class="text-sm text-white/70">{labels.tintColor}</span>
          <input type="color" value={settings.tintColor} oninput={(e) => onColor('tintColor', e)} class="w-10 h-8 rounded-md bg-transparent" />
        </label>

        <label class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between gap-3">
            <span class="text-sm text-white/70">{labels.tintOpacity}</span>
            <span class="text-xs text-white/45">{settings.tintOpacity}%</span>
          </div>
          <input type="range" min="0" max="100" step="1" value={settings.tintOpacity} oninput={(e) => onInt('tintOpacity', e)} />
        </label>

        <label class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between gap-3">
            <span class="text-sm text-white/70">{labels.frostBlur}</span>
            <span class="text-xs text-white/45">{settings.frostBlur}px</span>
          </div>
          <input type="range" min="0" max="30" step="1" value={settings.frostBlur} oninput={(e) => onInt('frostBlur', e)} />
        </label>

        <label class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between gap-3">
            <span class="text-sm text-white/70">{labels.noiseFrequency}</span>
            <span class="text-xs text-white/45">{settings.noiseFrequency.toFixed(3)}</span>
          </div>
          <input type="range" min="0" max="0.02" step="0.001" value={settings.noiseFrequency} oninput={(e) => onFloat('noiseFrequency', e)} />
        </label>

        <label class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between gap-3">
            <span class="text-sm text-white/70">{labels.distortionStrength}</span>
            <span class="text-xs text-white/45">{settings.distortionStrength}</span>
          </div>
          <input type="range" min="0" max="200" step="1" value={settings.distortionStrength} oninput={(e) => onInt('distortionStrength', e)} />
        </label>

        <label class="md:col-span-2 flex flex-col gap-1.5">
          <div class="flex items-center justify-between gap-3">
            <span class="text-sm text-white/70">{labels.backgroundUrl}</span>
            <span class="text-xs text-white/45">Leave empty for day/night wallpapers</span>
          </div>
          <input
            type="text"
            value={settings.backgroundUrl}
            placeholder="https://..."
            oninput={(e) => onText('backgroundUrl', e)}
            class="w-full rounded-xl bg-black/25 border border-white/15 px-3 py-2 text-sm text-white/85 outline-none focus:border-white/35"
          />
        </label>
      </div>
    </LiquidSurface>
  </div>
</div>

<style>
  /*
   * ══════════════════════════════════════════════════════════════
   *  100% exact copy of .glassDiv from archisvaze/liquid-glass
   *  (using --ref-* CSS vars set on :root by the $effect above)
   * ══════════════════════════════════════════════════════════════
   */
  .glass-ref-div {
    width: 300px;
    height: 200px;
    border-radius: 28px;
    isolation: isolate;
    box-shadow: 0px 6px 24px rgba(0, 0, 0, 0.2);
    /* NO overflow: hidden — matching reference exactly */
  }

  .glass-ref-div::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    border-radius: 28px;
    box-shadow:
      inset 0 0 var(--ref-shadow-blur, 20px) var(--ref-shadow-spread, -5px) var(--ref-shadow-color, rgba(255, 255, 255, 0.7));
    background-color: rgba(var(--ref-tint-color, 255, 255, 255), var(--ref-tint-opacity, 0.4));
  }

  .glass-ref-div::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: 28px;
    backdrop-filter: blur(var(--ref-frost-blur, 2px));
    -webkit-backdrop-filter: blur(var(--ref-frost-blur, 2px));
    filter: url(#glass-distortion);
    -webkit-filter: url("#glass-distortion");
    isolation: isolate;
  }
</style>
