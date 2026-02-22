<script lang="ts">
  import LiquidSurface from '$lib/components/ui/liquid/LiquidSurface.svelte';

  interface Props {
    class?: string;
    large?: boolean;
    hover?: boolean;
    style?: string;
    animate?: boolean;
  }

  let {
    class: cls = '',
    large = false,
    hover = false,
    style = '',
    animate = false,
    children,
  }: Props & { children?: import('svelte').Snippet } = $props();
</script>

<LiquidSurface
  class={cls}
  radius={large ? 'lg' : 'md'}
  interactive={hover}
  animate={animate}
  style={style}
>
  {@render children?.()}
</LiquidSurface>
