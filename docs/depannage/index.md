# Dépannage

## Aucun son ne sort

Points de contrôle :

1. volume de la piste dans CueForge ;
2. volume du système ;
3. sortie audio sélectionnée par le système ;
4. lecture d’une autre piste dans CueForge ;
5. lecture du fichier d’origine dans un lecteur externe ;
6. accès exclusif éventuel d’une autre application à l’interface audio.

Si une seule piste échoue, le problème peut provenir du fichier ou de son codec. Si toutes les pistes échouent, le problème concerne généralement la sortie audio, le navigateur ou le système.

## Fichier refusé

Causes traitées par l’application :

- extension absente de la liste prise en charge ;
- fichier supérieur à 250 Mo ;
- quota de stockage insuffisant ;
- fichier vide ou transfert interrompu.

Un fichier accepté à l’import peut encore échouer au décodage si son codec n’est pas fourni par le navigateur. Voir [Formats et limites](../reference/formats-et-limites.md).

## Média absent hors ligne

Points de contrôle :

- état final de l’opération **Rendre disponible hors ligne** ;
- autorisation de stockage du domaine CueForge ;
- profil et navigateur utilisés lors de la mise en cache ;
- utilisation éventuelle d’une fenêtre privée ;
- espace disponible sur l’appareil.

Une nouvelle exécution de **Rendre disponible hors ligne** télécharge les médias absents du cache.

## Télécommande sans effet

Les deux instances doivent remplir les conditions suivantes :

- session authentifiée avec le même compte ;
- même spectacle sélectionné ;
- connexion temps réel active ;
- une instance en rôle de lecteur principal et l’autre en rôle de contrôleur.

L’indicateur de connexion signale une interruption du WebSocket. Les commandes locales restent utilisables sur le lecteur principal.

## Mise à jour en attente

Une nouvelle version PWA est téléchargée en arrière-plan. Le bouton **Mettre à jour** reste désactivé pendant une lecture audio. Lorsqu’il est activé, son utilisation remplace la version courante et recharge l’interface.

## Informations de diagnostic

Une déclaration dans les [issues GitHub](https://github.com/myconcretelab/cueforge/issues) peut contenir :

- la version de CueForge affichée dans l’application ;
- le nom et la version du navigateur ;
- le système d’exploitation ;
- les étapes de reproduction ;
- le message d’erreur sans donnée d’authentification.
