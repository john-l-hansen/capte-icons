import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { buildSync } from 'esbuild';
import { DEFAULT_OPTIONS, readIconMetadata } from '../packages/icons/index.ts';
const code = buildSync({ entryPoints: ['apps/figma-plugin/src/code.ts'], bundle: true, write: false, format: 'iife', target: 'es2019' }).outputFiles[0].text;
function runtime() {
  const messages: any[] = [], page: any = { type: 'PAGE', selection: [], children: [] }, storage = new Map(), events: Record<string, () => void> = {};
  let sequence = 0;
  const frame = (size: number): any => {
    const data = new Map();
    const n: any = { id: String(++sequence), type: 'FRAME', x: 0, y: 0, rotation: 0, width: size, height: size, locked: false, children: [], parent: page, removed: false,
      appendChild(child: any) { if (child.parent?.children) child.parent.children = child.parent.children.filter((c: any) => c !== child); child.parent = n; n.children.push(child); },
      resize(w: number, h: number) { n.width = w; n.height = h; },
      resizeWithoutConstraints(w: number, h: number) { n.width = w; n.height = h; },
      remove() { n.removed = true; n.parent.children = n.parent.children.filter((c: any) => c !== n); },
      getPluginData(key: string) { return data.get(key) || ''; }, setPluginData(key: string, value: string) { data.set(key, value); }, setRelaunchData() {} };
    page.children.push(n); return n;
  };
  const figma: any = { currentPage: page, viewport: { center: { x: 100, y: 200 } }, showUI() {}, on(name: string, callback: () => void) { events[name] = callback; },
    ui: { postMessage(message: unknown) { messages.push(message); } }, clientStorage: { async getAsync(key: string) { return storage.get(key); }, async setAsync(key: string, value: unknown) { storage.set(key, value); } },
    createNodeFromSvg(svg: string) { const n = frame(Number(svg.match(/width="(\d+)"/)![1])); const child: any = { type: 'VECTOR', parent: n, remove() { child.parent.children = child.parent.children.filter((c: any) => c !== child); } }; n.children.push(child); return n; } };
  vm.runInNewContext(code, { figma, __html__: '<html></html>' });
  return { figma, page, frame, messages, events, async send(type: string, options: unknown = DEFAULT_OPTIONS) { await figma.ui.onmessage({ type, options }); } };
}
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
  assert.equal(old.children.length, 1); assert.equal(r.page.children.length, 1);
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
  assert.equal(r.messages.at(-1).options.iconId, 'search');
  await r.send('update', { ...DEFAULT_OPTIONS, iconId: 'shield-lock' });
  assert.equal(r.page.selection[0], root);
  assert.equal(readIconMetadata(root.getPluginData('capte-icon'))?.iconId, 'shield-lock');
});
test('inserting while an owned icon is selected replaces it repeatedly without duplicates', async () => {
  const r = runtime(); await r.send('insert'); const root = r.page.selection[0];
  root.x = 18; root.y = 36; root.rotation = 15;
  // SVG children may have scale constraints: updates must not resize their geometry.
  root.resize = () => { throw new Error('Constrained resize would distort the artwork.'); };
  for (const iconId of ['shield-lock', 'location-check', 'search']) {
    await r.send('insert', { ...DEFAULT_OPTIONS, iconId, size: 48 });
    assert.equal(r.page.children.length, 1);
    assert.equal(root.children.length, 1);
    assert.equal(r.page.selection[0], root);
    assert.equal(readIconMetadata(root.getPluginData('capte-icon'))?.iconId, iconId);
    assert.deepEqual([root.x, root.y, root.rotation], [18, 36, 15]);
  }
  r.page.selection = []; await r.send('insert');
  assert.equal(r.page.children.length, 2);
});
