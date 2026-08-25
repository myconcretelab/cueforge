# Formats et limites

## Fichiers audio

| Format | Extension |
| --- | --- |
| MPEG Audio | `.mp3` |
| Waveform Audio | `.wav` |
| Ogg Audio | `.ogg` |
| Free Lossless Audio Codec | `.flac` |
| MPEG-4 Audio | `.m4a` |
| Advanced Audio Coding | `.aac` |

La taille maximale d’un fichier importé est de **250 Mo**.

L’extension est contrôlée par CueForge. Le décodage dépend ensuite des codecs fournis par le navigateur et le système d’exploitation.

## Stockage du compte

L’utilisation et le quota apparaissent dans **Paramètres → Offre et stockage**. Un import est bloqué lorsque sa taille ferait dépasser le quota.

Le stockage des médias est isolé par compte. Les fichiers sont transmis uniquement après contrôle de la session.

## Stockage hors ligne

Le stockage hors ligne utilise le cache du navigateur. Sa capacité et sa durée de conservation dépendent du navigateur, du profil et de l’espace disponible sur l’appareil.

## Navigateurs

CueForge fonctionne avec les API Web Audio, Cache Storage, Service Worker et WebSocket. La disponibilité des codecs audio, la lecture automatique et la persistance du stockage varient selon le navigateur et le système.

## Import SoundShow

L’import `.ssp` traite les catégories, les couleurs, les pistes, les boucles et les points de lecture. Les playlists et séquences SoundShow sont détectées mais ne sont pas recréées.
