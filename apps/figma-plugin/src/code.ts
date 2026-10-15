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
let lastSelectionId: string | null | undefined;
function selectionChanged(force = false) {
  const selected = selectedIcon();
  const nodeId = selected?.id ?? null;
  // Artwork updates can fire selectionchange for the same root. Do not echo
  // older settings over a newer draft already displayed in the iframe.
  if (!force && nodeId === lastSelectionId) return;
  lastSelectionId = nodeId;
  send({ type: 'selection', nodeId, options: selected ? readIconMetadata(selected.getPluginData(KEY)) : null });
}
figma.on('selectionchange', () => selectionChanged());
async function preferences() {
  try { return normalizeOptions(await figma.clientStorage.getAsync('preferences')); } catch { return DEFAULT_OPTIONS; }
}
figma.ui.onmessage = async (message: unknown) => {
  try {
    if (!message || typeof message !== 'object') throw new Error('Invalid request.');
    const msg = message as { type: string; options?: unknown; targetId?: string };
    if (msg.type === 'ready') { send({ type: 'preferences', options: await preferences() }); selectionChanged(true); return; }
    if (!['insert', 'update', 'preferences'].includes(msg.type)) throw new Error('Unknown action.');
    const options: IconOptions = normalizeOptions(msg.options);
    if (msg.type === 'preferences') { await figma.clientStorage.setAsync('preferences', options); return; }
    const target = msg.type === 'update' ? selectedIcon() : null;
    if (msg.type === 'update' && !target) throw new Error('Select one icon inserted by Capte Icons.');
    // A queued live edit belongs to the icon that was selected when it was sent.
    if (target && msg.targetId !== target.id) { selectionChanged(true); return; }
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
    figma.commitUndo();
    send({ type: 'success', text: target ? 'Icon updated.' : 'Icon inserted.' });
    selectionChanged();
    await figma.clientStorage.setAsync('preferences', options);
  } catch (error) { send({ type: 'error', text: error instanceof Error ? error.message : 'Unable to create the icon.' }); }
};
