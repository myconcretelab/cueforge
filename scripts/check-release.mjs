import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { URL } from 'node:url';

const root = new URL('../', import.meta.url);
const packageMetadata = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
const changelog = await readFile(new URL('CHANGELOG.md', root), 'utf8');
const releaseCatalog = await readFile(new URL('src/server/releases.ts', root), 'utf8');
const version = packageMetadata.version;

if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error(`Version invalide dans package.json : ${version}`);
if (!changelog.includes(`## [${version}]`)) throw new Error(`CHANGELOG.md ne contient pas la version ${version}.`);
if (!releaseCatalog.includes(`version: '${version}'`)) throw new Error(`Le catalogue des nouveautés ne contient pas la version ${version}.`);

process.stdout.write(`Version ${version} cohérente avec le changelog et le catalogue.\n`);
