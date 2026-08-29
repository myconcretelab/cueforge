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
    version: '0.20.0',
    date: '2026-08-29',
    title: 'Connexion rapide au Bridge',
    summary: 'La barre de régie détecte CueForge Bridge et permet de l’associer ou de l’activer sans ouvrir les paramètres.',
    important: false,
    changes: [
      'Une LED indique si le Bridge est fermé, détecté, prêt ou actif.',
      'Un bouton adapte son action pour associer, ouvrir, activer ou désactiver le Bridge.',
      'Un second bouton relance immédiatement la détection locale.',
      'La détection est actualisée automatiquement toutes les cinq secondes pour les forfaits disposant du Bridge.',
    ],
  },
  {
    audience: 'app',
    version: '0.19.1',
    date: '2026-08-29',
    title: 'Correction de l’association du Bridge',
    summary: 'Le navigateur récupère maintenant correctement sa clé locale lorsque CueForge Bridge accepte une association.',
    important: true,
    changes: [
      'La clé locale est renvoyée au navigateur avant d’être effacée du ticket à usage unique.',
      'La consommation du ticket et l’effacement de la clé sont exécutés dans une transaction atomique.',
      'Une seconde récupération du même ticket reste refusée.',
    ],
  },
  {
    audience: 'app',
    version: '0.19.0',
    date: '2026-08-29',
    title: 'La sortie audio dans la barre de régie',
    summary: 'Un grand sélecteur placé à côté du volume du son suivant permet de voir et de changer immédiatement la sortie principale.',
    important: false,
    changes: [
      'Le périphérique actif est visible en permanence dans la barre supérieure de la régie principale.',
      'Le sélecteur pilote directement Web Audio ou la sortie principale de CueForge Bridge selon le moteur actif.',
      'Un état rouge et un symbole d’alerte signalent une sortie déconnectée ou un Bridge indisponible.',
      'La liste se met à jour lorsque les périphériques audio ou les réglages de sortie changent.',
    ],
  },
  {
    audience: 'app',
    version: '0.18.0',
    date: '2026-08-29',
    title: 'CueForge Bridge dans les forfaits payants',
    summary: 'L’association, l’utilisation et le téléchargement depuis CueForge sont maintenant réservés aux comptes disposant d’un forfait payant actif.',
    important: true,
    changes: [
      'Les forfaits gratuits conservent le moteur Navigateur complet mais n’affichent plus les commandes du Bridge.',
      'Les comptes en essai sur un forfait payant disposent du Bridge pendant leur période d’essai.',
      'L’API contrôle le forfait avant une association, une synchronisation ou un téléchargement audio par le Bridge.',
      'Une association locale est oubliée lorsque le compte ne dispose plus du droit Bridge.',
      'Le site CueForge indique dans chaque offre si CueForge Bridge est inclus.',
    ],
  },
  {
    audience: 'app',
    version: '0.17.0',
    date: '2026-08-29',
    title: 'CueForge Bridge pour Windows',
    summary: 'Le moteur audio natif facultatif est maintenant distribué pour Windows x64 en plus des deux architectures macOS.',
    important: true,
    changes: [
      'Un installateur Windows x64 est disponible dans la publication GitHub de CueForge Bridge.',
      'L’association avec le navigateur utilise le même lien natif et le même serveur local que sur macOS.',
      'Les clés du bridge sont conservées dans le Gestionnaire d’identification Windows.',
      'Le cache audio, la sortie principale et la préécoute fonctionnent indépendamment du cache du navigateur.',
      'L’application web reste entièrement utilisable sans installer ni sélectionner le bridge.',
    ],
  },
  {
    audience: 'app',
    version: '0.16.1',
    date: '2026-08-29',
    title: 'Téléchargement du bridge pour Mac Intel et Apple Silicon',
    summary: 'CueForge Bridge est distribué depuis GitHub dans deux paquets adaptés aux architectures macOS.',
    important: true,
    changes: [
      'Le lien de téléchargement se trouve dans la rubrique Moteur et sorties audio des paramètres.',
      'Un paquet aarch64 est proposé pour les Mac Apple Silicon.',
      'Un paquet x64 est proposé pour les Mac Intel.',
      'Les paquets utilisent une signature ad hoc et ne sont pas notariés par Apple.',
    ],
  },
  {
    audience: 'app',
    version: '0.16.0',
    date: '2026-08-29',
    title: 'CueForge Bridge pour macOS',
    summary: 'Un moteur audio natif facultatif ajoute un cache local et des sorties indépendantes sans retirer le mode Web Audio.',
    important: true,
    changes: [
      'Le moteur Navigateur reste actif par défaut et conserve toutes les fonctions existantes.',
      'Le bouton Connecter le bridge ouvre l’application macOS au moyen d’un lien natif à usage unique.',
      'Le bridge conserve les fichiers audio compressés dans son propre cache et les lit sans passer par le cache du navigateur.',
      'La régie principale et la préécoute disposent de sélections de sortie distinctes dans le bridge.',
      'Les lectures, fondus, pauses, volumes, boucles, déplacements et arrêts sont pilotés depuis l’interface web.',
      'Les bridges associés peuvent être consultés et révoqués depuis les paramètres CueForge.',
    ],
  },
  {
    audience: 'app',
    version: '0.15.0',
    date: '2026-08-28',
    title: 'Sélection de la sortie audio',
    summary: 'La régie peut maintenant utiliser un périphérique de sortie distinct de la sortie système.',
    important: true,
    changes: [
      'La rubrique Sortie audio des paramètres affiche les périphériques de lecture disponibles.',
      'Le périphérique choisi reçoit les sons de la régie et les préécoutes de l’éditeur et de Freesound.',
      'La sélection est enregistrée localement sur l’appareil utilisé.',
      'La sortie système est rétablie si le périphérique enregistré n’est plus disponible.',
      'Les navigateurs sans sélection de sortie Web Audio continuent d’utiliser la sortie système.',
    ],
  },
  {
    audience: 'app',
    version: '0.14.0',
    date: '2026-08-28',
    title: 'Forfait gratuit sans carte bancaire',
    summary: 'Un forfait à 0 € peut maintenant être activé sans créer de client ni d’abonnement Stripe.',
    important: true,
    changes: [
      'L’inscription sur un forfait gratuit ouvre immédiatement l’espace sans redirection vers Stripe.',
      'Le quota de stockage configuré sur le forfait gratuit s’applique dès la création du compte.',
      'Le passage ultérieur vers un forfait payant reste disponible depuis la rubrique Offre et stockage.',
      'Les forfaits payants conservent leur parcours Checkout avec essai et moyen de paiement.',
    ],
  },
  {
    audience: 'admin',
    version: '0.14.0',
    date: '2026-08-28',
    title: 'Gestion des offres gratuites',
    summary: 'Les tarifs à 0 € identifient désormais les forfaits activés sans Stripe.',
    important: false,
    changes: [
      'Un forfait est gratuit lorsqu’au moins un prix est renseigné et que tous ses prix renseignés valent 0 €.',
      'Un prix vide continue de rendre la périodicité correspondante indisponible.',
      'Les activations gratuites sont inscrites dans le journal d’audit du compte.',
      'Les forfaits comportant un prix positif restent exclusivement associés au parcours Stripe Checkout.',
    ],
  },
  {
    audience: 'app',
    version: '0.13.0',
    date: '2026-08-27',
    title: 'Inscription avec moyen de paiement',
    summary: 'La création du compte enregistre le forfait et le moyen de paiement sur Stripe avant le début de l’essai.',
    important: true,
    changes: [
      'Le forfait et la périodicité se choisissent directement dans le formulaire d’inscription.',
      'La validation du compte ouvre immédiatement la page Checkout hébergée par Stripe.',
      'L’essai commence après la validation de Checkout et ne déclenche aucun paiement immédiat.',
      'La première échéance Stripe intervient à la fin de la durée d’essai configurée pour le forfait.',
    ],
  },
  {
    audience: 'app',
    version: '0.12.0',
    date: '2026-08-26',
    title: 'Abonnement Stripe',
    summary: 'Les propriétaires d’un espace peuvent souscrire et gérer leur abonnement depuis les paramètres.',
    important: false,
    changes: [
      'Le forfait et la périodicité mensuelle ou annuelle se sélectionnent dans la rubrique Offre et stockage.',
      'Le paiement et la saisie du moyen de paiement utilisent la page Checkout hébergée par Stripe.',
      'Le portail de facturation donne accès aux factures, au moyen de paiement et à la résiliation.',
      'Le forfait, le quota et l’accès sont actualisés après confirmation du changement par Stripe.',
    ],
  },
  {
    audience: 'admin',
    version: '0.12.0',
    date: '2026-08-26',
    title: 'Intégration Stripe Billing',
    summary: 'Le catalogue, les abonnements et les droits CueForge sont reliés à Stripe Billing.',
    important: true,
    changes: [
      'Chaque forfait peut créer un produit et ses tarifs mensuel et annuel dans l’environnement Stripe configuré.',
      'Les montants modifiés créent de nouveaux tarifs sans altérer les abonnements historiques.',
      'Les webhooks signés synchronisent les abonnements, périodes, quotas et états d’accès de manière idempotente.',
      'Les suspensions administratives restent prioritaires sur les événements de facturation.',
      'Un rapprochement périodique et une commande manuelle corrigent les écarts avec Stripe.',
    ],
  },
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
