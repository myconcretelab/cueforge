const baseUrl = 'http://127.0.0.1:43821';
const title = document.querySelector('#status-title');
const message = document.querySelector('#status-message');
const dot = document.querySelector('#status-dot');
const output = document.querySelector('#main-output');
const cacheCount = document.querySelector('#cache-count');

async function request(path, init) {
  const response = await fetch(`${baseUrl}${path}`, init);
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Requête impossible.');
  return response.status === 204 ? undefined : response.json();
}

async function refresh() {
  try {
    const status = await request('/v1/status');
    cacheCount.textContent = String(status.cachedTracks);
    dot.className = status.paired ? 'ready' : '';
    title.textContent = status.paired ? 'Bridge associé' : 'Association requise';
    message.textContent = status.paired
      ? `Connecté à ${status.serverUrl}. CueForge peut piloter cette machine.`
      : 'Dans CueForge, ouvrez Paramètres puis cliquez sur « Connecter CueForge Bridge ».';
    if (!status.paired) return;
    const data = await request('/v1/outputs');
    output.innerHTML = '';
    for (const device of data.outputs) {
      const option = document.createElement('option');
      option.value = device.id;
      option.textContent = device.name;
      option.selected = device.id === data.mainOutputId;
      output.append(option);
    }
    output.disabled = false;
  } catch (error) {
    dot.className = 'error';
    title.textContent = 'Bridge indisponible';
    message.textContent = error instanceof Error ? error.message : 'Le serveur local ne répond pas.';
  }
}

output.addEventListener('change', async () => {
  try {
    await request('/v1/outputs/main', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: output.value }),
    });
  } catch (error) {
    message.textContent = error instanceof Error ? error.message : 'Sortie audio inaccessible.';
  }
});
document.querySelector('#refresh').addEventListener('click', refresh);
document.querySelector('#clear-cache').addEventListener('click', async () => {
  try {
    await request('/v1/cache', { method: 'DELETE' });
    await refresh();
  } catch (error) {
    message.textContent = error instanceof Error ? error.message : 'Suppression du cache impossible.';
  }
});
refresh();
setInterval(refresh, 2000);
