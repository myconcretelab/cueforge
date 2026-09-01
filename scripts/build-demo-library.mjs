import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { setTimeout as wait } from 'node:timers/promises';
import { fileURLToPath, URL } from 'node:url';

const soundsPerGroup = 5;
const maximumDurationSeconds = 8;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.join(root, 'assets/demo');
const cc0Url = 'https://creativecommons.org/publicdomain/zero/1.0/';

const categories = [
  { name: 'Animaux', color: '#22c55e', groups: [
    { query: 'dog bark', label: 'Aboiements', tags: ['animal', 'chien', 'aboiement'] },
    { query: 'cat meow', label: 'Miaulements', tags: ['animal', 'chat', 'miaulement'] },
    { query: 'forest birds', label: 'Oiseaux', tags: ['animal', 'oiseau', 'chant'] },
  ] },
  { name: 'Bruitages', color: '#eab308', groups: [
    { query: 'door slam', label: 'Portes', tags: ['bruitage', 'porte', 'claquement'] },
    { query: 'footsteps', label: 'Pas', tags: ['bruitage', 'pas', 'marche'] },
    { query: 'phone ring', label: 'Sonneries', tags: ['bruitage', 'téléphone', 'sonnerie'] },
  ] },
  { name: 'Drame', color: '#ef4444', groups: [
    { query: 'dramatic hit', label: 'Impacts dramatiques', tags: ['drame', 'impact', 'cinéma'] },
    { query: 'horror sting', label: 'Horreur', tags: ['drame', 'horreur', 'tension'] },
    { query: 'suspense sting', label: 'Suspense', tags: ['drame', 'suspense', 'mystère'] },
  ] },
  { name: 'Joyeux', color: '#f59e0b', groups: [
    { query: 'happy jingle', label: 'Carillons joyeux', tags: ['joyeux', 'carillon', 'jingle'] },
    { query: 'success jingle', label: 'Réussites', tags: ['joyeux', 'réussite', 'victoire'] },
    { query: 'cartoon boing', label: 'Comédie', tags: ['joyeux', 'comédie', 'cartoon'] },
  ] },
  { name: 'Effets', color: '#8b5cf6', groups: [
    { query: 'magic spell', label: 'Magie', tags: ['effet', 'magie', 'sort'] },
    { query: 'laser', label: 'Lasers', tags: ['effet', 'laser', 'science-fiction'] },
    { query: 'explosion', label: 'Explosions', tags: ['effet', 'explosion', 'impact'] },
  ] },
  { name: 'Ambiances', color: '#06b6d4', groups: [
    { query: 'rainfall', label: 'Pluie', tags: ['ambiance', 'pluie', 'météo'] },
    { query: 'forest birds ambience', label: 'Forêt', tags: ['ambiance', 'forêt', 'nature'] },
    { query: 'street ambience', label: 'Ville', tags: ['ambiance', 'ville', 'extérieur'] },
  ] },
  { name: 'Transitions', color: '#f97316', groups: [
    { query: 'whoosh transition', label: 'Souffles', tags: ['transition', 'whoosh', 'souffle'] },
    { query: 'riser transition', label: 'Montées', tags: ['transition', 'montée', 'riser'] },
    { query: 'swipe transition', label: 'Balayages', tags: ['transition', 'balayage', 'mouvement'] },
  ] },
  { name: 'Public', color: '#ec4899', groups: [
    { query: 'audience applause', label: 'Applaudissements', tags: ['public', 'applaudissements', 'spectacle'] },
    { query: 'crowd laughter', label: 'Rires', tags: ['public', 'rires', 'comédie'] },
    { query: 'crowd cheer', label: 'Acclamations', tags: ['public', 'acclamations', 'foule'] },
  ] },
];

function decodeHtml(value) {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&#x27;', "'")
    .replaceAll('&#39;', "'")
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)));
}

function extractSounds(html) {
  const sounds = [];
  const cardPattern = /data-mp3="([^"]+)"[\s\S]*?data-title="([^"]+)"[\s\S]*?data-duration="([^"]+)"[\s\S]*?<h5[^>]*><a[^>]*href="(\/people\/([^/]+)\/sounds\/(\d+)\/)"/g;
  for (const match of html.matchAll(cardPattern)) {
    sounds.push({
      id: Number(match[6]),
      author: decodeHtml(match[5]),
      originalTitle: decodeHtml(match[2]),
      durationSeconds: Number(match[3]),
      previewUrl: decodeHtml(match[1]),
      sourceUrl: `https://freesound.org${match[4]}`,
    });
  }
  return sounds;
}

function delay(milliseconds) {
  return wait(milliseconds);
}

async function fetchSearchPage(url, query) {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    await delay(attempt === 1 ? 1_500 : 15_000);
    const response = await globalThis.fetch(url, { signal: globalThis.AbortSignal.timeout(20_000) });
    if (response.status !== 429) {
      if (!response.ok) throw new Error(`Recherche Freesound impossible pour « ${query} » (${response.status}).`);
      return response.text();
    }
  }
  throw new Error(`Freesound limite encore la recherche « ${query} » après quatre tentatives.`);
}

async function selectSounds(group, usedIds) {
  const selected = [];
  for (let page = 1; page <= 5 && selected.length < soundsPerGroup; page += 1) {
    const url = new URL('https://freesound.org/search/');
    url.searchParams.set('q', group.query);
    url.searchParams.set('f', 'license:"Creative Commons 0"');
    url.searchParams.set('page', String(page));
    for (const sound of extractSounds(await fetchSearchPage(url, group.query))) {
      if (usedIds.has(sound.id) || sound.durationSeconds < 0.15 || sound.durationSeconds > 60) continue;
      selected.push(sound);
      usedIds.add(sound.id);
      if (selected.length === soundsPerGroup) break;
    }
  }
  if (selected.length !== soundsPerGroup) {
    throw new Error(`Seulement ${selected.length} sons CC0 trouvés pour « ${group.query} ».`);
  }
  return selected;
}

function cleanTitle(title) {
  return title
    .replace(/\.(?:aiff?|flac|m4a|mp3|ogg|wav)$/i, '')
    .replaceAll('_', ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function encodePreview(sound) {
  const output = path.join(outputDirectory, `freesound-${sound.id}.mp3`);
  const argumentsList = [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-i', sound.previewUrl,
    '-t', String(Math.min(sound.durationSeconds, maximumDurationSeconds)),
    '-ar', '44100', '-ac', '2', '-codec:a', 'libmp3lame', '-b:a', '96k',
    output,
  ];
  await new Promise((resolve, reject) => {
    const child = spawn('ffmpeg', argumentsList, { stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`ffmpeg a échoué pour le son ${sound.id}.`)));
  });
}

async function runPool(items, concurrency, task) {
  let index = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (index < items.length) {
      const item = items[index];
      index += 1;
      await task(item);
    }
  }));
}

await mkdir(outputDirectory, { recursive: true });
const usedIds = new Set();
const selectedSounds = [];

for (const category of categories) {
  for (const group of category.groups) {
    const sounds = await selectSounds(group, usedIds);
    for (const sound of sounds) selectedSounds.push({ ...sound, category, group });
    process.stdout.write(`${category.name} · ${group.label}: ${sounds.map((sound) => sound.id).join(', ')}\n`);
  }
}

await runPool(selectedSounds, 6, encodePreview);

const catalog = {
  categories: categories.map(({ name, color }) => ({ name, color })),
  sounds: selectedSounds.map(({ category, group, ...sound }) => ({
    title: cleanTitle(sound.originalTitle),
    assetFilename: `freesound-${sound.id}.mp3`,
    originalFilename: sound.originalTitle,
    category: category.name,
    durationMs: Math.round(Math.min(sound.durationSeconds, maximumDurationSeconds) * 1_000),
    tags: [...group.tags, 'freesound'],
    description: `Son Freesound CC0 · ${group.label}.`,
    sourceId: `freesound:${sound.id}`,
    sourceUrl: sound.sourceUrl,
    copyrightText: `« ${sound.originalTitle} » par ${sound.author} — CC0 (${cc0Url}) — ${sound.sourceUrl}`,
  })),
};

await writeFile(path.join(outputDirectory, 'catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`);
const sourceRows = selectedSounds.map(({ category, group, ...sound }) => {
  const title = sound.originalTitle.replaceAll('|', '\\|');
  return `| ${category.name} | ${group.label} | ${sound.id} | ${title} — ${sound.author} | ${sound.sourceUrl} |`;
});
await writeFile(path.join(outputDirectory, 'SOURCES.md'), `# Sons de démonstration\n\nLes fichiers de ce dossier sont des préécoutes Freesound réencodées en MP3 stéréo 44,1 kHz à 96 kbit/s. Les sons dépassant huit secondes sont intégrés sous forme d’extraits. Tous les sons sont publiés sous [Creative Commons CC0 1.0](${cc0Url}).\n\n| Catégorie | Groupe | ID | Son et auteur | Source |\n| --- | --- | ---: | --- | --- |\n${sourceRows.join('\n')}\n`);
process.stdout.write(`${selectedSounds.length} sons écrits dans ${outputDirectory}.\n`);
