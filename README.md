# Standby One · S1

Standby One est une régie son web inspirée de SoundShow. Les médias sont stockés en ligne, préparés hors connexion dans une PWA, puis joués localement avec Web Audio pour éviter la latence du réseau pendant un spectacle.

Le produit est présenté principalement sous son monogramme **S1**, également utilisé pour ses identifiants techniques et son déploiement.

## Fonctionnalités actuelles

- comptes multiples avec espace de travail isolé, sessions sécurisées et mots de passe dérivés avec `scrypt` ;
- plusieurs spectacles et catégories colorées, réordonnables et supprimables, avec recherche globale ;
- import MP3, WAV, OGG, FLAC et AAC jusqu’à 250 Mo ;
- recherche Freesound avec filtres de durée minimale et maximale, préécoute, renommage et import dans la catégorie choisie ;
- import complet d’un projet SoundShow `.ssp` avec catégories, couleurs, boucles et points d’entrée/sortie ;
- lecture polyphonique, navigation dans le morceau, boucles, volume limité à 100 % et fondus animés, avec commandes indépendantes et arrêt en fondu pour chaque instance en lecture ;
- playlists persistantes réorganisables, avec ordre séquentiel ou aléatoire, boucle, démarrage automatique, silence réglable ou mix par fondu enchaîné entre les titres ;
- progression de lecture, catégorie active, chronomètre et réglages d'affichage restaurés après actualisation ;
- mise à disposition hors ligne des sons par catégorie, conservée après actualisation ;
- import rapide de plusieurs fichiers par glisser-déposer sur toute la fenêtre vers la catégorie active ;
- console d'en-tête avec volume du prochain son réinitialisable ou verrouillable, chronomètre et horloge ;
- actions configurables par spectacle pour les clics gauche et droit : démarrer, fondu enchaîné, fondu d’entrée, remplacer, arrêter ou aucune action ;
- éditeur graphique de forme d’onde avec poignées début/fin, zoom jusqu’à 64× et préécoute de la sélection ;
- raccourcis `1` à `9` et arrêt général avec `Échap` ;
- télécommande temps réel via WebSocket ;
- téléchargement d’un projet dans le cache hors ligne ;
- interface responsive installable comme PWA.
- notes de version par utilisateur et installation différée des mises à jour PWA afin de ne jamais interrompre une lecture.
- centre de documentation public avec recherche, guides pratiques, référence, dépannage et notes de version.

## Développement local

Prérequis : Node.js 22 ou 24 et Docker, ou une instance PostgreSQL locale.

```bash
cp .env.example .env
docker compose up -d postgres
npm install
npm run db:migrate
npm run dev
```

L’interface est disponible sur `http://localhost:5173` et l’API sur `http://127.0.0.1:8100`.

La documentation se développe séparément sur `http://localhost:5174` :

```bash
npm run dev:docs
```

## Vérification

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

## Déploiement Alwaysdata

Pour mettre à jour la production depuis le Mac d’administration après avoir poussé `main` :

```bash
./scripts/deploy-alwaysdata.sh
```

Le script refuse un dépôt sale ou non poussé, récupère les variables du site via l’API Alwaysdata, compile l’application, applique les migrations, redémarre le site et contrôle son endpoint de santé. Le jeton d’API n’est jamais stocké dans Git : il est lu dans le trousseau Apple (`s1-alwaysdata-api` / `myconcretelab`).

## Publier une version

Chaque version doit être déclarée simultanément dans `package.json`, `CHANGELOG.md`, `src/server/releases.ts` et `docs/nouveautes/<version>.md`. Avant de committer une publication :

```bash
npm run release:check
npm run typecheck
npm run lint
npm test
npm run build
```

Après le déploiement, les utilisateurs déjà inscrits voient les nouveautés une seule fois. Les nouveaux comptes commencent directement sur la version courante. Une PWA déjà ouverte signale qu’une mise à jour est prête mais refuse son installation tant qu’un son est en lecture.

Pour une installation initiale manuelle :

1. Créer une base PostgreSQL et un utilisateur dans **Bases de données > PostgreSQL**.
2. Choisir Node.js 24 dans **Environnement > Node.js**.
3. Déployer le dépôt dans `/home/<compte>/s1`.
4. Configurer les variables d’environnement suivantes dans le site Node.js :

```dotenv
NODE_ENV=production
DATABASE_URL=postgresql://<utilisateur>:<mot-de-passe>@postgresql-<compte>.alwaysdata.net:5433/<base>
SESSION_SECRET=<une-valeur-aleatoire-d-au-moins-32-caracteres>
STORAGE_PATH=/home/<compte>/s1/storage
PUBLIC_URL=https://<votre-domaine>
FREESOUND_API_KEY=<clé-api-freesound>
SAAS_MODE=false
TRIAL_DAYS=14
TRIAL_STORAGE_BYTES=2147483648
```

`SAAS_MODE=false` conserve le fonctionnement communautaire sans quota. Avec `SAAS_MODE=true`, chaque nouvelle inscription reçoit un essai dont la durée et le stockage sont définis par `TRIAL_DAYS` et `TRIAL_STORAGE_BYTES`. Les comptes communautaires existants restent actifs et sans quota lors de la migration.

5. Depuis SSH, préparer l’application :

```bash
cd /home/<compte>/s1
npm ci --include=optional
npm run build
npm run db:migrate
npm prune --omit=dev
```

6. Créer un site de type **Node.js** avec cette commande :

```bash
node /home/<compte>/s1/dist/server/index.js
```

Le serveur utilise automatiquement les variables `IP` et `PORT` fournies par Alwaysdata. Dans les réglages avancés du site, mettre le temps d’inactivité à `0` afin de conserver les connexions WebSocket. Activer HTTPS et vérifier que `PUBLIC_URL` contient exactement l’origine publique.

Les fichiers audio résident dans `STORAGE_PATH`, jamais dans PostgreSQL. Ils sont servis uniquement après contrôle de la session et avec prise en charge des requêtes HTTP `Range`.

La recherche Freesound utilise `FREESOUND_API_KEY` exclusivement côté serveur. Les préécoutes peuvent être écoutées sans stockage ou importées dans le spectacle sous un nouveau nom et dans la catégorie choisie. Standby One télécharge alors la préécoute haute qualité dans `STORAGE_PATH` et conserve l’auteur, la licence et l’URL source. Seuls les résultats CC0 et CC BY sont proposés.

## Structure

```text
src/client/       interface React, PWA et moteur audio
src/server/       API Fastify et serveur WebSocket
src/server/db/    schéma et migrations Drizzle
migrations/       migrations PostgreSQL versionnées
storage/          médias locaux, ignorés par Git
public/           manifeste, icône et service worker
docs/             documentation VitePress publiée sous /docs/
```

## Importer un projet SoundShow

Dans la régie, utiliser **Importer SoundShow**, puis sélectionner le dossier qui contient le fichier `.ssp`. Après l’analyse, les fichiers trouvés sont envoyés individuellement afin d’afficher la progression et de pouvoir importer de gros projets. Si le projet référence des médias situés ailleurs, utiliser **Ajouter un dossier de médias externe** avant de lancer l’import. Les médias Freesound manquants peuvent être récupérés directement depuis leur URL d’origine.

## Limites connues de cette première version

- un téléphone contrôleur doit se connecter avec le même compte ;
- les playlists et séquences SoundShow sont détectées mais ne sont pas encore recréées ;
- le routage vers plusieurs périphériques audio dépend fortement du navigateur ;
