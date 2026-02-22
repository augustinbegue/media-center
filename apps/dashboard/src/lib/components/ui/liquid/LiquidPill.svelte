<script lang="ts">
  interface Props {
    class?: string;
    style?: string;
  }

  let {
    class: cls = '',
    style = '',
    children,
  }: Props & { children?: import('svelte').Snippet } = $props();
</script>

<div class="liquid-pill inline-flex items-center {cls}" style={style}>
  {@render children?.()}
</div>
