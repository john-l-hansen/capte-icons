import { mountExplorer } from '../../../packages/ui/explorer.ts';
const VERSION = '0.1.11';
let selectedId: string | null = null;
let responseTimer: ReturnType<typeof setTimeout> | undefined;
let awaitingAction = false;
let lastStage = 'Connecting to Figma…';
function watchResponse() {
  clearTimeout(responseTimer);
  responseTimer = setTimeout(() => explorer.status(`v${VERSION} · No response after: ${lastStage} Open the plugin console and share its Capte Icons messages.`, true), 12000);
}
function action(type: string, options: unknown) {
  awaitingAction = true; lastStage = 'Sending request to Figma…';
  explorer.status(`v${VERSION} · ${lastStage}`); watchResponse(); send(type, options);
}
const send = (type: string, options?: unknown) => parent.postMessage({ pluginMessage: { type, options, ...(['insert', 'update'].includes(type) ? { targetId: selectedId } : {}) } }, '*');
const explorer = mountExplorer(document.getElementById('app')!, { plugin: true,
  onInsert: options => action('insert', options), onUpdate: options => action('update', options), onChange: options => send('preferences', options) });
window.addEventListener('message', event => {
  // Figma's native host and Developer VM can use null or non-parent sources.
  // Validate the plugin envelope rather than relying on browser window identity.
  const message = event.data?.pluginMessage;
  if (!message || typeof message !== 'object' || !['progress', 'preferences', 'selection', 'success', 'error'].includes(message.type)) return;
  try {
    if (message.type === 'progress') {
      lastStage = message.text; explorer.status(message.text);
      if (awaitingAction) watchResponse(); else clearTimeout(responseTimer);
    }
    else if (message.type === 'preferences') explorer.setOptions(message.options);
    else if (message.type === 'selection') {
      selectedId = message.nodeId ?? null;
      explorer.setSelection(message.options, selectedId);
    }
    else if (message.type === 'success' || message.type === 'error') {
      awaitingAction = false; clearTimeout(responseTimer);
      explorer.status(`v${VERSION} · ${message.text}`, message.type === 'error');
    }
  } catch { explorer.status('Unable to load these icon settings.', true); }
});
explorer.status(`v${VERSION} · Connecting to Figma…`); watchResponse(); send('ready');
