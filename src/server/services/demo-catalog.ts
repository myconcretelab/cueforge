import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface DemoCategory {
  name: string;
  color: string;
}

export interface DemoSound {
  title: string;
  assetFilename: string;
  originalFilename: string;
  category: string;
  durationMs: number;
  tags: string[];
  description: string;
  sourceId: `freesound:${number}`;
  sourceUrl: `https://freesound.org/people/${string}/sounds/${number}/`;
  copyrightText: string;
}

interface DemoCatalog {
  categories: DemoCategory[];
  sounds: DemoSound[];
}

export const demoAssetDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../assets/demo');
const catalog = JSON.parse(readFileSync(path.join(demoAssetDirectory, 'catalog.json'), 'utf8')) as DemoCatalog;

export const demoCategories = catalog.categories;
export const demoSounds = catalog.sounds;
