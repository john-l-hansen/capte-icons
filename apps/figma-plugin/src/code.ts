import { DEFAULT_OPTIONS, formatName, normalizeOptions, readIconMetadata, renderSvg, writeIconMetadata } from '../../../packages/icons/index.ts';
import type { IconOptions } from '../../../packages/icons/index.ts';

const KEY = 'capte-icon';
figma.showUI(__html__, { width: 560, height: 720, themeColors: true });
const send = (message: object) => figma.ui.postMessage(message);
function selectedIcon(): FrameNode | null {
  const nodes = figma.currentPage.selection;
  if (nodes.length !== 1) return null;
  // Clicking artwork can select a vector inside the generated icon frame.
  let node: BaseNode | null = nodes[0];
  while (node && node.type !== 'PAGE' && node.type !== 'DOCUMENT') {
    if (node.type === 'FRAME' && readIconMetadata(node.getPluginData(KEY))) return node;
    node = node.parent;
  }
  return null;
}
function selectionChanged() {
  const selected = selectedIcon();
  send({ type: 'selection', options: selected ? readIconMetadata(selected.getPluginData(KEY)) : null });
}
figma.on('selectionchange', selectionChanged);
async function preferences() {
  try { return normalizeOptions(await figma.clientStorage.getAsync('preferences')); } catch { return DEFAULT_OPTIONS; }
}
figma.ui.onmessage = async (message: unknown) => {
  try {
    if (!message || typeof message !== 'object') throw new Error('Invalid request.');
    const msg = message as { type: string; options?: unknown };
    if (msg.type === 'ready') { send({ type: 'preferences', options: await preferences() }); selectionChanged(); return; }
    if (!['insert', 'update', 'preferences'].includes(msg.type)) throw new Error('Unknown action.');
    const options: IconOptions = normalizeOptions(msg.options);
    if (msg.type === 'preferences') { await figma.clientStorage.setAsync('preferences', options); return; }
    const target = selectedIcon();
    if (msg.type === 'update' && !target) throw new Error('Select one icon inserted by Capte Icons.');
    if (target?.locked) throw new Error('Unlock the selected icon before updating it.');
    const fresh = figma.createNodeFromSvg(renderSvg(options));
    let node: FrameNode = fresh;
    if (target) {
      // Keep the root ID, parent, placement and rotation; only replace generated artwork.
      const oldChildren = [...target.children];
      target.resizeWithoutConstraints(options.size, options.size);
      for (const child of [...fresh.children]) target.appendChild(child);
      for (const child of oldChildren) child.remove();
      fresh.remove();
      node = target;
    } else {
      const center = figma.viewport.center;
      fresh.x = Math.round(center.x - options.size / 2);
      fresh.y = Math.round(center.y - options.size / 2);
    }
    node.name = formatName(options);
    node.setPluginData(KEY, writeIconMetadata(options));
    node.setRelaunchData({ open: 'Edit icon settings' });
    figma.currentPage.selection = [node];
    send({ type: 'success', text: target ? 'Icon updated.' : 'Icon inserted.' });
    selectionChanged();
    await figma.clientStorage.setAsync('preferences', options);
  } catch (error) { send({ type: 'error', text: error instanceof Error ? error.message : 'Unable to create the icon.' }); }
};
