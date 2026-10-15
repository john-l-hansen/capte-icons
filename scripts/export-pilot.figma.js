/* Run exportPilot(figma) in an authorized Figma Plugin API environment.
   Return/download the resulting object as packages/icons/catalog.json.
   This script reads artwork only. It does not change the document. */
export async function exportPilot(figma) {
  const page = figma.root.children.find(p => p.id === '560:12154');
  if (!page) throw new Error('Expected Capte icons page.');
  await figma.setCurrentPageAsync(page);
  const master = await figma.getNodeByIdAsync('3637:28');
  if (!master) throw new Error('Approved pilot masters are missing.');
  const variables = await figma.variables.getLocalVariablesAsync();
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const byId = new Map(variables.map(v => [v.id, v]));
  const color = collections.find(c => c.name === 'icon-color');
  const grade = collections.find(c => c.name === 'icon-grade');
  if (!color || !grade) throw new Error('Missing icon token collections.');
  function resolve(id, mode, seen = []) {
    if (seen.includes(id)) throw new Error('Cyclic token alias.');
    const v = byId.get(id), c = collections.find(c => c.id === v.variableCollectionId);
    const value = v.valuesByMode[mode] ?? v.valuesByMode[c.defaultModeId];
    return value?.type === 'VARIABLE_ALIAS' ? resolve(value.id, mode, [...seen, id]) : value;
  }
  function paint(paints) {
    if (!paints.length) return null;
    if (paints.length !== 1 || paints[0].type !== 'SOLID') throw new Error('Catalog requires one solid semantic paint per part.');
    const p = paints[0];
    if (p.opacity !== undefined && p.opacity !== 1) throw new Error('Extend the catalog schema before exporting translucent paints.');
    return p.boundVariables?.color ? byId.get(p.boundVariables.color.id).name.split('/').pop() : p.color;
  }
  const specs = [
    ['search', 'Search', 'General', ['find', 'magnifier', 'lookup']],
    ['shield-lock', 'Shield Lock', 'Security', ['secure', 'privacy', 'protection']],
    ['location-check', 'Location Check', 'Location', ['map', 'pin', 'verified', 'sites']],
  ];
  const icons = [];
  for (const [id, name, category, tags] of specs) {
    const templates = [];
    for (const style of ['Duotone', 'Outline', 'Filled']) for (const size of [48, 40, 24, 20]) {
      const set = master.children.find(n => n.type === 'COMPONENT_SET' && n.name === `_pilot/ic-${id}/${style}/${size}`);
      const component = set?.children.find(n => n.name === 'Weight=Medium');
      if (!component) throw new Error(`Missing approved master: ${id}/${style}/${size}`);
      const parts = component.children.filter(n => n.name !== 'Bounding box').map(n => {
        if (!['VECTOR', 'ELLIPSE'].includes(n.type)) throw new Error(`Unsupported part: ${n.name}`);
        return { name: n.name, type: n.type, transform: n.relativeTransform, width: n.width, height: n.height,
          ...(n.type === 'VECTOR' ? { paths: n.vectorPaths } : {}), fill: paint(n.fills), stroke: paint(n.strokes),
          detail: !!n.boundVariables.strokeWeight && byId.get(n.boundVariables.strokeWeight.id).name.endsWith('/detail'),
          cap: n.strokeCap, join: n.strokeJoin, dash: n.dashPattern, opacity: n.opacity };
      });
      templates.push({ size, style: style.toLowerCase(), parts });
    }
    icons.push({ id, name, category, tags, templates });
  }
  const profiles = Object.fromEntries(variables.filter(v => v.variableCollectionId === grade.id).map(v => [v.name, Object.fromEntries(grade.modes.map(m => [m.name, v.valuesByMode[m.modeId]]))]));
  const palettes = Object.fromEntries(color.modes.map(m => [m.name.startsWith('Dark') ? 'dark' : 'light', Object.fromEntries(variables.filter(v => v.variableCollectionId === color.id && v.resolvedType === 'COLOR').map(v => [v.name.split('/').pop(), resolve(v.id, m.modeId)]))]));
  return { schemaVersion: 1, version: '0.1.0', source: { fileKey: 'oFZw7IVtiURZG2x5XhAKyD', pilotNodeId: '3637:27' }, icons, profiles, palettes };
}
