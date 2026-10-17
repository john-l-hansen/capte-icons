import { DEFAULT_OPTIONS, formatName, normalizeOptions, readIconMetadata, renderSvg, writeIconMetadata } from '../../../packages/icons/index.ts';
import type { IconOptions } from '../../../packages/icons/index.ts';
import { bindColors, colorTokens, outlineArtwork } from './artwork.ts';

import { placeIcon } from './placement.ts';

const VERSION = '0.2.0-beta.1';
const KEY = 'capte-icon';
console.log(`[Capte Icons ${VERSION}] Controller started.`);
figma.showUI(__html__, { width: 360, height: 680, themeColors: true });
const send = (message: object) => figma.ui.postMessage(message);
const progress = (text: string) => {
  console.log(`[Capte Icons ${VERSION}] ${text}`);
  send({ type: 'progress', text: `v${VERSION} · ${text}` });
};
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
function assertEditableTarget(target: FrameNode | null) {
  let ancestor: BaseNode | null = target;
  while (ancestor && ancestor.type !== 'PAGE') {
    if ('locked' in ancestor && ancestor.locked) throw new Error('Unlock the selected icon and its parent before updating it.');
    if (ancestor.type === 'INSTANCE') throw new Error('Edit this icon in its main component.');
    ancestor = ancestor.parent;
  }
}
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
    if (msg.type === 'ready') {
      progress('Connected to Figma.');
      send({ type: 'preferences', options: await preferences() });
      selectionChanged(true); progress('Ready.'); return;
    }
    if (!['insert', 'update', 'preferences'].includes(msg.type)) throw new Error('Unknown action.');
    const options: IconOptions = { ...normalizeOptions(msg.options), theme: 'light' };
    if (msg.type === 'preferences') { await figma.clientStorage.setAsync('preferences', options); return; }
    progress(msg.type === 'insert' ? 'Insert received.' : 'Update received.');
    const target = selectedIcon();
    const selection = [...figma.currentPage.selection];
    const selectionUnchanged = () => selection.length === figma.currentPage.selection.length && selection.every((node, i) => !node.removed && node.id === figma.currentPage.selection[i]?.id);
    if (msg.type === 'update' && !target) throw new Error('Select one icon inserted by Capte Icons.');
    // A queued live edit belongs to the icon that was selected when it was sent.
    const expectedId = msg.targetId ?? null;
    const canceled = () => {
      selectionChanged(true);
      if (msg.type === 'insert') send({ type: 'error', text: 'Selection changed. Click Insert icon again.' });
    };
    if (expectedId !== (target?.id ?? null)) { canceled(); return; }
    assertEditableTarget(target);
    progress('Loading color tokens…');
    const colors = await colorTokens();
    // Selection can move while library token imports are in progress.
    if (!selectionUnchanged() || (selectedIcon()?.id ?? null) !== expectedId || target?.removed) { canceled(); return; }
    assertEditableTarget(target);
    progress('Creating icon artwork…');
    const fresh = staged = figma.createNodeFromSvg(renderSvg(options));
    outlineArtwork(fresh);
    progress('Attaching color tokens…');
    const modes = await bindColors(fresh, options, colors.tokens);
    if (!selectionUnchanged() || (selectedIcon()?.id ?? null) !== expectedId || target?.removed) { fresh.remove(); staged = null; canceled(); return; }
    // Locks and ancestry can change during either asynchronous token phase.
    // Recheck immediately before changing the existing root or its children.
    assertEditableTarget(target);
    progress('Placing icon…');
    let node: FrameNode = fresh;
    if (target) {
      // Keep the root ID, parent, placement and rotation; only replace generated artwork.
      const oldChildren = [...target.children];
      target.resizeWithoutConstraints(options.size, options.size);
      for (const { collection, modeId } of modes) target.setExplicitVariableModeForCollection(collection, modeId);
      for (const child of [...fresh.children]) target.appendChild(child);
      for (const child of oldChildren) child.remove();
      fresh.remove();
      node = target;
    } else {
      placeIcon(fresh, selection);
    }
    node.name = formatName(options);
    node.setPluginData(KEY, writeIconMetadata(options));
    node.setRelaunchData({ open: 'Edit icon settings' });
    staged = null;
    figma.currentPage.selection = [node];
    figma.commitUndo();
    selectionChanged();
    send({ type: 'success', nodeId: node.id, options, text: `${target ? 'Icon replaced.' : 'Icon inserted.'}${colors.local ? ' Local color tokens attached.' : ' Library color tokens attached.'}` });
    await figma.clientStorage.setAsync('preferences', options);
  } catch (error) {
    if (staged && !staged.removed) staged.remove();
    console.error(`[Capte Icons ${VERSION}]`, error);
    send({ type: 'error', text: error instanceof Error ? error.message : 'Unable to create the icon.' });
  }
}
// Serialize artwork edits so slower token imports cannot overwrite a newer draft.
let pending = Promise.resolve();
figma.ui.onmessage = (message: unknown) => {
  console.log(`[Capte Icons ${VERSION}] UI message`, (message as { type?: string })?.type);
  const msg = message as { type?: string; options?: unknown; targetId?: string };
  if (msg?.type === 'apply' || msg?.type === 'insert') {
    // Resolve intent against the real selection at receipt, before queued work.
    // The iframe may have missed a selection message; it cannot decide ownership.
    const target = selectedIcon();
    if (msg.type === 'apply' && !target) return Promise.resolve();
    message = { ...msg, type: msg.type === 'apply' ? 'update' : 'insert', targetId: target?.id ?? null };
  }
  return pending = pending.then(() => handleMessage(message));
};
