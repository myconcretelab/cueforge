# Demandes de support

Le bouton **Support** est affiché dans l’en-tête de l’application pour chaque utilisateur authentifié. Son accès ne dépend pas du forfait ni de l’état commercial du compte. Les demandes et leurs messages sont conservés sur le compte SonoRiva et nécessitent une connexion au serveur.

## Créer et suivre une demande

Le bouton **Nouvelle demande** ouvre un formulaire comportant un sujet et un message. Après l’envoi, la demande apparaît dans la liste **Mes demandes**.

Chaque demande affiche son état, sa dernière activité, son nombre de messages et le nombre de réponses non lues. Le compteur du bouton **Support** est actualisé pendant l’utilisation de l’application.

Les états affichés sont :

- **En attente du support** après la création ou une réponse de l’utilisateur ;
- **Réponse reçue** après une réponse du support ;
- **Résolue** lorsque la demande est marquée comme traitée ;
- **Close** lorsque la conversation est fermée.

Une demande close peut être rouverte. Une réponse ajoutée à une demande résolue la replace en attente du support.

## Administration

La rubrique **Support** de l’administration est accessible au rôle `super_admin`. Elle liste les demandes et permet de les rechercher par sujet, utilisateur ou compte, puis de les filtrer par état.

La fiche d’une demande contient :

- le nom et l’adresse électronique de l’utilisateur ;
- le compte, son état d’accès et son forfait ;
- le stockage utilisé et le quota effectif, y compris une éventuelle dérogation de quota ;
- le fil des messages, l’état et la priorité de la demande.

Une réponse administrative peut laisser la demande en attente de l’utilisateur, la résoudre ou la clore. Les changements d’état, de priorité et les réponses sont enregistrés dans le journal administratif.
