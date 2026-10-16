import vm from 'node:vm';
import { buildSync } from 'esbuild';
import { DEFAULT_OPTIONS, readIconMetadata } from '../../packages/icons/index.ts';
const code = buildSync({ entryPoints: ['apps/figma-plugin/src/code.ts'], bundle: true, write: false, format: 'iife', target: 'es2019' }).outputFiles[0].text;
export function runtime() {
  const messages: any[] = [], page: any = { type: 'PAGE', selection: [], children: [] }, storage = new Map(), events: Record<string, () => void> = {};
  let sequence = 0, undoCommits = 0;
  const collections: any[] = [], variables: any[] = [];
  const variableApi = {
    async getLocalVariablesAsync() { return variables; },
    async getLocalVariableCollectionsAsync() { return collections; },
    async getVariableCollectionByIdAsync(id: string) { return collections.find(c => c.id === id); },
    async importVariableByKeyAsync() { throw new Error('Library not published'); },
    createVariableCollection(name: string) {
      const data = new Map();
      const c: any = { id: 'collection-' + ++sequence, name, defaultModeId: 'light', modes: [{ modeId: 'light', name: 'Light' }],
        getPluginData(k: string) { return data.get(k); }, setPluginData(k: string, v: string) { data.set(k, v); }, renameMode() {} };
      collections.push(c); return c;
    },
    createVariable(name: string, collection: any) {
      const v: any = { id: 'variable-' + ++sequence, key: 'local-' + sequence, name, variableCollectionId: collection.id, valuesByMode: {},
        setValueForMode(mode: string, value: unknown) { v.valuesByMode[mode] = value; }, setVariableCodeSyntax() {} };
      variables.push(v); return v;
    },
    setBoundVariableForPaint(paint: any, _field: string, v: any) { return { ...paint, boundVariables: { color: { type: 'VARIABLE_ALIAS', id: v.id } } }; },
  };
  const frame = (size: number): any => {
    const data = new Map();
    const n: any = { id: String(++sequence), type: 'FRAME', x: 0, y: 0, rotation: 0, width: size, height: size, locked: false, visible: true, layoutMode: 'NONE',
      get absoluteTransform() { return [[1, 0, n.x], [0, 1, n.y]]; },
      get absoluteBoundingBox() { return { x: n.x, y: n.y, width: n.width, height: n.height }; }, children: [], parent: page, removed: false, explicitVariableModes: {},
      setExplicitVariableModeForCollection(collection: any, mode: string) {
        if (!collection || typeof collection !== 'object') throw new Error('Cannot pass a collection id in incremental mode. Please pass the collection node instead.');
        n.explicitVariableModes[collection.id] = mode;
      },
      insertChild(index: number, child: any) { if (child.parent?.children) child.parent.children = child.parent.children.filter((c: any) => c !== child); child.parent = n; n.children.splice(index, 0, child); },
      appendChild(child: any) { if (child.parent?.children) child.parent.children = child.parent.children.filter((c: any) => c !== child); child.parent = n; n.children.push(child); },
      resize(w: number, h: number) { n.width = w; n.height = h; },
      resizeWithoutConstraints(w: number, h: number) { n.width = w; n.height = h; },
      remove() { n.removed = true; n.parent.children = n.parent.children.filter((c: any) => c !== n); },
      getPluginData(key: string) { return data.get(key) || ''; }, setPluginData(key: string, value: string) { data.set(key, value); }, setRelaunchData() {} };
    page.children.push(n); return n;
  };
  const figma: any = { currentPage: page, viewport: { center: { x: 100, y: 200 } }, showUI() {}, commitUndo() { undoCommits++; }, on(name: string, callback: () => void) { events[name] = callback; },
    ui: { postMessage(message: unknown) { messages.push(message); } }, clientStorage: { async getAsync(key: string) { return storage.get(key); }, async setAsync(key: string, value: unknown) { storage.set(key, value); } },
    variables: variableApi,
    createNodeFromSvg(svg: string) {
      const n = frame(Number(svg.match(/width="(\d+)"/)![1]));
      const paint = (hex: string) => hex === 'none' ? [] : [{ type: 'SOLID', color: { r: parseInt(hex.slice(1,3),16)/255, g: parseInt(hex.slice(3,5),16)/255, b: parseInt(hex.slice(5,7),16)/255 } }];
      for (const shape of svg.matchAll(/<(?:path|ellipse) [^>]+/g)) {
        const child: any = { id: String(++sequence), name: 'Artwork', type: 'VECTOR', parent: n,
          fills: paint(shape[0].match(/ fill="([^"]+)"/)![1]), strokes: paint(shape[0].match(/ stroke="([^"]+)"/)![1]),
          remove() { child.parent.children = child.parent.children.filter((c: any) => c !== child); },
          outlineStroke() {
            const o: any = { id: String(++sequence), type: 'VECTOR', name: 'Outline', fills: child.strokes, strokes: [], parent: n,
              remove() { o.parent.children = o.parent.children.filter((c: any) => c !== o); } };
            n.children.push(o); return o;
          } };
        n.children.push(child);
      }
      return n;
    } };

  vm.runInNewContext(code, { figma, setTimeout, clearTimeout, console: { log() {}, error() {} }, __html__: '<html></html>' });
  return { figma, page, frame, messages, events, variables, collections, get undoCommits() { return undoCommits; }, async send(type: string, options: unknown = DEFAULT_OPTIONS, targetId?: string) {
    let target = page.selection[0];
    while (target && target.type !== 'PAGE' && !(target.type === 'FRAME' && target.getPluginData('capte-icon'))) target = target.parent;
    await figma.ui.onmessage({ type, options, targetId: targetId ?? target?.id });
  } };
}
