<script lang="ts">
  interface Props {
    class?: string;
    style?: string;
    type?: 'button' | 'submit' | 'reset';
    onclick?: (event: MouseEvent) => void;
  }

  let {
    class: cls = '',
    style = '',
    type = 'button',
    onclick,
    children,
  }: Props & { children?: import('svelte').Snippet } = $props();
</script>

<button type={type} class="liquid-button inline-flex items-center justify-center {cls}" style={style} {onclick}>
  {@render children?.()}
</button>
