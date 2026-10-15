import { build } from 'esbuild';
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { generateTokenCss } from './design-tokens.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
const plugin = 'apps/figma-plugin/dist', docs = 'apps/docs/dist';
await Promise.all([mkdir(plugin, { recursive: true }), mkdir(docs, { recursive: true })]);
await Promise.all([
  build({ entryPoints: ['apps/figma-plugin/src/code.ts'], bundle: true, outfile: `${plugin}/code.js`, format: 'iife', target: 'es2019' }),
  build({ entryPoints: ['apps/docs/src/main.ts'], bundle: true, outfile: `${docs}/main.js`, format: 'esm', target: 'es2020', minify: true }),
]);
const ui = await build({ entryPoints: ['apps/figma-plugin/src/ui.ts'], bundle: true, write: false, format: 'iife', target: 'es2019', minify: true });
const snapshot = JSON.parse(await readFile('packages/ui/design-tokens.json', 'utf8'));
const catalog = JSON.parse(await readFile('packages/icons/catalog.json', 'utf8'));
const tokenCss = generateTokenCss(snapshot, catalog);
const styles = await readFile('packages/ui/styles.css', 'utf8');
const defined = new Set([...tokenCss.matchAll(/(--capte-[\w-]+):/g)].map(m => m[1]));
for (const [, name] of styles.matchAll(/var\((--capte-[\w-]+)/g)) if (!defined.has(name)) throw new Error(`Missing Figma token: ${name}`);
const fontFiles = [['Roboto', 400, 'roboto-latin-400-normal.woff2'], ['Roboto', 500, 'roboto-latin-500-normal.woff2'], ['Roboto', 700, 'roboto-latin-700-normal.woff2'], ['Roboto Mono', 500, 'roboto-mono-latin-500-normal.woff2']];
const fontCss = await Promise.all(fontFiles.map(async ([family, weight, file]) => `@font-face{font-family:"${family}";font-style:normal;font-weight:${weight};font-display:swap;src:url(data:font/woff2;base64,${(await readFile(`packages/ui/fonts/${file}`)).toString('base64')}) format('woff2');}`));
const notices = await Promise.all(['Roboto-LICENSE.txt', 'Roboto-Mono-LICENSE.txt'].map(name => readFile(`packages/ui/fonts/${name}`, 'utf8')));
const css = `/* Bundled font notices\n${notices.join('\n')}\n*/\n${fontCss.join('\n')}\n${tokenCss}\n${styles}`;
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><main id="app"></main><script>${ui.outputFiles[0].text.replaceAll('</script', '<\\/script')}</script></body></html>`;
await writeFile(`${plugin}/ui.html`, html);
const manifest = JSON.parse(await readFile('apps/figma-plugin/manifest.json', 'utf8'));
try { manifest.id = (await readFile('.figma-plugin-id', 'utf8')).trim(); } catch { /* Configure the assigned Figma ID before importing. */ }
await writeFile(`${plugin}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n');
await Promise.all([copyFile('apps/docs/index.html', `${docs}/index.html`), writeFile(`${docs}/styles.css`, css)]);
console.log(`Built plugin: ${path.join(plugin, 'manifest.json')}`);
if (manifest.id === 'capte-icons-development') console.log('Before importing: npm run configure:plugin -- YOUR_FIGMA_PLUGIN_ID, then rebuild.');
console.log(`Built explorer: ${docs}/index.html`);
