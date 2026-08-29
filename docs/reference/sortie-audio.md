# Moteur et sorties audio

Le réglage se trouve dans **Paramètres → Moteur et sorties audio**. Deux moteurs sont disponibles : **Navigateur · Web Audio** et **CueForge Bridge**.

## Moteur navigateur

## Sélection

La liste contient la sortie système par défaut et les périphériques de lecture exposés par le navigateur.

Le bouton **Actualiser** relit la liste des périphériques. La liste est également actualisée lorsqu’un périphérique est connecté ou déconnecté. Lorsque le navigateur fournit son propre sélecteur, le bouton **Choisir** l’ouvre.

## Portée

La sortie sélectionnée s’applique aux pads, aux playlists et aux préécoutes de l’éditeur et de Freesound. Le réglage est local au navigateur et à l’appareil sur lequel il est défini. La vue Télécommande ne déplace pas la lecture audio vers l’appareil contrôleur.

## Persistance et repli

CueForge enregistre l’identifiant et le nom de la sortie dans le stockage local du navigateur. Cette préférence est réappliquée lors de la création du moteur audio.

Si le périphérique enregistré n’existe plus, si son accès n’est plus autorisé ou si son identifiant a changé, CueForge efface cette préférence et utilise la sortie système.

## Compatibilité du navigateur

La sélection nécessite la méthode `AudioContext.setSinkId()` du navigateur. Lorsque cette méthode n’est pas exposée, la rubrique indique que la sortie système reste active. La liste et les noms visibles dépendent des périphériques et des autorisations fournis par le navigateur.

## CueForge Bridge

CueForge Bridge est une application macOS distincte. Le bouton **Connecter le bridge** crée un ticket valable cinq minutes, puis ouvre l’application au moyen du protocole `cueforge-bridge://`. Après validation du ticket, le navigateur et le bridge reçoivent une clé locale commune. Le jeton qui donne accès au compte CueForge reste uniquement dans le bridge.

Le bridge écoute sur `127.0.0.1:43821`. Les commandes de lecture sont envoyées à cette adresse avec la clé locale. Un WebSocket transmet l’état des lectures ; l’application utilise des requêtes HTTP périodiques si le navigateur bloque ce WebSocket. L’application web demande l’autorisation d’accès au réseau local lorsque le navigateur impose cette autorisation.

### Sorties du bridge

Le champ **Régie principale** détermine la sortie des pads et des playlists. Le champ **Préécoute** détermine la seconde sortie disponible pour les commandes de préécoute natives. Les deux champs peuvent désigner le même périphérique ou deux périphériques différents.

### Cache du bridge

Le bridge conserve les fichiers audio compressés dans son dossier de cache macOS. **Synchroniser le spectacle** télécharge tous les sons du spectacle courant. Sans synchronisation préalable, le premier lancement d’un son absent du cache attend la fin de son téléchargement.

Ce cache est distinct du stockage hors ligne du navigateur. Le passage au moteur Bridge n’efface pas les fichiers enregistrés par le navigateur et le retour au moteur Navigateur ne supprime pas le cache du bridge.

La fenêtre de CueForge Bridge affiche le nombre de fichiers présents. Le bouton **Vider le cache audio** supprime les fichiers compressés et les téléchargements temporaires du bridge.

### Association et révocation

La liste des bridges associés affiche le nom de la machine, sa plateforme et sa dernière activité. La commande de dissociation révoque le jeton de l’appareil côté serveur. La dissociation du bridge actif replace le navigateur en mode Web Audio.
