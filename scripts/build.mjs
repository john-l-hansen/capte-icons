import { build } from 'esbuild';
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
const plugin = 'apps/figma-plugin/dist', docs = 'apps/docs/dist';
await Promise.all([mkdir(plugin, { recursive: true }), mkdir(docs, { recursive: true })]);
await Promise.all([
  build({ entryPoints: ['apps/figma-plugin/src/code.ts'], bundle: true, outfile: `${plugin}/code.js`, format: 'iife', target: 'es2019' }),
  build({ entryPoints: ['apps/docs/src/main.ts'], bundle: true, outfile: `${docs}/main.js`, format: 'esm', target: 'es2020', minify: true }),
]);
const ui = await build({ entryPoints: ['apps/figma-plugin/src/ui.ts'], bundle: true, write: false, format: 'iife', target: 'es2019', minify: true });
const css = await readFile('packages/ui/styles.css', 'utf8');
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><main id="app"></main><script>${ui.outputFiles[0].text.replaceAll('</script', '<\\/script')}</script></body></html>`;
await writeFile(`${plugin}/ui.html`, html);
const manifest = JSON.parse(await readFile('apps/figma-plugin/manifest.json', 'utf8'));
try { manifest.id = (await readFile('.figma-plugin-id', 'utf8')).trim(); } catch { /* Configure the assigned Figma ID before importing. */ }
await writeFile(`${plugin}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n');
await Promise.all([copyFile('apps/docs/index.html', `${docs}/index.html`), writeFile(`${docs}/styles.css`, css)]);
console.log(`Built plugin: ${path.join(plugin, 'manifest.json')}`);
if (manifest.id === 'capte-icons-development') console.log('Before importing: npm run configure:plugin -- YOUR_FIGMA_PLUGIN_ID, then rebuild.');
console.log(`Built explorer: ${docs}/index.html`);
