// Read-only; execute in the source file's authorized Plugin API environment.
// Limit NAMES for output-limited environments, then merge exported collection batches.
const NAMES = new Set(['Primary', 'Secondary', 'Neutral', 'Feedback', 'Accent', 'Text', 'Background', 'Border', 'Interactive', 'Type Scale', 'Border Radius', 'Spacing', 'Semantic Spacing']);
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const variables = await figma.variables.getLocalVariablesAsync();
const byId = new Map(variables.map(v => [v.id, v]));
const byCollection = new Map(collections.map(c => [c.id, c]));
async function resolve(v, mode, seen = []) {
  if (seen.includes(v.id)) throw new Error('Variable alias cycle: ' + v.id);
  let c = byCollection.get(v.variableCollectionId);
  if (!c) { c = await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId); if (c) byCollection.set(c.id, c); }
  const m = c?.modes.find(m => m.name.toLowerCase() === mode.toLowerCase());
  const value = v.valuesByMode[m?.modeId || c?.defaultModeId || Object.keys(v.valuesByMode)[0]];
  if (value && typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
    let ref = byId.get(value.id);
    if (!ref) { ref = await figma.variables.getVariableByIdAsync(value.id); if (ref) byId.set(ref.id, ref); }
    if (!ref) throw new Error('Missing referenced variable: ' + value.id);
    return await resolve(ref, mode, [...seen, v.id]);
  }
  return value;
}
const result = [];
for (const c of collections.filter(c => NAMES.has(c.name))) {
  result.push({ name: c.name, id: c.id, modes: c.modes, variables: await Promise.all(variables.filter(v => v.variableCollectionId === c.id).map(async v => ({ id: v.id, name: v.name, type: v.resolvedType, light: await resolve(v, 'Light'), dark: await resolve(v, 'Dark') }))) });
}
const textStyles = (await figma.getLocalTextStylesAsync()).map(s => ({ id: s.id, name: s.name, fontName: s.fontName, fontSize: s.fontSize, lineHeight: s.lineHeight, letterSpacing: s.letterSpacing }));
return { source: { fileKey: 'oFZw7IVtiURZG2x5XhAKyD', nodeId: '560:12154', exportedAt: new Date().toISOString().slice(0, 10) }, collections: result, textStyles };
