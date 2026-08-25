# Installer CueForge Community

CueForge Community est la version libre et auto-hébergée de CueForge. Elle convient aux personnes capables d’administrer une application Node.js et une base PostgreSQL.

## Prérequis

- Node.js 22 ou une version ultérieure ;
- PostgreSQL ;
- Git ;
- un domaine HTTPS pour la production ;
- un espace persistant pour les médias.

## Installation locale

```bash
git clone https://github.com/myconcretelab/cueforge.git
cd cueforge
npm install
cp .env.example .env
npm run db:migrate
npm run dev
```

Renseignez les variables décrites dans `.env.example` avant d’appliquer les migrations.

## Vérification avant production

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm start
```

L’URL `/api/health` doit répondre avec un statut `ok` et la version exécutée.

## Responsabilités de l’hébergeur

Avec Community, vous gérez vous-même :

- les mises à jour ;
- les sauvegardes de PostgreSQL et des médias ;
- les certificats HTTPS ;
- la surveillance du service ;
- les quotas de stockage ;
- la restauration après incident.

Pour contribuer ou signaler un problème, consultez le [dépôt GitHub](https://github.com/myconcretelab/cueforge).
