import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { URL } from 'node:url';

const root = new URL('../', import.meta.url);
const packageMetadata = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
const changelog = await readFile(new URL('CHANGELOG.md', root), 'utf8');
const releaseCatalog = await readFile(new URL('src/server/releases.ts', root), 'utf8');
const version = packageMetadata.version;
const releaseNotes = await readFile(new URL(`docs/nouveautes/${version}.md`, root), 'utf8');

if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error(`Version invalide dans package.json : ${version}`);
if (!changelog.includes(`## [${version}]`)) throw new Error(`CHANGELOG.md ne contient pas la version ${version}.`);
if (!releaseCatalog.includes(`version: '${version}'`)) throw new Error(`Le catalogue des nouveautés ne contient pas la version ${version}.`);
if (!releaseNotes.includes(`# SonoRiva ${version}`)) throw new Error(`La note de version ${version} ne contient pas le titre attendu.`);

process.stdout.write(`Version ${version} cohérente avec le changelog, le catalogue et la documentation.\n`);
