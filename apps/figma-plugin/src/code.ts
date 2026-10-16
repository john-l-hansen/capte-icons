import { DEFAULT_OPTIONS, formatName, normalizeOptions, readIconMetadata, renderSvg, writeIconMetadata } from '../../../packages/icons/index.ts';
import type { IconOptions } from '../../../packages/icons/index.ts';
import { bindColors, colorTokens, outlineArtwork } from './artwork.ts';

const KEY = 'capte-icon';
figma.showUI(__html__, { width: 360, height: 680, themeColors: true });
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
async function handleMessage(message: unknown) {
  let staged: FrameNode | null = null;
  try {
    if (!message || typeof message !== 'object') throw new Error('Invalid request.');
    const msg = message as { type: string; options?: unknown; targetId?: string };
    if (msg.type === 'ready') { send({ type: 'preferences', options: await preferences() }); selectionChanged(true); return; }
    if (!['insert', 'update', 'preferences'].includes(msg.type)) throw new Error('Unknown action.');
    const options: IconOptions = { ...normalizeOptions(msg.options), theme: 'light' };
    if (msg.type === 'preferences') { await figma.clientStorage.setAsync('preferences', options); return; }
    const target = selectedIcon();
    if (msg.type === 'update' && !target) throw new Error('Select one icon inserted by Capte Icons.');
    // A queued live edit belongs to the icon that was selected when it was sent.
    const expectedId = msg.targetId ?? null;
    if (expectedId !== (target?.id ?? null)) { selectionChanged(true); return; }
    let ancestor: BaseNode | null = target;
    while (ancestor && ancestor.type !== 'PAGE') {
      if ('locked' in ancestor && ancestor.locked) throw new Error('Unlock the selected icon and its parent before updating it.');
      if (ancestor.type === 'INSTANCE') throw new Error('Edit this icon in its main component.');
      ancestor = ancestor.parent;
    }
    const colors = await colorTokens();
    // Selection can move while library token imports are in progress.
    if ((selectedIcon()?.id ?? null) !== expectedId || target?.removed) { selectionChanged(true); return; }
    const fresh = staged = figma.createNodeFromSvg(renderSvg(options));
    outlineArtwork(fresh);
    await bindColors(fresh, options, colors.tokens);
    if ((selectedIcon()?.id ?? null) !== expectedId || target?.removed || target?.locked) { fresh.remove(); staged = null; selectionChanged(true); return; }
    let node: FrameNode = fresh;
    if (target) {
      // Keep the root ID, parent, placement and rotation; only replace generated artwork.
      const oldChildren = [...target.children];
      target.resizeWithoutConstraints(options.size, options.size);
      for (const [id, mode] of Object.entries(fresh.explicitVariableModes)) target.setExplicitVariableModeForCollection(id, mode);
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
    staged = null;
    figma.currentPage.selection = [node];
    figma.commitUndo();
    send({ type: 'success', text: `${target ? 'Icon replaced.' : 'Icon inserted.'}${colors.local ? ' Local color tokens attached.' : ' Library color tokens attached.'}` });
    selectionChanged();
    await figma.clientStorage.setAsync('preferences', options);
  } catch (error) {
    if (staged && !staged.removed) staged.remove();
    send({ type: 'error', text: error instanceof Error ? error.message : 'Unable to create the icon.' });
  }
}
// Serialize artwork edits so slower token imports cannot overwrite a newer draft.
let pending = Promise.resolve();
figma.ui.onmessage = (message: unknown) => pending = pending.then(() => handleMessage(message));
