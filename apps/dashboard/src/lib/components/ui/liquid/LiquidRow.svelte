<script lang="ts">
  interface Props {
    class?: string;
    interactive?: boolean;
    style?: string;
  }

  let {
    class: cls = '',
    interactive = false,
    style = '',
    children,
  }: Props & { children?: import('svelte').Snippet } = $props();
</script>

<div class="liquid-row {interactive ? 'liquid-interactive cursor-pointer' : ''} {cls}" style={style}>
  {@render children?.()}
</div>
