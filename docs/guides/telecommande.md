# Télécommande

La télécommande transmet des commandes de lecture à une autre instance de CueForge connectée au même spectacle.

## Rôles

| Rôle | Fonction |
| --- | --- |
| Lecteur principal | Charge les médias et produit le son |
| Contrôleur | Affiche les pistes et envoie les commandes |

Le contrôleur ne lit pas les médias sur sa propre sortie audio.

## Ouverture

1. Connecter les deux appareils avec le même compte.
2. Sélectionner le même spectacle sur les deux appareils.
3. Sur l’appareil distant, ouvrir **Paramètres → Télécommande**.
4. Exécuter **Ouvrir la télécommande**.

L’interface affiche le rôle actif et l’état de la connexion temps réel.

## Commandes transmises

La télécommande peut transmettre le démarrage d’une piste, les actions configurées, l’arrêt d’une piste et les arrêts globaux. Le lecteur principal vérifie que le spectacle appartient au compte avant d’accepter la commande.

## Connexion

Les deux instances utilisent une connexion WebSocket au serveur. Une interruption de cette connexion désactive la transmission des commandes et modifie l’indicateur d’état. Les commandes locales du lecteur principal restent disponibles.

Le rétablissement du réseau déclenche une tentative de reconnexion. Le compte et le spectacle sélectionné doivent rester identiques sur les deux instances.
