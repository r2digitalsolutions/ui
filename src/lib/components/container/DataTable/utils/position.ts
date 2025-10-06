export function clampToViewport(
  x: number,
  y: number,
  menuW: number,
  menuH: number,
  padding = 8
) {
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  let nx = x;
  let ny = y;
  if (nx + menuW + padding > vw) nx = Math.max(padding, vw - menuW - padding);
  if (ny + menuH + padding > vh) ny = Math.max(padding, vh - menuH - padding);
  return { x: nx, y: ny };
}
