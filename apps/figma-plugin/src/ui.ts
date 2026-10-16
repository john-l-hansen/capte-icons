import { mountExplorer } from '../../../packages/ui/explorer.ts';
let selectedId: string | null = null;
const send = (type: string, options?: unknown) => parent.postMessage({ pluginMessage: { type, options, ...(['insert', 'update'].includes(type) ? { targetId: selectedId } : {}) } }, '*');
const explorer = mountExplorer(document.getElementById('app')!, { plugin: true,
  onInsert: options => send('insert', options), onUpdate: options => send('update', options), onChange: options => send('preferences', options) });
window.addEventListener('message', event => {
  // Figma's native host can deliver messages without a Window source.
  if (event.source && event.source !== parent) return;
  const message = event.data?.pluginMessage;
  if (!message) return;
  try {
    if (message.type === 'preferences') explorer.setOptions(message.options);
    else if (message.type === 'selection') {
      selectedId = message.nodeId ?? null;
      explorer.setSelection(message.options, selectedId);
    }
    else if (message.type === 'success' || message.type === 'error') explorer.status(message.text, message.type === 'error');
  } catch { explorer.status('Unable to load these icon settings.', true); }
});
send('ready');
