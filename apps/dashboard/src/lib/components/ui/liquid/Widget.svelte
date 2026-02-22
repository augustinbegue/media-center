<script lang="ts">
  import LiquidSurface from './LiquidSurface.svelte';

  /**
   * Apple-style widget container.
   *
   * Maps widget size → CSS grid span and wraps content in a LiquidSurface
   * glass container. Place inside a `.widget-grid` CSS grid.
   *
   * Sizes follow Apple HIG system family widgets:
   *  - small:      1 col × 1 row  (square-ish)
   *  - medium:     2 col × 1 row  (wide)
   *  - large:      2 col × 2 row  (tall + wide)
   *  - extraLarge: 4 col × 2 row  (full-width)
   */

  type WidgetSize = 'small' | 'medium' | 'large' | 'extraLarge';

  interface Props {
    size?: WidgetSize;
    class?: string;
    style?: string;
    animate?: boolean;
    animationDelay?: number;
  }

  let {
    size = 'small',
    class: cls = '',
    style = '',
    animate = false,
    animationDelay = 0,
    children,
  }: Props & { children?: import('svelte').Snippet } = $props();

  const sizeMap: Record<WidgetSize, string> = {
    small: 'widget-small',
    medium: 'widget-medium',
    large: 'widget-large',
    extraLarge: 'widget-extra-large',
  };
</script>

<!--
  The glass shell (LiquidSurface) is rendered immediately at opacity:1 so
  backdrop-filter + SVG distortion composite correctly from the first frame.
  Only the inner content div gets the entrance animation — it has no
  backdrop-filter so transform/opacity animations are safe on it.
-->
<LiquidSurface
  class="{sizeMap[size]} min-h-0 min-w-0 {cls}"
  {style}
>
  <div
    class="contents h-full {animate ? 'card-enter' : ''}"
    style={animate && animationDelay ? `animation-delay:${animationDelay}ms;` : ''}
  >
    {@render children?.()}
  </div>
</LiquidSurface>
