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
    version: '0.7.0',
    date: '2026-08-25',
    title: 'Réinitialisation du mot de passe',
    summary: 'La page de connexion permet désormais de définir un nouveau mot de passe par e-mail.',
    important: false,
    changes: [
      'Le lien « Mot de passe oublié ? » est disponible sur la page de connexion.',
      'Le lien reçu par e-mail expire après 30 minutes et ne fonctionne qu’une fois.',
      'La modification du mot de passe ferme toutes les sessions précédentes.',
    ],
  },
  {
    version: '0.6.0',
    date: '2026-08-25',
    title: 'CueForge sur son propre domaine',
    summary: 'Le site et l’application utilisent désormais le domaine cueforge.fr.',
    important: true,
    changes: [
      'Le site de présentation est disponible sur cueforge.fr.',
      'L’application et son administration sont disponibles sur app.cueforge.fr.',
      'La documentation reste intégrée à l’application sous /docs/.',
      'Les liens Community et GitHub ont été retirés du site de présentation.',
    ],
  },
  {
    version: '0.5.0',
    date: '2026-08-25',
    title: 'Administration commerciale',
    summary: 'CueForge intègre désormais la gestion de ses comptes, forfaits, essais, quotas et rôles administratifs.',
    important: true,
    changes: [
      'Le tableau de bord commercial est disponible sous /admin.',
      'Les forfaits définissent le stockage, la durée d’essai et les prix mensuel et annuel.',
      'Les comptes disposent d’états d’accès distincts de leur abonnement.',
      'Les modifications administratives sont consignées dans un journal d’audit.',
    ],
  },
  {
    version: '0.4.0',
    date: '2026-08-25',
    title: 'CueForge entre en scène',
    summary: 'CueForge devient la nouvelle identité de la régie, avec une signature claire : Play sound. Play the scene.',
    important: true,
    changes: [
      'Toute l’application adopte le nom CueForge et le monogramme CF.',
      'L’application et sa documentation disposent de nouvelles adresses CueForge.',
      'Les préférences, sessions et sons hors ligne existants sont repris automatiquement sur l’ancienne adresse.',
      'L’ancienne adresse reste disponible pendant la transition.',
    ],
  },
  {
    version: '0.3.0',
    date: '2026-08-25',
    title: 'La documentation entre en scène',
    summary: 'CueForge dispose désormais d’un centre d’aide public, consultable depuis l’application et le site de présentation.',
    important: true,
    changes: [
      'Une documentation moderne accompagne la prise en main et la préparation des spectacles.',
      'Les guides couvrent l’import, l’organisation, le mode hors ligne et la télécommande.',
      'Une section de dépannage et une référence des formats sont disponibles sans connexion au compte.',
      'Chaque note de version peut renvoyer vers une présentation détaillée.',
    ],
  },
  {
    version: '0.2.0',
    date: '2026-08-25',
    title: 'Des mises à jour plus sereines',
    summary: 'CueForge présente désormais clairement ses nouveautés et laisse la régie choisir quand actualiser l’application.',
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
