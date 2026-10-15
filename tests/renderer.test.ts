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
  assert.equal(count, 648);
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
