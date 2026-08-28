# Sortie audio

## Sélection

Le réglage se trouve dans **Paramètres → Sortie audio**. La liste contient la sortie système par défaut et les périphériques de lecture exposés par le navigateur.

Le bouton **Actualiser** relit la liste des périphériques. La liste est également actualisée lorsqu’un périphérique est connecté ou déconnecté. Lorsque le navigateur fournit son propre sélecteur, le bouton **Choisir** l’ouvre.

## Portée

La sortie sélectionnée s’applique aux pads, aux playlists et aux préécoutes de l’éditeur et de Freesound. Le réglage est local au navigateur et à l’appareil sur lequel il est défini. La vue Télécommande ne déplace pas la lecture audio vers l’appareil contrôleur.

## Persistance et repli

CueForge enregistre l’identifiant et le nom de la sortie dans le stockage local du navigateur. Cette préférence est réappliquée lors de la création du moteur audio.

Si le périphérique enregistré n’existe plus, si son accès n’est plus autorisé ou si son identifiant a changé, CueForge efface cette préférence et utilise la sortie système.

## Compatibilité du navigateur

La sélection nécessite la méthode `AudioContext.setSinkId()` du navigateur. Lorsque cette méthode n’est pas exposée, la rubrique indique que la sortie système reste active. La liste et les noms visibles dépendent des périphériques et des autorisations fournis par le navigateur.
