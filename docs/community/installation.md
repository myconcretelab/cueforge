# Installation de CueForge Community

CueForge Community est l’édition auto-hébergée de l’application.

## Composants

- Node.js 22 ou version ultérieure ;
- PostgreSQL ;
- Git ;
- stockage persistant pour les médias ;
- terminaison HTTPS pour un accès public.

## Installation

```bash
git clone https://github.com/myconcretelab/cueforge.git
cd cueforge
npm install
cp .env.example .env
npm run db:migrate
npm run dev
```

Le fichier `.env` contient la connexion PostgreSQL, le secret de session, le chemin de stockage, l’origine publique et les paramètres facultatifs du service.

## Construction et exécution

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm start
```

Le build produit :

- le client dans `dist/client` ;
- la documentation dans `dist/client/docs` ;
- le serveur dans `dist/server`.

Le point d’accès `/api/health` retourne l’état du service et la version exécutée.

## Données persistantes

PostgreSQL contient les comptes, spectacles, catégories, pistes, playlists, sessions et métadonnées. Les fichiers audio sont stockés dans `STORAGE_PATH`.

Une restauration complète nécessite donc la base PostgreSQL et le contenu de `STORAGE_PATH`.

## Opérations non intégrées

L’édition Community ne fournit pas de service externe pour :

- les sauvegardes ;
- les certificats HTTPS ;
- la supervision du processus ;
- l’installation des nouvelles versions ;
- la restauration des données.

Le code source et le suivi des incidents sont disponibles dans le [dépôt GitHub](https://github.com/myconcretelab/cueforge).
