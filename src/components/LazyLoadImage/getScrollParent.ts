/**
 * gets the scroll parent of the given element
 * based on this discussion:
 * https://stackoverflow.com/questions/35939886/find-first-scrollable-parent
 */

export function isScrollable(node) {
  const { overflowY, overflowX } = getComputedStyle(node);
  return (
    !overflowY.includes("hidden") &&
    !overflowY.includes("visible") &&
    !overflowX.includes("hidden") &&
    !overflowX.includes("visible") &&
    node.scrollHeight >= node.clientHeight
  );
}

export default function getScrollParent(node: HTMLElement | null): HTMLElement {
  if (!node) return document.body;

  return isScrollable(node)
    ? node
    : getScrollParent(node.parentNode as HTMLElement);
}
