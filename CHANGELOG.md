# Changelog

Toutes les évolutions notables de CueForge sont documentées ici. Le projet suit le versionnage sémantique : correctifs en `patch`, fonctionnalités compatibles en `minor` et changements incompatibles en `major`.

## [0.10.1] - 2026-08-25

### Modifié

- masquage de la bannière de mise à jour dans les espaces de démonstration ;
- masquage de la fenêtre automatique et de la rubrique **Nouveautés** dans les espaces de démonstration ;
- maintien des messages de version pour les comptes personnels ;
- passage de l’application à la version `0.10.1`.

## [0.10.0] - 2026-08-25

### Ajouté

- démonstration immédiate sous `/demo`, sans création de compte ;
- espace et session temporaires isolés pour chaque visiteur ;
- trois sons WAV préchargés dans le spectacle de démonstration ;
- réinitialisation de l’espace depuis le bandeau de démonstration ;
- suppression automatique des espaces après 24 heures d’inactivité.

### Limites

- 15 fichiers importés au maximum, hors sons préchargés ;
- 5 Mo maximum par fichier local ou importé depuis Freesound.

### Modifié

- exclusion des espaces temporaires des statistiques commerciales ;
- destination des boutons d’essai public vers `/demo` ;
- passage de l’application à la version `0.10.0`.

## [0.9.0] - 2026-08-25

### Ajouté

- réglages de visibilité publique, mise en avant et ordre d’affichage pour chaque forfait ;
- API publique en lecture seule sous `/api/public/plans` ;
- cache HTTP de la réponse publique ;
- bloc WordPress dynamique **Forfaits CueForge** ;
- cache WordPress de cinq minutes avec repli sur la dernière réponse valide.

### Modifié

- publication initiale du forfait par défaut existant ;
- remplacement de la carte tarifaire statique de la page d’accueil WordPress ;
- passage de l’application à la version `0.9.0`.

## [0.8.0] - 2026-08-25

### Ajouté

- synthèse des forfaits configurés, actifs, attribués et par défaut dans le tableau de bord ;
- nombre de comptes associés à chaque forfait ;
- duplication d’un forfait avec reprise de ses réglages commerciaux ;
- suppression des forfaits inutilisés et non définis par défaut ;
- résumé du prix, du quota et de la durée d’essai lors de l’attribution d’un forfait à un compte ;
- journalisation de la suppression d’un forfait.

### Modifié

- nouvelle présentation du catalogue des forfaits et de leurs états ;
- validation renforcée du forfait par défaut ;
- passage de l’application à la version `0.8.0`.

## [0.7.0] - 2026-08-25

### Ajouté

- demande de réinitialisation du mot de passe depuis la page de connexion ;
- envoi d’un lien temporaire et à usage unique par e-mail ;
- formulaire public de définition du nouveau mot de passe sous `/reset-password` ;
- invalidation des anciennes sessions après la modification du mot de passe ;
- limitation du nombre de demandes et réponse uniforme pour empêcher l’identification des comptes.

### Modifié

- passage de l’application à la version `0.7.0`.

## [0.6.0] - 2026-08-25

### Modifié

- mise en ligne du site WordPress sur `cueforge.fr` ;
- déplacement de l’application, de l’API, de l’administration et de la documentation sur `app.cueforge.fr` ;
- redirection de `www.cueforge.fr` vers le domaine principal ;
- suppression des références publiques à l’ancienne édition Community ;
- passage de l’application à la version `0.6.0`.

## [0.5.0] - 2026-08-25

### Ajouté

- tableau de bord commercial intégré sous `/admin` ;
- gestion des comptes, utilisateurs, rôles de plateforme, forfaits, quotas et essais ;
- modèle d’abonnement indépendant du prestataire de paiement ;
- journal d’audit des modifications administratives ;
- contrôle centralisé des écritures selon l’état d’accès du compte ;
- configuration `SUPER_ADMIN_EMAILS` pour la création des premiers super-administrateurs.

### Modifié

- suppression du mode Community et des paramètres `SAAS_MODE`, `TRIAL_DAYS` et `TRIAL_STORAGE_BYTES` ;
- attribution systématique du forfait commercial par défaut aux nouveaux comptes ;
- passage de l’application à la version `0.5.0`.

## [0.4.0] - 2026-08-25

### Modifié

- nouvelle identité globale **CueForge**, accompagnée de la signature « Play sound. Play the scene. » ;
- renommage de l’application, de la PWA, de la documentation, du dépôt, des domaines et des chemins de déploiement ;
- nouveau monogramme `CF` dans l’interface et les icônes.

### Migration

- reprise automatique des préférences navigateur enregistrées sous les anciennes clés `s1-*` ;
- transfert du cache audio hors ligne existant vers le cache CueForge ;
- prise en charge transitoire de l’ancien cookie de session afin de conserver les connexions valides.
- compatibilité CORS transitoire pour les PWA et télécommandes ouvertes depuis l’ancienne adresse.

## [0.3.0] - 2026-08-25

### Ajouté

- centre de documentation public intégré au déploiement de CueForge ;
- recherche locale, navigation thématique et design aux couleurs de CueForge ;
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

- première version publique de CueForge ;
- régie sonore, projets, catégories, playlists, import et fonctionnement hors ligne.
