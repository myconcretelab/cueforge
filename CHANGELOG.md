# Changelog

Toutes les évolutions notables de Standby One sont documentées ici. Le projet suit le versionnage sémantique : correctifs en `patch`, fonctionnalités compatibles en `minor` et changements incompatibles en `major`.

## [0.3.0] - 2026-08-25

### Ajouté

- centre de documentation public intégré au déploiement de S1 ;
- recherche locale, navigation thématique et design aux couleurs de Standby One ;
- guides de prise en main, préparation, import, mode hors ligne et télécommande ;
- référence des formats, raccourcis, dépannage et installation Community ;
- accès à la documentation depuis les paramètres, les notes de version et le site WordPress ;
- vérification automatique de la page de documentation associée à chaque publication.

### Modifié

- passage de l’application à la version `0.3.0` ;
- le build de production compile désormais l’application, la documentation et le serveur.

## [0.2.0] - 2026-08-25

### Ajouté

- fenêtre « Nouveautés » affichée une seule fois par utilisateur ;
- notes de version accessibles depuis les paramètres avec un badge non lu ;
- détection d’une nouvelle PWA avec installation choisie par l’utilisateur ;
- blocage de l’actualisation tant qu’une lecture audio est active ;
- numéro de version exposé par `/api/version` et `/api/health` ;
- sauvegarde PostgreSQL avant les migrations de production.

### Modifié

- passage de l’application à la version `0.2.0` ;
- activation d’un nouveau service worker uniquement après confirmation.

## [0.1.0] - 2026-08-24

- première version publique de Standby One ;
- régie sonore, projets, catégories, playlists, import et fonctionnement hors ligne.
