// Figma exports are versioned inputs; clients never fetch design tokens at runtime.
export const slug = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export function colorCss(value) {
  if (!value || !['r', 'g', 'b'].every(k => Number.isFinite(value[k]))) throw new Error('Unresolved color token');
  const channels = ['r', 'g', 'b'].map(k => Math.round(value[k] * 255));
  return `rgb(${channels.join(' ')} / ${value.a ?? 1})`;
}
export function generateTokenCss(snapshot, catalog) {
  const light = [], dark = [], seen = new Set();
  for (const collection of snapshot.collections) for (const token of collection.variables) {
    const name = `--capte-${collection.name === 'Accent' ? 'accent-' : ''}${slug(token.name)}`;
    if (seen.has(name)) throw new Error(`Duplicate token: ${name}`);
    seen.add(name);
    const value = mode => token.type === 'COLOR' ? colorCss(token[mode]) : token.type === 'FLOAT' && Number.isFinite(token[mode]) ? `${token[mode]}px` : (() => { throw new Error(`Unsupported token: ${name}`); })();
    light.push(`  ${name}: ${value('light')}; /* ${collection.name}: ${token.name} (${token.id}) */`);
    if (value('light') !== value('dark')) dark.push(`  ${name}: ${value('dark')};`);
  }
  for (const style of snapshot.textStyles) {
    const prefix = `--capte-type-${slug(style.name)}`;
    const weight = style.fontName.variationSettings?.wght ?? ({ Regular: 400, Medium: 500, Bold: 700, Light: 300, SemiBold: 600 }[style.fontName.style]);
    if (!weight) throw new Error(`Unmapped font weight: ${style.name}`);
    light.push(`  /* Figma text style: ${style.name} (${style.id}) */`,
      `  ${prefix}-font-family: ${JSON.stringify(style.fontName.family)}, ${style.fontName.family.includes('Mono') ? 'monospace' : 'sans-serif'};`,
      `  ${prefix}-font-size: ${style.fontSize}px;`, `  ${prefix}-font-weight: ${weight};`,
      `  ${prefix}-line-height: ${style.lineHeight.unit === 'AUTO' ? 'normal' : style.lineHeight.unit === 'PERCENT' ? style.lineHeight.value / 100 : `${style.lineHeight.value}px`};`,
      `  ${prefix}-letter-spacing: ${style.letterSpacing.value}${style.letterSpacing.unit === 'PERCENT' ? 'em' : 'px'};`.replace(`${style.letterSpacing.value}em`, `${style.letterSpacing.value / 100}em`));
  }
  // Approved icon palette has distinct background-mode names; keep its export intact.
  light.push(`  --capte-icon-container: ${colorCss(catalog.palettes.light.container)};`);
  dark.push(`  --capte-icon-container: ${colorCss(catalog.palettes.dark.container)};`);
  return `/* Generated from ${snapshot.source.fileKey}; edit the Figma export, not CSS values. */\n:root {\n${light.join('\n')}\n}\n:root[data-theme=dark], #app[data-theme=dark] {\n${dark.join('\n')}\n}\n`;
}
