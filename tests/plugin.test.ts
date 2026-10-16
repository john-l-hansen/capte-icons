import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_OPTIONS, readIconMetadata } from '../packages/icons/index.ts';
import { runtime } from './helpers/plugin-runtime.ts';
test('plugin inserts catalog artwork and stores editable configuration', async () => {
  const r = runtime(); await r.send('insert'); const node = r.page.selection[0];
  assert.equal(node.width, 24); assert.equal(node.x, 88); assert.equal(node.y, 188);
  assert.equal(readIconMetadata(node.getPluginData('capte-icon'))?.iconId, 'search');
});
test('updating an owned icon retains the root, parent, placement and rotation', async () => {
  const r = runtime(); await r.send('insert'); const old = r.page.selection[0]; old.x = 27; old.y = 42; old.rotation = 30;
  const parent = old.parent, id = old.id;
  await r.send('update', { ...DEFAULT_OPTIONS, iconId: 'shield-lock', size: 48, style: 'filled' });
  assert.equal(r.page.selection[0], old); assert.equal(old.id, id); assert.equal(old.parent, parent);
  assert.deepEqual([old.x, old.y, old.rotation, old.width, old.height], [27, 42, 30, 48, 48]);
  assert.ok(old.children.length > 0); assert.equal(r.page.children.length, 1);
});
test('unowned, multiple, locked and invalid selections are not overwritten', async () => {
  const r = runtime(), unowned = r.frame(20); r.page.selection = [unowned];
  await r.send('update'); assert.equal(r.messages.at(-1).type, 'error'); assert.equal(unowned.width, 20);
  await r.send('insert'); const owned = r.page.selection[0]; owned.locked = true;
  await r.send('update'); assert.equal(r.messages.at(-1).type, 'error');
  r.page.selection = [owned, unowned]; await r.send('update'); assert.equal(r.messages.at(-1).type, 'error');
  const count = r.page.children.length; await r.send('insert', { ...DEFAULT_OPTIONS, size: -1 }); assert.equal(r.page.children.length, count);
});
test('selecting a generated vector loads and updates its owning icon', async () => {
  const r = runtime(); await r.send('insert'); const root = r.page.selection[0];
  r.page.selection = [root.children[0]]; r.events.selectionchange();
  assert.equal(r.messages.filter(m => m.type === 'selection').at(-1).options.iconId, 'search');
  await r.send('update', { ...DEFAULT_OPTIONS, iconId: 'shield-lock' });
  assert.equal(r.page.selection[0], root);
  assert.equal(readIconMetadata(root.getPluginData('capte-icon'))?.iconId, 'shield-lock');
});
test('live edits and Insert icon both replace a selected owned icon', async () => {
  const r = runtime(); await r.send('insert'); const root = r.page.selection[0];
  root.x = 18; root.y = 36; root.rotation = 15;
  // SVG children may have scale constraints: updates must not resize their geometry.
  root.resize = () => { throw new Error('Constrained resize would distort the artwork.'); };
  for (const iconId of ['shield-lock', 'location-check', 'search']) {
    await r.send('update', { ...DEFAULT_OPTIONS, iconId, size: 48 });
    assert.equal(r.page.children.length, 1);
    assert.ok(root.children.length > 0);
    assert.equal(r.page.selection[0], root);
    assert.equal(readIconMetadata(root.getPluginData('capte-icon'))?.iconId, iconId);
    assert.deepEqual([root.x, root.y, root.rotation], [18, 36, 15]);
  }
  assert.equal(r.undoCommits, 4);
  await r.send('insert');
  assert.equal(r.page.children.length, 1);
  assert.equal(r.page.selection[0], root);
  r.page.selection = [];
  await r.send('insert');
  assert.equal(r.page.children.length, 2);
  assert.notEqual(r.page.selection[0], root);
});
test('a queued edit cannot mutate a newly selected icon', async () => {
  const r = runtime(); await r.send('insert'); const first = r.page.selection[0];
  r.page.selection = []; await r.send('insert'); const second = r.page.selection[0];
  await r.send('update', { ...DEFAULT_OPTIONS, weight: 'heavy' }, first.id);
  assert.equal(readIconMetadata(second.getPluginData('capte-icon'))?.weight, 'medium');
  assert.equal(r.undoCommits, 2);
});
test('same-root selection events do not echo old settings over rapid live edits', async () => {
  const r = runtime(); await r.send('insert');
  const before = r.messages.filter(m => m.type === 'selection').length;
  const heavy = { ...DEFAULT_OPTIONS, weight: 'heavy' };
  await r.send('update', heavy); r.events.selectionchange();
  await r.send('update', { ...heavy, size: 40 }); r.events.selectionchange();
  assert.equal(r.messages.filter(m => m.type === 'selection').length, before);
  assert.equal(readIconMetadata(r.page.selection[0].getPluginData('capte-icon'))?.size, 40);
});

test('inserted and replaced artwork has filled outlines bound to reusable color variables', async () => {
  const r = runtime(); await r.send('insert');
  const root = r.page.selection[0];
  const check = () => {
    assert.ok(root.children.length > 0);
    for (const part of root.children) {
      assert.equal(part.strokes.length, 0);
      assert.ok(part.fills.length > 0);
      for (const paint of part.fills) assert.ok(paint.boundVariables.color.id);
    }
  };
  check(); assert.equal(r.collections.length, 1); assert.equal(r.variables.length, 5);
  const ids = r.variables.map(v => v.id);
  r.variables[0].valuesByMode.light = { r: 1, g: 0, b: 0 };
  await r.send('insert', { ...DEFAULT_OPTIONS, iconId: 'shield-lock' });
  check(); assert.equal(r.page.children.length, 1); assert.deepEqual(r.variables.map(v => v.id), ids);
  assert.deepEqual(r.variables[0].valuesByMode.light, { r: 1, g: 0, b: 0 });
});
test('a failure to outline preserves existing artwork and removes the staged frame', async () => {
  const r = runtime(); await r.send('insert'); const root = r.page.selection[0];
  const children = [...root.children]; const create = r.figma.createNodeFromSvg;
  r.figma.createNodeFromSvg = (svg: string) => { const n = create(svg); for (const child of n.children) child.outlineStroke = () => null; return n; };
  await r.send('insert', { ...DEFAULT_OPTIONS, iconId: 'shield-lock' });
  assert.equal(r.messages.at(-1).type, 'error'); assert.equal(r.page.children.length, 1);
  assert.deepEqual(root.children, children);
});
test('selection is checked again after asynchronous library-token work', async () => {
  const r = runtime(); await r.send('insert'); const first = r.page.selection[0];
  r.page.selection = []; await r.send('insert'); const second = r.page.selection[0];
  r.page.selection = [first];
  let release!: () => void, entered!: () => void;
  const waiting = new Promise<void>(resolve => { entered = resolve; });
  r.figma.variables.getLocalVariablesAsync = async () => { entered(); await new Promise<void>(resolve => { release = resolve; }); return r.variables; };
  const update = r.send('insert', { ...DEFAULT_OPTIONS, iconId: 'shield-lock' }, first.id);
  await waiting; r.page.selection = [second]; release(); await update;
  assert.equal(readIconMetadata(first.getPluginData('capte-icon'))?.iconId, 'search');
  assert.equal(readIconMetadata(second.getPluginData('capte-icon'))?.iconId, 'search');
  assert.equal(r.page.children.length, 2);
});
test('published source color variables are reused without creating fallback tokens', async () => {
  const r = runtime(); const c = r.figma.variables.createVariableCollection('Published library');
  r.figma.variables.importVariableByKeyAsync = async (key: string) => {
    const v = r.figma.variables.createVariable('Library color', c); v.key = key; return v;
  };
  await r.send('insert');
  assert.equal(r.collections.length, 1); assert.equal(r.variables.length, 5);
  assert.match(r.messages.find(m => m.type === 'success').text, /Library color tokens/);
  for (const part of r.page.selection[0].children) for (const paint of part.fills) assert.ok(r.variables.some(v => v.id === paint.boundVariables.color.id));
});

 test('new icons center inside selected frames without joining auto-layout', async () => {
  const r = runtime(), frame = r.frame(200); frame.x = 50; frame.y = 80; frame.layoutMode = 'HORIZONTAL';
  r.page.selection = [frame]; await r.send('insert'); const icon = r.page.selection[0];
  assert.equal(icon.parent, frame); assert.equal(icon.layoutPositioning, 'ABSOLUTE');
  assert.deepEqual([icon.x, icon.y], [88, 88]); assert.equal(frame.width, 200);
 });
 test('unselected insertion centers in the overall frame under the viewport center', async () => {
  const r = runtime(), frame = r.frame(400); frame.x = 0; frame.y = 0;
  await r.send('insert'); const icon = r.page.selection[0];
  assert.equal(icon.parent, frame); assert.deepEqual([icon.x, icon.y], [188, 188]);
 });
 test('selected objects use their canvas center in a rotated containing frame', async () => {
  const r = runtime(), frame = r.frame(200), object = r.frame(40);
  Object.defineProperty(frame, 'absoluteTransform', { value: [[0, -1, 300], [1, 0, 100]] });
  Object.defineProperty(object, 'absoluteBoundingBox', { value: { x: 220, y: 140, width: 40, height: 40 } });
  object.type = 'RECTANGLE'; frame.appendChild(object); r.page.selection = [object];
  await r.send('insert'); const icon = r.page.selection[0];
  assert.equal(icon.parent, frame); assert.deepEqual([icon.x, icon.y], [48, 48]);
 });
 test('changing an unowned selection during token import cancels insertion', async () => {
  const r = runtime(), first = r.frame(20), second = r.frame(30); r.page.selection = [first];
  let release!: () => void, entered!: () => void;
  const waiting = new Promise<void>(resolve => { entered = resolve; });
  r.figma.variables.getLocalVariablesAsync = async () => { entered(); await new Promise<void>(resolve => { release = resolve; }); return []; };
  const insert = r.send('insert'); await waiting; r.page.selection = [second]; release(); await insert;
  assert.equal(r.page.children.length, 2); assert.equal(r.undoCommits, 0);
 });

test('insert works when Figma returns fresh selection wrappers for the same node', async () => {
  const r = runtime(), frame = r.frame(200); frame.x = 50; frame.y = 80;
  let selection = [frame];
  Object.defineProperty(r.page, 'selection', {
    get() { return selection.map(node => new Proxy(node, {})); },
    set(nodes) { selection = nodes; },
  });
  await r.send('insert');
  assert.equal(r.undoCommits, 1);
  const icon = r.page.selection[0];
  assert.equal(icon.parent.id, frame.id);
  assert.deepEqual([icon.x, icon.y], [88, 88]);
  await r.send('insert', { ...DEFAULT_OPTIONS, iconId: 'shield-lock' });
  assert.equal(r.undoCommits, 2);
  assert.equal(r.page.selection[0].id, icon.id);
  assert.equal(readIconMetadata(r.page.selection[0].getPluginData('capte-icon'))?.iconId, 'shield-lock');
});
