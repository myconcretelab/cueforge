export interface AppRelease {
  version: string;
  date: string;
  title: string;
  summary: string;
  important: boolean;
  changes: string[];
}

export const APP_RELEASES: AppRelease[] = [
  {
    version: '0.2.0',
    date: '2026-08-25',
    title: 'Des mises à jour plus sereines',
    summary: 'S1 présente désormais clairement ses nouveautés et laisse la régie choisir quand actualiser l’application.',
    important: true,
    changes: [
      'Une fenêtre Nouveautés présente les évolutions importantes.',
      'Un badge permet de retrouver les notes de version depuis les paramètres.',
      'Les mises à jour de la PWA attendent que la régie soit disponible avant de se recharger.',
      'La version déployée est visible dans l’application et dans le contrôle de santé.',
    ],
  },
];

export const CURRENT_RELEASE = APP_RELEASES[0];
export const CURRENT_VERSION = CURRENT_RELEASE.version;

export function compareVersions(left: string, right: string): number {
  const leftParts = parseVersion(left);
  const rightParts = parseVersion(right);
  for (let index = 0; index < 3; index += 1) {
    const difference = leftParts[index] - rightParts[index];
    if (difference !== 0) return Math.sign(difference);
  }
  return 0;
}

export function releasesAfter(version: string | null): AppRelease[] {
  if (!version) return APP_RELEASES;
  return APP_RELEASES.filter((release) => compareVersions(release.version, version) > 0);
}

export function releaseExists(version: string): boolean {
  return APP_RELEASES.some((release) => release.version === version);
}

function parseVersion(version: string): [number, number, number] {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) return [0, 0, 0];
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}
