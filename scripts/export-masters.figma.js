/* Read-only Figma export. Pass the resulting array to packages/icons/source-masters.json.
   This exports the existing 48 dp Medium source paths; build-catalog.py creates the
   preview size/style templates. The approved pilot remains in catalog.json. */
export async function exportMasters(figma) {
  const page = await figma.getNodeByIdAsync('560:12154');
  if (!page || page.type !== 'PAGE') throw new Error('Expected icons page.');
  await figma.setCurrentPageAsync(page);
  const masters = await figma.getNodeByIdAsync('3614:1889');
  if (!masters) throw new Error('Missing icon masters section.');
  const variables = await figma.variables.getLocalVariablesAsync();
  const byId = new Map(variables.map(v => [v.id, v]));
  const paint = paints => {
    if (!paints.length) return null;
    const p = paints[0];
    if (paints.length !== 1 || p.type !== 'SOLID' || (p.opacity !== undefined && p.opacity !== 1)) {
      throw new Error('Expected one opaque solid paint per part.');
    }
    return p.boundVariables?.color ? byId.get(p.boundVariables.color.id).name.split('/').pop() : p.color;
  };
  const sets = masters.findAllWithCriteria({ types: ['COMPONENT_SET'] }).filter(n => /^ic-/.test(n.name));
  return sets.map(set => {
    const component = set.children.find(n => n.name === 'Weight=Medium');
    if (!component) throw new Error(`Missing medium source for ${set.name}`);
    return { id: set.name.slice(3), group: set.parent.name, sourceId: set.id,
      parts: component.children.filter(n => n.name !== 'Bounding box').map(n => {
        if (!['VECTOR', 'ELLIPSE'].includes(n.type)) throw new Error(`Unsupported part: ${n.name}`);
        if (n.strokeAlign !== 'CENTER' && n.strokes.length) throw new Error('Expected centered strokes.');
        return { name: n.name, type: n.type, transform: n.relativeTransform, width: n.width, height: n.height,
          ...(n.type === 'VECTOR' ? { paths: n.vectorPaths } : {}), fill: paint(n.fills), stroke: paint(n.strokes),
          detail: false, cap: n.strokeCap, join: n.strokeJoin, dash: n.dashPattern, opacity: n.opacity };
      }) };
  });
}
