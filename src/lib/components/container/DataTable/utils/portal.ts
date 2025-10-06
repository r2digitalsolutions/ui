export function portal(node: HTMLElement, target: HTMLElement | null = null) {
  const tgt = target ?? document.body;
  const placeholder = document.createComment('portal-placeholder');
  node.parentNode?.insertBefore(placeholder, node);
  tgt.appendChild(node);

  return {
    destroy() {
      node.remove();
      placeholder.parentNode?.insertBefore(node, placeholder);
      placeholder.remove();
    }
  };
}
