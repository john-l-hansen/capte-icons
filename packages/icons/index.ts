import data from './catalog.json' with { type: 'json' };

export const SIZES = [20, 24, 40, 48] as const;
export const WEIGHTS = ['thin', 'medium', 'heavy'] as const;
export const GRADES = ['dark-theme', 'normal', 'emphasis'] as const;
export const STYLES = ['outline', 'filled', 'duotone'] as const;
export const THEMES = ['light', 'dark'] as const;
export type Size = typeof SIZES[number];
export type Weight = typeof WEIGHTS[number];
export type Grade = typeof GRADES[number];
export type Style = typeof STYLES[number];
export type Theme = typeof THEMES[number];
export type IconOptions = { iconId: string; size: Size; weight: Weight; grade: Grade; style: Style; theme: Theme };
type RGB = { r: number; g: number; b: number; a?: number };
type Paint = string | RGB | null;
type Part = { name: string; type: string; transform: number[][]; width: number; height: number;
  paths?: { data: string; windingRule: string }[]; fill: Paint; stroke: Paint; detail: boolean;
  cap: string; join: string; dash: number[]; opacity: number };
export type IconDefinition = { id: string; name: string; category: string; tags: string[];
  templates: { size: number; style: string; parts: Part[] }[] };
export const catalog = data as unknown as { schemaVersion: number; version: string;
  icons: IconDefinition[]; profiles: Record<string, Record<string, number>>;
  palettes: Record<Theme, Record<string, RGB>>; source: { fileKey: string; pilotNodeId: string } };
export const icons = catalog.icons;
export const DEFAULT_OPTIONS: IconOptions = { iconId: 'search', size: 24, weight: 'medium', grade: 'normal', style: 'duotone', theme: 'light' };

export function normalizeOptions(input: unknown): IconOptions {
  if (!input || typeof input !== 'object') throw new Error('Choose an icon and valid settings.');
  const o = input as Record<string, unknown>;
  if (!icons.some(i => i.id === o.iconId)) throw new Error('Unknown icon.');
  for (const [key, allowed] of Object.entries({ size: SIZES, weight: WEIGHTS, grade: GRADES, style: STYLES, theme: THEMES })) {
    if (!(allowed as readonly unknown[]).includes(o[key])) throw new Error(`Invalid ${key}.`);
  }
  return { iconId: o.iconId as string, size: o.size as Size, weight: o.weight as Weight,
    grade: o.grade as Grade, style: o.style as Style, theme: o.theme as Theme };
}

export function searchIcons(query: string, category = 'all'): IconDefinition[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return icons.filter(icon => (category === 'all' || icon.category === category) &&
    terms.every(term => [icon.name, icon.id, icon.category, ...icon.tags].join(' ').toLowerCase().includes(term)));
}

export function strokeWidth(options: IconOptions, detail = false): number {
  const key = `icon/stroke/${options.size}/${options.weight}${detail ? '/detail' : ''}`;
  const grade = { 'dark-theme': 'Dark theme', normal: 'Normal', emphasis: 'Emphasis' }[options.grade];
  const value = catalog.profiles[key]?.[grade];
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Missing stroke profile.');
  return value;
}

const escapeXml = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]!));
const num = (n: number) => Number(n.toFixed(6));
export function colorHex(color: RGB): string {
  return '#' + [color.r, color.g, color.b].map(n => Math.round(n * 255).toString(16).padStart(2, '0')).join('');
}
export function renderSvg(input: IconOptions): string {
  const o = normalizeOptions(input), icon = icons.find(i => i.id === o.iconId)!;
  const template = icon.templates.find(t => t.size === o.size && t.style === o.style);
  if (!template) throw new Error('This icon configuration is unavailable.');
  const paint = (p: Paint) => p === null ? 'none' : colorHex(typeof p === 'string' ? catalog.palettes[o.theme][p] : p);
  const shapes = template.parts.map(part => {
    const t = part.transform;
    const matrix = [t[0][0], t[1][0], t[0][1], t[1][1], t[0][2], t[1][2]].map(num).join(' ');
    const attrs = `transform="matrix(${matrix})" fill="${paint(part.fill)}" stroke="${paint(part.stroke)}" stroke-width="${num(strokeWidth(o, part.detail))}" stroke-linecap="${part.cap === 'ROUND' ? 'round' : part.cap === 'SQUARE' ? 'square' : 'butt'}" stroke-linejoin="${part.join.toLowerCase()}" opacity="${part.opacity}"${part.dash.length ? ` stroke-dasharray="${part.dash.map(num).join(' ')}"` : ''}`;
    if (part.type === 'ELLIPSE') return `<ellipse data-part="${escapeXml(part.name)}" cx="${num(part.width / 2)}" cy="${num(part.height / 2)}" rx="${num(part.width / 2)}" ry="${num(part.height / 2)}" ${attrs}/>`;
    return (part.paths || []).map(path => `<path data-part="${escapeXml(part.name)}" d="${escapeXml(path.data)}" fill-rule="${path.windingRule === 'EVENODD' ? 'evenodd' : 'nonzero'}" ${attrs}/>`).join('');
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${o.size}" height="${o.size}" viewBox="0 0 ${o.size} ${o.size}">${shapes}</svg>`;
}

export const formatName = (o: IconOptions) => `Capte / ${icons.find(i => i.id === o.iconId)?.name} / ${o.size} / ${o.style} / ${o.weight} / ${o.grade} / ${o.theme}`;
export function readIconMetadata(raw: string): IconOptions | null {
  try { const value = JSON.parse(raw); return value.schemaVersion === 1 ? normalizeOptions(value.options) : null; } catch { return null; }
}
export const writeIconMetadata = (o: IconOptions) => JSON.stringify({ schemaVersion: 1, catalogVersion: catalog.version, options: normalizeOptions(o) });
