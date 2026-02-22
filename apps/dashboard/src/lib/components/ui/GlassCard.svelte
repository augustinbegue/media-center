<script lang="ts">
  import LiquidSurface from '$lib/components/ui/liquid/LiquidSurface.svelte';

  interface Props {
    class?: string;
    large?: boolean;
    hover?: boolean;
    style?: string;
  }

  let {
    class: cls = '',
    large = false,
    hover = false,
    style = '',
    children,
  }: Props & { children?: import('svelte').Snippet } = $props();
</script>

<LiquidSurface
  class={cls}
  radius={large ? 'lg' : 'md'}
  interactive={hover}
  style={style}
>
  {@render children?.()}
</LiquidSurface>
