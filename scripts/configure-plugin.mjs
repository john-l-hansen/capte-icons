import { writeFile } from 'node:fs/promises';
const id = process.argv[2];
if (!id || !/^\d+$/.test(id)) { console.error('Usage: npm run configure:plugin -- YOUR_NUMERIC_FIGMA_PLUGIN_ID'); process.exit(1); }
await writeFile(new URL('../.figma-plugin-id', import.meta.url), id + '\n');
console.log('Plugin ID saved locally. Run npm run build.');
