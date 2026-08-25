# Notes de version

Chaque entrée décrit les modifications fonctionnelles et techniques d’une version.

## Version 0.5.0 — 25 août 2026

- ajout du tableau de bord `/admin` ;
- ajout des forfaits, quotas, essais et états d’accès ;
- ajout des rôles de plateforme et du journal d’audit ;
- suppression de l’édition Community.

[Détails de la version 0.5.0](./0.5.0.md)

## Version 0.4.0 — 25 août 2026

- changement du nom de l’application vers CueForge ;
- changement des domaines, chemins, identifiants techniques et éléments graphiques ;
- migration des préférences locales, du cache audio et des cookies de session ;
- maintien temporaire de l’ancienne origine pour les PWA et télécommandes existantes.

[Détails de la version 0.4.0](./0.4.0.md)

## Version 0.3.0 — 25 août 2026

- ajout de la documentation publique ;
- ajout de la recherche et de la navigation par rubrique ;
- intégration de la documentation au build et au déploiement.

[Détails de la version 0.3.0](./0.3.0.md)

## Version 0.2.0 — 25 août 2026

- ajout des notes de version dans l’application ;
- détection et installation différée des mises à jour PWA ;
- exposition de la version par l’API.

[Détails de la version 0.2.0](./0.2.0.md)

## Cycle de mise à jour

1. La nouvelle version du service worker est téléchargée en arrière-plan.
2. L’application affiche une notification de mise à jour.
3. Le bouton reste désactivé pendant une lecture audio.
4. L’activation remplace le service worker courant et recharge l’interface.
5. Les nouveautés non consultées sont affichées après la connexion.
