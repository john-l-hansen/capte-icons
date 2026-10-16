import { catalog, colorHex } from '../../../packages/icons/index.ts';
import type { IconOptions } from '../../../packages/icons/index.ts';

// Stable variable keys from the approved icon-color collection. No source URL is bundled.
const TOKEN_KEYS: Record<string, string> = {
  stroke: '0f757f4596eaf9c95c73ab299d4493ab4659f2f3',
  fill: 'e2d9812cf8071e34be86937cd20d8ae27f249017',
  surface: '73a706b2cbf3c076c0cf8c7757b1cde787c5e8f1',
  signal: '1e33f823b6f678d620a3ca8413f5763056172cca',
  container: '276c5753fa16b8d961538c9b8f6d7d205e69c175',
};
const OWNER = 'capte-icons-colors';
const unavailableKeys = new Set<string>();
export async function colorTokens() {
  const locals = await figma.variables.getLocalVariablesAsync('COLOR');
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  let fallback = collections.find(c => c.getPluginData(OWNER) === '1');
  const tokens: Record<string, Variable> = {};
  let local = false;
  for (const [role, key] of Object.entries(TOKEN_KEYS)) {
    let variable = locals.find(v => v.key === key);
    if (!variable && !unavailableKeys.has(key)) {
      try { variable = await figma.variables.importVariableByKeyAsync(key); } catch { unavailableKeys.add(key); }
    }
    if (!variable) {
      local = true;
      if (!fallback) {
        fallback = figma.variables.createVariableCollection('Capte Icons');
        fallback.renameMode(fallback.defaultModeId, 'Light');
        fallback.setPluginData(OWNER, '1');
      }
      variable = locals.find(v => v.variableCollectionId === fallback!.id && v.name === `icon/${role}`);
      if (!variable) {
        variable = figma.variables.createVariable(`icon/${role}`, fallback, 'COLOR');
        variable.scopes = ['SHAPE_FILL'];
        const { r, g, b } = catalog.palettes.light[role];
        variable.setValueForMode(fallback.defaultModeId, { r, g, b });
        variable.setVariableCodeSyntax('WEB', `var(--capte-icon-${role})`);
      }
    }
    tokens[role] = variable;
  }
  return { tokens, local };
}

/** Preserve distinct fills; convert every painted stroke into its own filled path. */
export function outlineArtwork(root: FrameNode) {
  const visit = (parent: ChildrenMixin & BaseNode) => {
    for (const child of [...parent.children]) {
      if ('children' in child) visit(child);
      if (!('strokes' in child) || !('outlineStroke' in child) || !child.strokes.some(p => p.visible !== false)) continue;
      const outlined = child.outlineStroke();
      if (!outlined) throw new Error('Figma could not outline this icon. The existing icon was kept.');
      const index = parent.children.indexOf(child);
      parent.insertChild(index + 1, outlined);
      outlined.name = `${child.name} / outlined`;
      outlined.strokes = [];
      child.strokes = [];
      if (!('fills' in child) || child.fills === figma.mixed || !child.fills.some(p => p.visible !== false)) child.remove();
    }
  };
  visit(root);
}

export async function bindColors(root: FrameNode, options: IconOptions, tokens: Record<string, Variable>) {
  const palette = catalog.palettes[options.theme];
  const visit = (node: SceneNode) => {
    if ('fills' in node && node.fills !== figma.mixed) {
      node.fills = node.fills.map(p => {
        if (p.type !== 'SOLID') return p;
        const role = Object.keys(palette).find(role => colorHex(palette[role]) === colorHex(p.color));
        if (!role || !tokens[role]) throw new Error('An icon color has no matching Capte token.');
        return figma.variables.setBoundVariableForPaint(p, 'color', tokens[role]);
      });
    }
    if ('children' in node) for (const child of node.children) visit(child);
  };
  visit(root);
  // Plugin output uses the Light palette; the UI itself has no palette switch.
  for (const id of new Set(Object.values(tokens).map(v => v.variableCollectionId))) {
    const collection = await figma.variables.getVariableCollectionByIdAsync(id);
    const mode = collection?.modes.find(m => /^(light|light background)$/i.test(m.name));
    if (mode) root.setExplicitVariableModeForCollection(id, mode.modeId);
  }
}
