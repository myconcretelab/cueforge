# CueForge Bridge

CueForge Bridge est le moteur audio natif facultatif de CueForge. L’application web reste autonome et utilise Web Audio lorsque le bridge n’est pas sélectionné.

## Composants

- application de bureau Tauri 2 pour macOS ;
- moteur audio CPAL/Rodio avec une sortie ouverte par périphérique utilisé ;
- serveur HTTP local sur `127.0.0.1:43821` ;
- canal WebSocket local pour l’état des lectures ;
- cache de fichiers compressés dans le dossier de cache de l’utilisateur ;
- jeton d’appareil et clé locale dans le trousseau macOS ;
- association par URL `cueforge-bridge://pair` et ticket CueForge temporaire.

## Compilation

Rust et les outils de développement macOS sont requis.

```sh
npm install
npm run bridge:check
npm run bridge:build
```

L’application et l’image disque sont produites sous `bridge/src-tauri/target/release/bundle/`.

## Exécution en développement

```sh
cd bridge/src-tauri
npx tauri dev
```

Le lien d’association accepte `https://app.cueforge.fr`. En développement, les origines `http://localhost` et `http://127.0.0.1` sont également acceptées lorsqu’elles sont transmises par le paramètre `server`.

## API locale

`GET /v1/status` expose uniquement l’état général du processus. Les routes de lecture, de cache et de synchronisation exigent `Authorization: Bearer <clé-locale>`. Les origines CORS admises sont l’application CueForge en production, Vite en développement et la fenêtre Tauri.
