import { DEFAULT_OPTIONS, GRADES, SIZES, STYLES, THEMES, WEIGHTS, icons, normalizeOptions, renderSvg, searchIcons } from '../icons/index.ts';
import type { IconOptions } from '../icons/index.ts';

export type ExplorerConfig = {
  plugin?: boolean;
  onInsert?: (options: IconOptions) => void;
  onUpdate?: (options: IconOptions) => void;
  onChange?: (options: IconOptions) => void;
};
const labels: Record<string, string> = { 'dark-theme': 'Dark', normal: 'Normal', emphasis: 'Emphasis', thin: 'Thin', medium: 'Medium', heavy: 'Heavy', outline: 'Outline', filled: 'Filled', duotone: 'Duotone', light: 'Light', dark: 'Dark' };
export function mountExplorer(root: HTMLElement, config: ExplorerConfig = {}) {
  let state = { ...DEFAULT_OPTIONS }, selected = false, selectedNodeId: string | null = null;
  if (!config.plugin) { try { state = normalizeOptions(JSON.parse(localStorage.getItem('capte-icons') || 'null')); } catch { /* Start with defaults. */ } }
  const categoryOptions = `<option value="all">All categories</option>${[...new Set(icons.map(i => i.category))].map(c => `<option>${c}</option>`).join('')}`;
  root.innerHTML = config.plugin ? `<div class="plugin-topbar"><label class="category-control"><span class="sr-only">Category</span><select id="category" aria-label="Category">${categoryOptions}</select></label><label class="search-control"><svg aria-hidden="true" class="search-symbol" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="10" cy="10" r="6"/><path d="m14.5 14.5 5 5"/></svg><input type="search" id="search" aria-label="Search icons" placeholder="Search icons" autocomplete="off"></label></div>
    <div class="workspace"><aside class="controls" aria-label="Icon settings"><div class="fields"></div><div class="selected-preview" hidden></div><strong class="selected-name" hidden></strong></aside><section class="browser" aria-label="Icon catalog"><span id="count" class="sr-only" role="status"></span><div class="icon-grid"></div></section></div>
    <div class="plugin-actions"><p class="status" role="status" aria-live="polite"></p><div class="actions"></div></div>
    <footer class="documentation"><span role="link" aria-disabled="true" title="Documentation link coming soon">Learn more about Capte Icons<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3h7v7M21 3 10 14M10 3H3v18h18v-7"/></svg></span></footer>` : `<header class="masthead"><div><span class="eyebrow">CAPTE / DESIGN SYSTEM</span><h1>Icons, with intention.</h1><p>A small pilot for a consistent visual language.</p></div><div class="header-tools"><div class="color-control"></div><span class="version">0.1.4 · Pilot</span></div></header>
    <div class="workspace"><aside class="controls" aria-label="Icon settings"><h2>Customize</h2><div class="fields"></div><p class="hint">Grade adjusts stroke thickness independently of the color palette.</p><div class="selected-preview" aria-label="Selected icon preview"></div><strong class="selected-name"></strong><div class="actions"></div><p class="status" role="status" aria-live="polite"></p></aside>
    <section class="browser" aria-label="Icon catalog"><div class="searchbar"><label>Search icons<input type="search" id="search" placeholder="Search names or keywords" autocomplete="off"></label><label>Category<select id="category"><option value="all">All categories</option>${[...new Set(icons.map(i => i.category))].map(c => `<option>${c}</option>`).join('')}</select></label></div><div class="catalog-heading"><h2>Pilot collection</h2><span id="count"></span></div><div class="icon-grid"></div><p class="hint">Three approved icons. More will join after the plugin workflow is validated.</p></section></div>`;
  root.classList.toggle('plugin', !!config.plugin);
  const fields = root.querySelector('.fields')!;
  const controls: Record<string, HTMLSelectElement> = {};
  const fieldDefinitions = [
    ['weight', 'Weight', WEIGHTS], ['style', 'Style', STYLES], ['grade', 'Grade', GRADES], ['size', 'Optical size', SIZES], ['theme', 'Color', THEMES]
  ] as const;
  for (const [key, title, values] of fieldDefinitions) {
    if (config.plugin && key === 'theme') continue;
    const label = document.createElement('label'); if (key !== 'theme') label.textContent = title;
    const select = document.createElement('select'); select.name = key; select.setAttribute('aria-label', title);
    for (const value of values) { const option = document.createElement('option'); option.value = String(value); option.textContent = key === 'size' ? `${value} dp` : labels[String(value)]; select.append(option); }
    label.append(select); (key === 'theme' ? root.querySelector('.color-control')! : fields).append(label); controls[key] = select;
    select.addEventListener('change', () => {
      state = normalizeOptions({ ...state, [key]: key === 'size' ? Number(select.value) : select.value });
      persist(); render();
      if (config.plugin && selected) config.onUpdate?.(state);
    });
  }
  const status = (text: string, error = false) => { const el = root.querySelector('.status')!; el.textContent = text; el.classList.toggle('error', error); };
  const persist = () => { if (config.plugin) config.onChange?.(state); else { try { localStorage.setItem('capte-icons', JSON.stringify(state)); } catch { /* Storage can be unavailable. */ } } };
  function download() {
    const svg = renderSvg(state), url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const link = document.createElement('a'); link.href = url; link.download = `capte-${state.iconId}-${state.size}-${state.style}-${state.weight}-${state.grade}-${state.theme}.svg`; link.click(); URL.revokeObjectURL(url);
    status('SVG downloaded.');
  }
  const actions = root.querySelector('.actions')!;
  const primary = document.createElement('button'); primary.className = 'primary'; primary.textContent = config.plugin ? 'Insert icon' : 'Download SVG';
  primary.addEventListener('click', () => config.plugin ? config.onInsert?.(state) : download()); actions.append(primary);
  if (!config.plugin) {
    const secondary = document.createElement('button'); secondary.className = 'secondary'; secondary.textContent = 'Copy SVG';
    secondary.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(renderSvg(state)); status('SVG copied.'); } catch { status('Clipboard is unavailable here. Use Download SVG.', true); }
    }); actions.append(secondary);
  }
  function render() {
    root.dataset.theme = state.theme;
    document.documentElement.dataset.theme = state.theme;
    for (const [key, control] of Object.entries(controls)) control.value = String(state[key as keyof IconOptions]);
    root.querySelector('.selected-preview')!.innerHTML = renderSvg(state);
    root.querySelector('.selected-name')!.textContent = icons.find(i => i.id === state.iconId)!.name;
    if (config.plugin) primary.title = selected ? 'Replace the selected Capte icon' : 'Insert a new icon';
    const query = (root.querySelector('#search') as HTMLInputElement).value;
    const category = (root.querySelector('#category') as HTMLSelectElement).value;
    const matches = searchIcons(query, category), grid = root.querySelector('.icon-grid')!;
    grid.replaceChildren(); root.querySelector('#count')!.textContent = `${matches.length} ${matches.length === 1 ? 'icon' : 'icons'}`;
    for (const icon of matches) {
      const button = document.createElement('button'); button.className = 'icon-card'; button.setAttribute('aria-pressed', String(icon.id === state.iconId)); button.setAttribute('aria-label', `Select ${icon.name}`); button.title = `Select ${icon.name}`;
      const preview = document.createElement('span'); preview.className = 'card-art'; preview.innerHTML = renderSvg({ ...state, iconId: icon.id }); preview.setAttribute('aria-hidden', 'true');
      const name = document.createElement('strong'); name.textContent = icon.name;
      const category = document.createElement('small'); category.textContent = icon.category;
      button.append(preview, name, category);
      button.addEventListener('click', () => {
        const changed = state.iconId !== icon.id;
        state = { ...state, iconId: icon.id }; persist(); render();
        if (config.plugin && selected && changed) config.onUpdate?.(state);
      }); grid.append(button);
    }
    if (!matches.length) { const empty = document.createElement('p'); empty.className = 'empty'; empty.textContent = 'No icons found. Try a different keyword or category.'; grid.append(empty); }
  }
  root.querySelector('#search')!.addEventListener('input', render); root.querySelector('#category')!.addEventListener('change', render);
  render();
  const loadOptions = (input: unknown) => { const o = normalizeOptions(input); return config.plugin ? { ...o, theme: 'light' as const } : o; };
  return { status, setOptions(input: unknown) { state = loadOptions(input); render(); },
    setSelection(options: unknown, nodeId: string | null = null) {
      const sameIcon = nodeId !== null && nodeId === selectedNodeId;
      selected = !!options; selectedNodeId = nodeId;
      if (options && !sameIcon) state = loadOptions(options);
      render();
      status(selected ? 'Changes apply live. Insert icon replaces this selection.' : '');
    } };
}
