import { readIconMetadata } from '../../../packages/icons/index.ts';

function editableFrame(node: BaseNode | null): node is FrameNode {
  if (node?.type !== 'FRAME' || readIconMetadata(node.getPluginData('capte-icon'))) return false;
  let ancestor: BaseNode | null = node;
  while (ancestor && ancestor.type !== 'PAGE') {
    if (ancestor.type === 'INSTANCE' || ('locked' in ancestor && ancestor.locked)) return false;
    ancestor = ancestor.parent;
  }
  return true;
}
function container(node: BaseNode | null): FrameNode | null {
  while (node && node.type !== 'PAGE') {
    if (editableFrame(node)) return node;
    node = node.parent;
  }
  return null;
}
/** Insert above the selected object, without joining its auto-layout flow. */
export function placeIcon(icon: FrameNode, selection: readonly SceneNode[]) {
  let center = figma.viewport.center;
  let parent: FrameNode | null = null;
  const bounds = selection.map(node => node.absoluteBoundingBox).filter((box): box is Rect => box !== null);
  if (bounds.length) {
    const left = Math.min(...bounds.map(b => b.x)), top = Math.min(...bounds.map(b => b.y));
    const right = Math.max(...bounds.map(b => b.x + b.width)), bottom = Math.max(...bounds.map(b => b.y + b.height));
    center = { x: (left + right) / 2, y: (top + bottom) / 2 };
    const parents = selection.map(node => container(node));
    if (parents.every(p => p === parents[0])) parent = parents[0];
  } else if (!selection.length) {
    // The outermost frame beneath the viewport center is the overall frame.
    const findFrame = (nodes: readonly SceneNode[]): FrameNode | null => {
      for (const node of [...nodes].reverse()) {
        if (node === icon || !node.visible) continue;
        const box = node.absoluteBoundingBox;
        if (!box || center.x < box.x || center.x > box.x + box.width || center.y < box.y || center.y > box.y + box.height) continue;
        if (editableFrame(node)) return node;
        if (node.type === 'SECTION' || node.type === 'GROUP') {
          const found = findFrame(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    parent = findFrame(figma.currentPage.children);
    if (parent) {
      const box = parent.absoluteBoundingBox!;
      center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    }
  }
  if (parent) {
    parent.appendChild(icon);
    if (parent.layoutMode !== 'NONE') icon.layoutPositioning = 'ABSOLUTE';
    // Convert the canvas center to local coordinates, including rotated frames.
    const [[a, c, tx], [b, d, ty]] = parent.absoluteTransform;
    const determinant = a * d - b * c;
    const x = center.x - tx, y = center.y - ty;
    center = { x: (d * x - c * y) / determinant, y: (a * y - b * x) / determinant };
  }
  icon.x = center.x - icon.width / 2;
  icon.y = center.y - icon.height / 2;
}
