export interface AppRelease {
  audience: 'app' | 'admin';
  version: string;
  date: string;
  title: string;
  summary: string;
  important: boolean;
  changes: string[];
}

const RELEASES: AppRelease[] = [
  {
    audience: 'app',
    version: '0.11.0',
    date: '2026-08-26',
    title: 'Mises à jour automatiques',
    summary: 'Un réglage permet d’installer les nouvelles versions sans afficher de demande de confirmation.',
    important: false,
    changes: [
      'Le mode automatique se règle depuis les paramètres de l’application.',
      'Une version en attente est installée dès qu’aucun son n’est en lecture.',
      'Les notifications et l’ouverture automatique des notes sont masquées en mode automatique.',
      'La bannière de mise à jour reste disponible lorsque le mode automatique est désactivé.',
      'Les nouveautés affichées concernent uniquement les fonctions de la régie.',
    ],
  },
  {
    audience: 'admin',
    version: '0.11.0',
    date: '2026-08-26',
    title: 'Documentation administrative séparée',
    summary: 'La documentation et les versions commerciales sont maintenant regroupées dans le dashboard protégé.',
    important: false,
    changes: [
      'Une rubrique Documentation est disponible dans le dashboard d’administration.',
      'Les notes de version commerciales sont retirées de la documentation publique.',
      'Les évolutions de l’application et de l’administration utilisent deux flux distincts.',
    ],
  },
  {
    audience: 'app',
    version: '0.10.1',
    date: '2026-08-25',
    title: 'Démonstration sans interruption',
    summary: 'Les messages liés aux mises à jour sont désormais réservés aux espaces personnels.',
    important: false,
    changes: [
      'La bannière de mise à jour n’apparaît plus dans une démonstration.',
      'La fenêtre automatique et la rubrique Nouveautés sont masquées dans une démonstration.',
      'Les comptes personnels continuent de recevoir les informations de version.',
    ],
  },
  {
    audience: 'app',
    version: '0.10.0',
    date: '2026-08-25',
    title: 'Essai immédiat sans compte',
    summary: 'Une démonstration temporaire permet maintenant d’utiliser CueForge immédiatement, sans inscription.',
    important: false,
    changes: [
      'Chaque visiteur dispose d’un espace de démonstration isolé et de trois sons préchargés.',
      'La démonstration accepte 15 fichiers importés de 5 Mo maximum chacun.',
      'Les données temporaires sont supprimées après 24 heures d’inactivité.',
      'La démonstration peut être réinitialisée ou remplacée par un espace personnel depuis l’application.',
    ],
  },
  {
    audience: 'admin',
    version: '0.9.0',
    date: '2026-08-25',
    title: 'Forfaits synchronisés avec le site',
    summary: 'Les forfaits publics du dashboard alimentent désormais automatiquement le bloc tarifaire WordPress.',
    important: false,
    changes: [
      'Chaque forfait dispose de réglages de visibilité, de mise en avant et d’ordre d’affichage.',
      'Une API publique limitée expose les forfaits actifs destinés au site de présentation.',
      'Le forfait par défaut actuel est publié automatiquement lors de la mise à jour.',
      'Le bloc WordPress conserve la dernière réponse valide lorsque l’API est indisponible.',
    ],
  },
  {
    audience: 'admin',
    version: '0.8.0',
    date: '2026-08-25',
    title: 'Gestion complète des forfaits',
    summary: 'Le tableau de bord super-administrateur centralise les prix, quotas et règles de chaque forfait.',
    important: false,
    changes: [
      'La vue Forfaits affiche les prix mensuels et annuels, le quota, l’essai et le nombre de comptes attribués.',
      'Un forfait peut être créé, modifié ou dupliqué depuis le catalogue commercial.',
      'Un forfait inutilisé peut être supprimé s’il n’est pas défini par défaut.',
      'La fiche d’un compte résume le prix et les limites du forfait sélectionné.',
    ],
  },
  {
    audience: 'app',
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
    audience: 'app',
    version: '0.6.0',
    date: '2026-08-25',
    title: 'CueForge sur son propre domaine',
    summary: 'Le site et l’application utilisent désormais le domaine cueforge.fr.',
    important: true,
    changes: [
      'Le site de présentation est disponible sur cueforge.fr.',
      'L’application est disponible sur app.cueforge.fr.',
      'La documentation reste intégrée à l’application sous /docs/.',
      'Les liens Community et GitHub ont été retirés du site de présentation.',
    ],
  },
  {
    audience: 'admin',
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
    audience: 'app',
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
    audience: 'app',
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
    audience: 'app',
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

export const APP_RELEASES = RELEASES.filter((release) => release.audience === 'app');
export const ADMIN_RELEASES = RELEASES.filter((release) => release.audience === 'admin');

export const CURRENT_RELEASE = APP_RELEASES[0]!;
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
