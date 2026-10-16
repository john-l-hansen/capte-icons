import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_OPTIONS, GRADES, SIZES, STYLES, THEMES, WEIGHTS, catalog, icons, normalizeOptions, readIconMetadata, renderSvg, searchIcons, strokeWidth, writeIconMetadata } from '../packages/icons/index.ts';

test('every supported configuration renders with the requested dimensions and palette', () => {
  let count = 0;
  for (const icon of icons) for (const size of SIZES) for (const weight of WEIGHTS) for (const grade of GRADES) for (const style of STYLES) for (const theme of THEMES) {
    const svg = renderSvg({ iconId: icon.id, size, weight, grade, style, theme });
    assert.ok(svg.includes(`width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"`));
    assert.doesNotMatch(svg, /NaN|undefined|Infinity|<script|onload=/);
    assert.match(svg, /<(path|ellipse) /); assert.match(svg, theme === 'dark' ? /#f4f6ff/ : /#4147d5/); count++;
  }
  assert.equal(count, icons.length * SIZES.length * WEIGHTS.length * GRADES.length * STYLES.length * THEMES.length);
});
test('grade and weight ordering stay valid at all sizes, including detail strokes', () => {
  for (const size of SIZES) for (const detail of [false, true]) {
    let previous = 0;
    for (const weight of WEIGHTS) {
      const o = { ...DEFAULT_OPTIONS, size, weight };
      const normal = strokeWidth(o, detail);
      assert.ok(normal > previous); previous = normal;
      assert.ok(strokeWidth({ ...o, grade: 'dark-theme' }, detail) < normal);
      assert.ok(strokeWidth({ ...o, grade: 'emphasis' }, detail) > normal);
    }
  }
});
test('catalog uses unique identities and has one template per size/style', () => {
  assert.equal(new Set(icons.map(i => i.id)).size, icons.length);
  for (const icon of icons) {
    assert.equal(icon.templates.length, 12);
    for (const size of SIZES) for (const style of STYLES) assert.equal(icon.templates.filter(t => t.size === size && t.style === style).length, 1);
  }
  assert.equal(catalog.schemaVersion, 1);
});
test('small check badges use approved optical geometry', () => {
  const icon = icons.find(i => i.id === 'location-check')!;
  const badge = (size: number) => icon.templates.find(t => t.size === size && t.style === 'duotone')!.parts.find(p => p.name === 'assignment.badge')!.width;
  assert.ok(badge(20) > badge(48) * 20 / 48);
  assert.ok(badge(24) > badge(48) * 24 / 48);
});
test('search supports keywords, whitespace and categories', () => {
  assert.deepEqual(searchIcons('  MAGNIFIER ').map(i => i.id), ['search']);
  assert.deepEqual(searchIcons('verified', 'Location').map(i => i.id), ['location-check']);
  assert.deepEqual(searchIcons('verified', 'Security'), []);
});
test('metadata round trips, rejects foreign data and validates all controls', () => {
  assert.deepEqual(readIconMetadata(writeIconMetadata(DEFAULT_OPTIONS)), DEFAULT_OPTIONS);
  assert.equal(readIconMetadata(''), null); assert.equal(readIconMetadata('{"schemaVersion":99}'), null);
  for (const bad of [{ size: 32 }, { iconId: '<script>' }, { grade: 'invalid' }, { style: 'bad' }, { theme: 'system' }, { weight: 400 }]) assert.throws(() => normalizeOptions({ ...DEFAULT_OPTIONS, ...bad }));
});


test('full source inventory is covered by semantic, finite templates', () => {
  assert.equal(icons.length, 60);
  for (const icon of icons) for (const template of icon.templates) for (const part of template.parts) {
    for (const paint of [part.fill, part.stroke]) {
      assert.ok(paint === null || typeof paint === 'string', `${icon.id}: unbound raw color`);
      if (typeof paint === 'string') assert.ok(catalog.palettes.light[paint] && catalog.palettes.dark[paint]);
    }
    assert.ok(part.transform.flat().every(Number.isFinite));
    assert.ok(part.width >= 0 && part.height >= 0);
    assert.ok(['VECTOR', 'ELLIPSE'].includes(part.type));
  }
});

test('filled treatments retain contrasting interior marks and crossing clearances', () => {
  for (const [id, name] of [['read-protect', 'read-protect.05'], ['diagnoses', 'diagnoses.05'], ['entry-checklist', 'entry-checklist.03'], ['circle-arrow-up', 'arrow.up'], ['hexagon-plus', 'plus']]) {
    const icon = icons.find(i => i.id === id)!;
    for (const size of SIZES) {
      const part = icon.templates.find(t => t.size === size && t.style === 'filled')!.parts.find(p => p.name === name)!;
      assert.equal(part.stroke, 'surface', `${id}/${size} interior contrast`);
    }
  }
  for (const id of ['data-upload', 'entry-document']) {
    const icon = icons.find(i => i.id === id)!;
    assert.ok(icon.templates.filter(t => t.style === 'filled').every(t => t.parts.some(p => p.name.endsWith('.clearance'))));
    assert.ok(icon.templates.filter(t => t.style !== 'filled').every(t => t.parts.every(p => !p.name.endsWith('.clearance'))));
  }
});

test('the three approved pilot definitions remain byte-equivalent as structured data', async () => {
  const { readFile } = await import('node:fs/promises');
  const { createHash } = await import('node:crypto');
  const hashes = JSON.parse(await readFile(new URL('../packages/icons/pilot-fingerprints.json', import.meta.url), 'utf8'));
  for (const [id, expected] of Object.entries(hashes)) {
    assert.equal(createHash('sha256').update(JSON.stringify(icons.find(i => i.id === id))).digest('hex'), expected, id);
  }
});
