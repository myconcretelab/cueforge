import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { and, eq, inArray, lte } from 'drizzle-orm';
import { config } from '../config.js';
import { db } from '../db/index.js';
import { accountMemberships, accounts, categories, plans, projects, subscriptions, tracks, users, type User } from '../db/schema.js';
import { CURRENT_VERSION } from '../releases.js';

export const demoLifetimeMs = 24 * 60 * 60 * 1000;
export const demoMaxUploads = 15;
export const demoMaxFileBytes = 5 * 1024 * 1024;
export const demoStorageQuotaBytes = 80 * 1024 * 1024;

const cc0Url = 'https://creativecommons.org/publicdomain/zero/1.0/';
const demoAssetDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../assets/demo');

export const demoCategories = [
  { name: 'Animaux', color: '#22c55e' },
  { name: 'Bruitages', color: '#eab308' },
  { name: 'Drame', color: '#ef4444' },
  { name: 'Joyeux', color: '#f59e0b' },
  { name: 'Effets', color: '#8b5cf6' },
  { name: 'Ambiances', color: '#06b6d4' },
  { name: 'Transitions', color: '#f97316' },
  { name: 'Public', color: '#ec4899' },
] as const;

type DemoCategoryName = typeof demoCategories[number]['name'];

interface DemoSound {
  title: string;
  assetFilename: string;
  originalFilename: string;
  category: DemoCategoryName;
  durationMs: number;
  tags: string[];
  description: string;
  sourceId: `freesound:${number}`;
  sourceUrl: `https://freesound.org/people/${string}/sounds/${number}/`;
  copyrightText: string;
}

function freesoundCopyright(originalTitle: string, author: string, sourceUrl: DemoSound['sourceUrl']): string {
  return `« ${originalTitle} » par ${author} — CC0 (${cc0Url}) — ${sourceUrl}`;
}

export const demoSounds = [
  {
    title: 'Chien — aboiement',
    assetFilename: 'freesound-699822-dog-bark.mp3',
    originalFilename: 'Dog Bark.wav',
    category: 'Animaux',
    durationMs: 308,
    tags: ['animal', 'chien', 'aboiement', 'dog', 'bark'],
    description: 'Aboiement bref enregistré à distance.',
    sourceId: 'freesound:699822',
    sourceUrl: 'https://freesound.org/people/8bitmyketison/sounds/699822/',
    copyrightText: freesoundCopyright('Dog Bark.wav', '8bitmyketison', 'https://freesound.org/people/8bitmyketison/sounds/699822/'),
  },
  {
    title: 'Chat — miaulement',
    assetFilename: 'freesound-256452-cat-meow.mp3',
    originalFilename: 'Cat meow.wav',
    category: 'Animaux',
    durationMs: 1_545,
    tags: ['animal', 'chat', 'miaulement', 'cat', 'meow'],
    description: 'Miaulement court de chat.',
    sourceId: 'freesound:256452',
    sourceUrl: 'https://freesound.org/people/philsapphire/sounds/256452/',
    copyrightText: freesoundCopyright('Cat meow', 'philsapphire', 'https://freesound.org/people/philsapphire/sounds/256452/'),
  },
  {
    title: 'Porte qui claque',
    assetFilename: 'freesound-440261-door-slam.mp3',
    originalFilename: 'Door Slam - No Reverb.wav',
    category: 'Bruitages',
    durationMs: 4_193,
    tags: ['porte', 'claquement', 'bruitage', 'door', 'slam'],
    description: 'Claquement sec d’une porte, sans réverbération ajoutée.',
    sourceId: 'freesound:440261',
    sourceUrl: 'https://freesound.org/people/adriann/sounds/440261/',
    copyrightText: freesoundCopyright('Door Slam - No Reverb.wav', 'adriann', 'https://freesound.org/people/adriann/sounds/440261/'),
  },
  {
    title: 'Pas dans les feuilles',
    assetFilename: 'freesound-398685-forest-footsteps.mp3',
    originalFilename: 'Footsteps - Walking on foliage in a forest.wav',
    category: 'Bruitages',
    durationMs: 10_000,
    tags: ['pas', 'marche', 'feuilles', 'forêt', 'footsteps'],
    description: 'Extrait de pas sur des feuilles en forêt.',
    sourceId: 'freesound:398685',
    sourceUrl: 'https://freesound.org/people/Dominik_W/sounds/398685/',
    copyrightText: freesoundCopyright('Footsteps / Walking on foliage in a forest', 'Dominik_W', 'https://freesound.org/people/Dominik_W/sounds/398685/'),
  },
  {
    title: 'Impact dramatique',
    assetFilename: 'freesound-222517-dramatic-hit.mp3',
    originalFilename: 'Dramatic Hit.flac',
    category: 'Drame',
    durationMs: 7_038,
    tags: ['drame', 'impact', 'cinéma', 'tension', 'dramatic'],
    description: 'Impact grave avec résonance cinématographique.',
    sourceId: 'freesound:222517',
    sourceUrl: 'https://freesound.org/people/qubodup/sounds/222517/',
    copyrightText: freesoundCopyright('Dramatic Hit', 'qubodup', 'https://freesound.org/people/qubodup/sounds/222517/'),
  },
  {
    title: 'Tension horrifique',
    assetFilename: 'freesound-522567-horror-sting.mp3',
    originalFilename: 'Horror sting.flac',
    category: 'Drame',
    durationMs: 12_000,
    tags: ['drame', 'horreur', 'tension', 'peur', 'sting'],
    description: 'Extrait de montée inquiétante créée avec du bruit blanc et de la réverbération.',
    sourceId: 'freesound:522567',
    sourceUrl: 'https://freesound.org/people/SamsterBirdies/sounds/522567/',
    copyrightText: freesoundCopyright('Horror sting', 'SamsterBirdies', 'https://freesound.org/people/SamsterBirdies/sounds/522567/'),
  },
  {
    title: 'Carillon de réussite',
    assetFilename: 'freesound-619838-happy-beeps.mp3',
    originalFilename: 'Achievement Happy Beeps Jingle.wav',
    category: 'Joyeux',
    durationMs: 3_475,
    tags: ['joyeux', 'réussite', 'carillon', 'jingle', 'achievement'],
    description: 'Petit carillon électronique positif.',
    sourceId: 'freesound:619838',
    sourceUrl: 'https://freesound.org/people/CogFireStudios/sounds/619838/',
    copyrightText: freesoundCopyright('Achievement Happy Beeps Jingle', 'CogFireStudios', 'https://freesound.org/people/CogFireStudios/sounds/619838/'),
  },
  {
    title: 'Jingle victoire',
    assetFilename: 'freesound-521949-success-jingle.mp3',
    originalFilename: 'Success Jingle.ogg',
    category: 'Joyeux',
    durationMs: 8_000,
    tags: ['joyeux', 'victoire', 'succès', 'jingle', 'success'],
    description: 'Jingle de réussite en do majeur.',
    sourceId: 'freesound:521949',
    sourceUrl: 'https://freesound.org/people/Kastenfrosch/sounds/521949/',
    copyrightText: freesoundCopyright('Success Jingle', 'Kastenfrosch', 'https://freesound.org/people/Kastenfrosch/sounds/521949/'),
  },
  {
    title: 'Sort magique',
    assetFilename: 'freesound-506939-magic-spell.mp3',
    originalFilename: 'Magic spell - small positive.wav',
    category: 'Effets',
    durationMs: 3_080,
    tags: ['effet', 'magie', 'sort', 'baguette', 'magic'],
    description: 'Effet sonore bref de sort magique positif.',
    sourceId: 'freesound:506939',
    sourceUrl: 'https://freesound.org/people/Nakhas/sounds/506939/',
    copyrightText: freesoundCopyright('Magic spell (small positive)', 'Nakhas', 'https://freesound.org/people/Nakhas/sounds/506939/'),
  },
  {
    title: 'Pop cartoon',
    assetFilename: 'freesound-245645-cartoon-pop.mp3',
    originalFilename: 'Cartoon Pop - Clean.flac',
    category: 'Effets',
    durationMs: 172,
    tags: ['effet', 'cartoon', 'pop', 'comédie', 'animation'],
    description: 'Pop vocal très court pour animation ou comédie.',
    sourceId: 'freesound:245645',
    sourceUrl: 'https://freesound.org/people/unfa/sounds/245645/',
    copyrightText: freesoundCopyright('Cartoon Pop (Clean)', 'unfa', 'https://freesound.org/people/unfa/sounds/245645/'),
  },
  {
    title: 'Pluie intérieure',
    assetFilename: 'freesound-508962-rain-ambience.mp3',
    originalFilename: 'indoor raining ambiance loop.mp3',
    category: 'Ambiances',
    durationMs: 7_861,
    tags: ['ambiance', 'pluie', 'intérieur', 'boucle', 'rain'],
    description: 'Boucle douce de pluie entendue depuis un intérieur.',
    sourceId: 'freesound:508962',
    sourceUrl: 'https://freesound.org/people/Rvgerxini/sounds/508962/',
    copyrightText: freesoundCopyright('indoor raining ambiance loop.mp3', 'Rvgerxini', 'https://freesound.org/people/Rvgerxini/sounds/508962/'),
  },
  {
    title: 'Feu de camp',
    assetFilename: 'freesound-241318-fire-ambience.mp3',
    originalFilename: 'Fire Ambience.mp3',
    category: 'Ambiances',
    durationMs: 12_000,
    tags: ['ambiance', 'feu', 'flammes', 'crépitement', 'fire'],
    description: 'Extrait d’un feu de camp enregistré à distance.',
    sourceId: 'freesound:241318',
    sourceUrl: 'https://freesound.org/people/Danwardvs/sounds/241318/',
    copyrightText: freesoundCopyright('Fire Ambience', 'Danwardvs', 'https://freesound.org/people/Danwardvs/sounds/241318/'),
  },
  {
    title: 'Transition douce',
    assetFilename: 'freesound-701104-light-whoosh.mp3',
    originalFilename: 'Whoosh stereo light - transition.wav',
    category: 'Transitions',
    durationMs: 2_317,
    tags: ['transition', 'whoosh', 'souffle', 'léger', 'stéréo'],
    description: 'Souffle léger allant de gauche à droite.',
    sourceId: 'freesound:701104',
    sourceUrl: 'https://freesound.org/people/xkeril/sounds/701104/',
    copyrightText: freesoundCopyright('Whoosh stereo light (transition)', 'xkeril', 'https://freesound.org/people/xkeril/sounds/701104/'),
  },
  {
    title: 'Transition rapide',
    assetFilename: 'freesound-400372-fast-whoosh.mp3',
    originalFilename: 'FastWhoosh.wav',
    category: 'Transitions',
    durationMs: 520,
    tags: ['transition', 'whoosh', 'rapide', 'mouvement', 'woosh'],
    description: 'Transition très courte et rapide.',
    sourceId: 'freesound:400372',
    sourceUrl: 'https://freesound.org/people/Psykoosiossi/sounds/400372/',
    copyrightText: freesoundCopyright('FastWhoosh.wav', 'Psykoosiossi', 'https://freesound.org/people/Psykoosiossi/sounds/400372/'),
  },
  {
    title: 'Applaudissements',
    assetFilename: 'freesound-391326-light-applause.mp3',
    originalFilename: 'Light Applause.wav',
    category: 'Public',
    durationMs: 8_667,
    tags: ['public', 'applaudissements', 'spectacle', 'foule', 'applause'],
    description: 'Petit public applaudissant après un spectacle.',
    sourceId: 'freesound:391326',
    sourceUrl: 'https://freesound.org/people/ojosdedurazno/sounds/391326/',
    copyrightText: freesoundCopyright('Light Applause', 'ojosdedurazno', 'https://freesound.org/people/ojosdedurazno/sounds/391326/'),
  },
  {
    title: 'Rires du public',
    assetFilename: 'freesound-324894-crowd-laugh.mp3',
    originalFilename: 'Crowd laugh.wav',
    category: 'Public',
    durationMs: 3_309,
    tags: ['public', 'rires', 'foule', 'comédie', 'laughter'],
    description: 'Rire spontané d’un petit public.',
    sourceId: 'freesound:324894',
    sourceUrl: 'https://freesound.org/people/deleted_user_2104797/sounds/324894/',
    copyrightText: freesoundCopyright('Crowd laugh.wav', 'deleted_user_2104797', 'https://freesound.org/people/deleted_user_2104797/sounds/324894/'),
  },
] satisfies readonly DemoSound[];

export function demoExpiration(now = new Date()): Date {
  return new Date(now.getTime() + demoLifetimeMs);
}

export async function createDemoWorkspace(now = new Date()): Promise<User> {
  await mkdir(config.STORAGE_PATH, { recursive: true });
  const seededFiles = await Promise.all(demoSounds.map(async (sound) => ({
    ...sound,
    key: `${randomUUID()}.mp3`,
    content: await readFile(path.join(demoAssetDirectory, sound.assetFilename)),
  })));

  try {
    await Promise.all(seededFiles.map((file) => writeFile(path.join(config.STORAGE_PATH, file.key), file.content, { flag: 'wx' })));
    return await db.transaction(async (transaction) => {
      const [defaultPlan] = await transaction.select().from(plans).where(eq(plans.isDefault, true)).limit(1);
      if (!defaultPlan) throw new Error('Aucun forfait par défaut n’est configuré.');
      const id = randomUUID();
      const [user] = await transaction.insert(users).values({
        id,
        email: `demo-${id}@demo.invalid`,
        displayName: 'Visiteur',
        passwordHash: 'demo-session',
        isDemo: true,
        demoExpiresAt: demoExpiration(now),
        lastSeenRelease: CURRENT_VERSION,
      }).returning();
      const [account] = await transaction.insert(accounts).values({
        name: 'Démo SonoRiva',
        planCode: defaultPlan.code,
        accessStatus: 'active',
        isDemo: true,
        storageQuotaOverrideBytes: demoStorageQuotaBytes,
      }).returning();
      await transaction.insert(accountMemberships).values({ accountId: account.id, userId: user.id, role: 'owner' });
      await transaction.insert(subscriptions).values({ accountId: account.id });
      const [project] = await transaction.insert(projects).values({ accountId: account.id, name: 'Découverte de SonoRiva' }).returning();
      const seededCategories = await transaction.insert(categories).values(demoCategories.map((category, position) => ({
        projectId: project.id,
        ...category,
        position,
      }))).returning();
      const categoryIds = new Map(seededCategories.map((category) => [category.name, category.id]));
      await transaction.insert(tracks).values(seededFiles.map((file, index) => ({
        projectId: project.id,
        categoryId: categoryIds.get(file.category),
        title: file.title,
        originalFilename: file.originalFilename,
        storageKey: file.key,
        mimeType: 'audio/mpeg',
        sizeBytes: file.content.length,
        durationMs: file.durationMs,
        color: demoCategories.find((category) => category.name === file.category)?.color,
        tags: file.tags,
        description: file.description,
        copyrightText: file.copyrightText,
        sourceUrl: file.sourceUrl,
        sourceId: file.sourceId,
        position: index,
        demoSeed: true,
      })));
      return user;
    });
  } catch (error) {
    await Promise.all(seededFiles.map((file) => unlink(path.join(config.STORAGE_PATH, file.key)).catch(() => undefined)));
    throw error;
  }
}

export async function removeDemoUsers(userIds: string[]): Promise<number> {
  if (userIds.length === 0) return 0;
  const owned = await db.select({ accountId: accounts.id, storageKey: tracks.storageKey })
    .from(users)
    .innerJoin(accountMemberships, eq(accountMemberships.userId, users.id))
    .innerJoin(accounts, eq(accounts.id, accountMemberships.accountId))
    .leftJoin(projects, eq(projects.accountId, accounts.id))
    .leftJoin(tracks, eq(tracks.projectId, projects.id))
    .where(and(inArray(users.id, userIds), eq(users.isDemo, true)));
  const accountIds = [...new Set(owned.map((row) => row.accountId))];
  const storageKeys = owned.flatMap((row) => row.storageKey ? [row.storageKey] : []);
  await db.transaction(async (transaction) => {
    if (accountIds.length > 0) await transaction.delete(accounts).where(and(inArray(accounts.id, accountIds), eq(accounts.isDemo, true)));
    await transaction.delete(users).where(and(inArray(users.id, userIds), eq(users.isDemo, true)));
  });
  await Promise.all(storageKeys.map((key) => unlink(path.join(config.STORAGE_PATH, key)).catch(() => undefined)));
  return userIds.length;
}

export async function cleanupExpiredDemos(now = new Date()): Promise<number> {
  const expired = await db.select({ id: users.id }).from(users)
    .where(and(eq(users.isDemo, true), lte(users.demoExpiresAt, now)));
  return removeDemoUsers(expired.map((user) => user.id));
}
