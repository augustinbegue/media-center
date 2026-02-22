# Dashboard

SvelteKit TV dashboard for media-center. The visual system is built around a reusable liquid-glass component library on top of TailwindCSS v4.

## Development

```sh
bun install
bun run dev
```

## Liquid component library

Import from `$lib/components/ui/liquid`:

- `LiquidSurface`: refractive glass container with rounded round displacement and blur presets.
- `LiquidPill`: compact badge/chip surface for status and metadata.
- `LiquidRow`: list-row glass surface (optionally interactive).
- `LiquidButton`: button primitive for future controls.

Example:

```svelte
<script lang="ts">
	import { LiquidSurface, LiquidPill } from '$lib/components/ui/liquid';
</script>

<LiquidSurface radius="lg" tone="strong" class="p-5">
	<LiquidPill class="px-3 py-1.5">Connected</LiquidPill>
</LiquidSurface>
```

## Styling primitives

Global liquid utilities and design tokens live in `src/app.css`:

- surface tones (`.liquid-surface-*`)
- interaction states (`.liquid-interactive`)
- list/pill/button utilities (`.liquid-row`, `.liquid-pill`, `.liquid-button`)
- support utilities (`.liquid-divider`, `.liquid-skeleton`)

## Liquid Glass Effect — Implementation Notes

The visual system uses an Apple-style "Liquid Glass" effect (inspired by [archisvaze/liquid-glass](https://github.com/archisvaze/liquid-glass)). Getting it to work correctly required matching the reference's exact CSS stacking structure.

### How it works

The effect combines three CSS layers on a single element using pseudo-elements:

| Layer | Pseudo | z-index | Purpose |
|-------|--------|---------|--------|
| Backdrop blur + noise distortion | `::after` | -1 | `backdrop-filter: blur()` + SVG `filter: url(#id)` |
| Tint + inner shadow | `::before` | 0 | Colored overlay + inset box-shadow |
| Content | child `<div>` | 1 | Actual text/widgets |

A single shared SVG filter is defined once in `+layout.svelte`:

```html
<svg style="position:absolute; overflow:hidden;">
  <defs>
    <filter id="glass-distortion" x="0%" y="0%" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.008 0.008"
                    numOctaves="2" seed="92" result="noise" />
      <feGaussianBlur in="noise" stdDeviation="2" result="blurred" />
      <feDisplacementMap in="SourceGraphic" in2="blurred" scale="77"
                         xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </defs>
</svg>
```

All `LiquidSurface` components reference this filter via `filter: url(#glass-distortion)` in their `::after` pseudo.

### Critical constraints

1. **No `overflow: hidden` on the glass element.** This was the root cause of the effect not working. When `overflow: hidden` + `isolation: isolate` are set on the same element, the `::after` pseudo at `z-index: -1` can no longer "see through" to the page content — `backdrop-filter` only composites the parent's own (empty) background within the isolated layer, making it appear broken.

2. **`backdrop-filter` and `filter` must be on a `::after` pseudo, not a child `<div>`.** The reference uses `::after` with `z-index: -1` so the SVG displacement map's `SourceGraphic` correctly includes the blurred backdrop result. A regular child element processes these properties differently in the compositing pipeline.

3. **One shared SVG filter, not per-component.** The reference uses a single `<filter id="glass-distortion">` for all glass elements. Attributes (`baseFrequency`, `scale`) are updated imperatively via `setAttribute()` (in Svelte, via `$effect` + `bind:this`). This avoids issues with CSS variables inside `filter: url()` references and keeps the DOM clean.

4. **`isolation: isolate` on the glass element** creates the stacking context needed for `z-index: -1` to work on the `::after` pseudo without escaping into the parent's stacking context.

5. **Chromium (Blink) only.** The combination of `backdrop-filter` + SVG `filter` on a pseudo-element does not work reliably in Safari (WebKit) or Firefox (Gecko). Since the dashboard runs in Chrome kiosk mode, this is acceptable.

### Settings page

The `/settings` route includes a side-by-side comparison: a raw CSS replica of the reference implementation and the `LiquidSurface` component. Both use the same shared SVG filter and are controlled by the same sliders, making it easy to verify parity.
