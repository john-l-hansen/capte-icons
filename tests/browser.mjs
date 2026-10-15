import { chromium } from 'playwright';
import http from 'node:http';
import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('apps/docs/dist'), artifactDir = path.resolve('tests/artifacts');
await mkdir(artifactDir, { recursive: true });
const server = http.createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const file = pathname === '/plugin' ? path.resolve('apps/figma-plugin/dist/ui.html') : path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (pathname !== '/plugin' && !file.startsWith(root + path.sep)) throw new Error('Invalid path');
    const content = await readFile(file); res.writeHead(200, { 'Content-Type': file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html' }); res.end(content);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox'] } : {}) });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(7000);
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(url);
  assert.equal(await page.locator('.icon-card').count(), 3);
  await page.getByLabel('Search icons').fill('magnifier'); assert.equal(await page.locator('.icon-card').count(), 1);
  await page.getByLabel('Search icons').fill('no-such-icon'); assert.match(await page.locator('.empty').innerText(), /No icons found/);
  await page.getByLabel('Search icons').fill('');
  await page.getByLabel('Category').selectOption('Security'); assert.equal(await page.locator('.icon-card').count(), 1);
  await page.getByRole('button', { name: /Select Shield Lock/ }).click();
  await page.getByLabel('Category').selectOption('all');
  await page.getByLabel('Optical size').selectOption('20');
  await page.getByLabel('Weight', { exact: true }).selectOption('heavy');
  await page.getByLabel('Style', { exact: true }).selectOption('filled');
  await page.getByLabel('Grade', { exact: true }).selectOption('emphasis');
  await page.getByLabel('Color', { exact: true }).selectOption('dark');
  assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor), 'rgb(17, 21, 35)');
  assert.equal(await page.locator('.masthead [aria-label="Color"]').count(), 1);
  assert.deepEqual(await page.getByLabel('Color', { exact: true }).locator('option').allTextContents(), ['Light', 'Dark']);
  assert.equal(await page.locator('.fields [name="theme"]').count(), 0);
  assert.equal(await page.getByLabel('Grade', { exact: true }).inputValue(), 'emphasis');
  assert.equal(await page.locator('.selected-preview svg').getAttribute('width'), '20');
  const downloaded = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download SVG' }).click();
  const download = await downloaded, file = path.join(artifactDir, download.suggestedFilename()); await download.saveAs(file);
  assert.match(await readFile(file, 'utf8'), /width="20" height="20"/);
  await page.reload(); assert.equal(await page.getByLabel('Optical size').inputValue(), '20');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(artifactDir, 'explorer-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: path.join(artifactDir, 'explorer-mobile.png'), fullPage: true });
  await page.setViewportSize({ width: 560, height: 720 }); await page.goto(url + '/plugin');
  await page.evaluate(() => { window.__messages = []; addEventListener('message', e => { if (e.data?.pluginMessage) window.__messages.push(e.data.pluginMessage); }); });
  const options = { iconId: 'location-check', size: 24, weight: 'medium', grade: 'normal', style: 'duotone', theme: 'light' };
  // Native Figma messages may have source=null, unlike a browser parent window.
  await page.evaluate(o => dispatchEvent(new MessageEvent('message', { data: { pluginMessage: { type: 'selection', nodeId: 'icon-a', options: o } }, source: null })), options);
  await page.waitForFunction(() => document.querySelector('.status').textContent.includes('selected icon'));
  assert.equal(await page.locator('.actions button').count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Update selected' }).count(), 0);
  await page.getByRole('button', { name: 'Insert icon', exact: true }).click();
  await page.waitForFunction(() => window.__messages.some(m => m.type === 'insert'));
  const updated = await page.evaluate(() => window.__messages.find(m => m.type === 'insert')); assert.deepEqual(updated.options, options);
  await page.getByRole('button', { name: 'Select Shield Lock', exact: true }).click();
  await page.waitForFunction(() => window.__messages.some(m => m.type === 'update' && m.options.iconId === 'shield-lock'));
  await page.getByLabel('Weight', { exact: true }).selectOption('heavy');
  await page.waitForFunction(() => window.__messages.some(m => m.type === 'update' && m.options.weight === 'heavy' && m.targetId === 'icon-a'));
  for (const [label, value, key] of [['Optical size', '40', 'size'], ['Grade', 'emphasis', 'grade'], ['Style', 'filled', 'style'], ['Color', 'dark', 'theme']]) {
    await page.getByLabel(label, { exact: true }).selectOption(value);
    await page.waitForFunction(({ key, value }) => window.__messages.some(m => m.type === 'update' && String(m.options[key]) === value && m.targetId === 'icon-a'), { key, value });
  }
  // Rapid changes followed by an old same-root echo must keep the latest draft.
  await page.evaluate(() => {
    const weight = document.querySelector('[name=weight]'); weight.value = 'thin'; weight.dispatchEvent(new Event('change'));
    const size = document.querySelector('[name=size]'); size.value = '20'; size.dispatchEvent(new Event('change'));
  });
  await page.evaluate(o => dispatchEvent(new MessageEvent('message', { data: { pluginMessage: { type: 'selection', nodeId: 'icon-a', options: o } } })), options);
  assert.equal(await page.getByLabel('Weight', { exact: true }).inputValue(), 'thin');
  assert.equal(await page.getByLabel('Optical size').inputValue(), '20');
  await page.evaluate(o => dispatchEvent(new MessageEvent('message', { data: { pluginMessage: { type: 'selection', nodeId: 'icon-b', options: o } } })), options);
  assert.equal(await page.getByLabel('Weight', { exact: true }).inputValue(), 'medium');
  await page.getByLabel('Weight', { exact: true }).selectOption('heavy');
  await page.waitForFunction(() => window.__messages.some(m => m.type === 'update' && m.targetId === 'icon-b' && m.options.weight === 'heavy'));
  await page.evaluate(() => postMessage({ pluginMessage: { type: 'selection', options: null } }, '*'));
  await page.waitForFunction(() => document.querySelector('.status').textContent === '');
  await page.evaluate(() => { window.__messages = []; });
  await page.getByLabel('Weight', { exact: true }).selectOption('thin');
  await page.getByRole('button', { name: 'Select Search', exact: true }).click();
  assert.equal(await page.evaluate(() => window.__messages.filter(m => m.type === 'update').length), 0);
  await page.getByRole('button', { name: 'Insert icon', exact: true }).click();
  await page.waitForFunction(() => window.__messages.some(m => m.type === 'insert' && m.options.iconId === 'search'));
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.mouse.move(0, 0);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(artifactDir, 'plugin-ui.png'), fullPage: true });
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).fontFamily.includes('Roboto')), true);
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.primary')).backgroundColor), 'rgb(221, 54, 3)');
  assert.deepEqual(errors, []);
  console.log('Browser checks passed: filters, controls, download, storage, plugin bridge and responsive layout.');
} finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
