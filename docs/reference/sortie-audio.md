# Moteur et sorties audio

Le réglage se trouve dans **Paramètres → Moteur et sorties audio**. Deux moteurs sont disponibles : **Navigateur · Web Audio** et **CueForge Bridge**.

## Contrôle dans la barre de régie

Le grand sélecteur **Sortie audio**, placé à côté du volume **Son suivant**, affiche la sortie principale active. Sa liste agit sur la sortie Web Audio lorsque le moteur Navigateur est actif et sur la sortie **Régie principale** lorsque CueForge Bridge est actif.

Le contrôle devient rouge et affiche un symbole d’alerte si le périphérique enregistré n’est plus présent ou si le Bridge local ne répond pas. La liste est actualisée lorsque les périphériques de la machine changent et après une modification effectuée dans les paramètres.

Une LED placée dans le contrôle indique l’état du Bridge : rouge lorsqu’il ne répond pas, orange lorsqu’il est détecté mais non associé, bleue lorsqu’il est associé sans être le moteur actif et verte lorsqu’il pilote l’audio. Elle reste grise pendant la détection ou avec un forfait qui n’inclut pas le Bridge.

Le premier petit bouton associe, ouvre, active ou désactive le Bridge selon son état. Le second relance la détection. Pour les forfaits qui incluent le Bridge, la présence du serveur local est également vérifiée toutes les cinq secondes.

## Routage par morceau

Avec CueForge Bridge 0.3.0 ou une version ultérieure, les commandes de routage par morceau apparaissent lorsque le Bridge est actif et qu’au moins deux sorties physiques sont détectées. L’entrée virtuelle **Sortie système par défaut** n’est pas comptée comme une sortie physique supplémentaire. Une réglette fine apparaît alors au-dessus du header. Elle affiche côte à côte le nom complet et la couleur de chaque sortie physique, avec la mention **Principale** sur la sortie sélectionnée.

Le grand Play reste lié à la sortie principale et aux actions souris du spectacle. Son anneau reprend la couleur de cette sortie. Un petit Play coloré est affiché uniquement pour chacune des autres sorties ; il lance une nouvelle lecture directement sur la sortie correspondante.

Chaque carte de la colonne **En lecture** affiche une LED de la couleur de sa sortie. La LED contient un sélecteur qui déplace la lecture active vers une autre sortie. La position, la pause, la boucle et le volume sont conservés. Le changement est refusé pendant un fondu sortant.

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

CueForge Bridge est inclus dans les forfaits payants. Il est accessible pendant l’essai d’un forfait payant, lorsque l’abonnement est actif et pendant un éventuel délai de grâce. Les forfaits gratuits utilisent le moteur **Navigateur · Web Audio**.

CueForge Bridge est une application de bureau distincte pour macOS et Windows x64. Le bouton **Connecter le bridge** crée un ticket valable cinq minutes, puis ouvre l’application au moyen du protocole `cueforge-bridge://`. Après validation du ticket, le navigateur et le bridge reçoivent une clé locale commune. Le jeton qui donne accès au compte CueForge reste uniquement dans le bridge. Il est conservé dans le trousseau macOS ou dans le Gestionnaire d’identification Windows.

Le bouton **Télécharger CueForge Bridge** est affiché dans les paramètres d’un compte disposant du droit Bridge. Il ouvre, après contrôle du compte, la publication 0.5.0 qui contient une image disque `aarch64` pour les Mac Apple Silicon, une image disque `x64` pour les Mac Intel et un installateur NSIS `x64` pour Windows. Les paquets macOS utilisent une signature ad hoc et ne sont pas notariés par Apple. Le fond de l’image disque illustre le glisser-déposer vers Applications et indique en français et en anglais le chemin **Réglages Système → Confidentialité et sécurité → Ouvrir quand même**. L’installateur Windows n’est pas signé et Windows peut afficher un avertissement SmartScreen à son ouverture.

### Mise à jour du bridge

CueForge Bridge 0.5.0 est la première version qui contient le moteur de mise à jour. Elle doit donc être installée avec le paquet correspondant à la machine. À partir de cette version, le Bridge consulte au démarrage le fichier `latest.json` de la dernière publication GitHub, télécharge le paquet adapté à son système et vérifie sa signature avant l’installation.

L’installation et le redémarrage automatiques ont lieu uniquement si aucune lecture audio n’est active à la fin du téléchargement. Lorsqu’une lecture est active, le paquet n’est pas installé et la vérification reprend au prochain démarrage du Bridge.

Le bridge écoute sur `127.0.0.1:43821`. Les commandes de lecture sont envoyées à cette adresse avec la clé locale. Un WebSocket transmet l’état des lectures ; l’application utilise des requêtes HTTP périodiques si le navigateur bloque ce WebSocket. L’application web demande l’autorisation d’accès au réseau local lorsque le navigateur impose cette autorisation.

### Sorties du bridge

Le champ **Régie principale** détermine la sortie des pads et des playlists. Le champ **Préécoute** détermine la seconde sortie disponible pour les commandes de préécoute natives. Les deux champs peuvent désigner le même périphérique ou deux périphériques différents.

### Cache du bridge

Le bridge conserve les fichiers audio compressés dans le dossier de cache de l’utilisateur fourni par le système d’exploitation. **Synchroniser le spectacle** télécharge tous les sons du spectacle courant. Sans synchronisation préalable, le premier lancement d’un son absent du cache attend la fin de son téléchargement.

Ce cache est distinct du stockage hors ligne du navigateur. Le passage au moteur Bridge n’efface pas les fichiers enregistrés par le navigateur et le retour au moteur Navigateur ne supprime pas le cache du bridge.

La fenêtre de CueForge Bridge affiche le nombre de fichiers présents et leur taille totale sur le disque. Le bouton **Vider le cache audio** supprime les fichiers compressés et les téléchargements temporaires du bridge.

### Association et révocation

La liste des bridges associés affiche le nom de la machine, sa plateforme et sa dernière activité. La commande de dissociation révoque le jeton de l’appareil côté serveur. La dissociation du bridge actif replace le navigateur en mode Web Audio.

Si le compte passe sur un forfait gratuit, en lecture seule ou suspendu, le serveur refuse les nouvelles associations et les requêtes du Bridge. L’application web revient au moteur Navigateur et supprime sa clé d’association locale lors du prochain contrôle du compte.
