# Administration commerciale

L’administration est accessible à l’adresse `/admin` de l’application CueForge.

## Accès

Les rôles de plateforme sont distincts des rôles d’un compte client :

| Rôle | Accès |
| --- | --- |
| `user` | Application CueForge |
| `support` | Aucun accès à `/admin` |
| `admin` | Consultation du tableau de bord commercial |
| `super_admin` | Consultation et modification des données commerciales |

La variable `SUPER_ADMIN_EMAILS` contient les adresses qui reçoivent le rôle `super_admin` lors de leur inscription. Plusieurs adresses sont séparées par des virgules.

## Comptes

Un compte regroupe ses membres, ses spectacles, son forfait, son état d’accès et son abonnement. Son quota correspond au quota du forfait, sauf si un quota exceptionnel est défini sur le compte.

Les états d’accès sont :

| État | Écriture dans l’application |
| --- | --- |
| `trialing` | Autorisée jusqu’à la fin de l’essai |
| `active` | Autorisée |
| `grace_period` | Autorisée |
| `read_only` | Refusée |
| `suspended` | Refusée |

La lecture, la lecture audio, l’export et les suppressions restent disponibles lorsque les écritures sont refusées.

## Forfaits

Un forfait définit son code, son nom, son quota, sa durée d’essai, ses prix mensuel et annuel, son état actif et son utilisation comme forfait par défaut.

Le forfait par défaut est attribué aux nouveaux comptes. Ses prix peuvent rester non définis tant qu’aucun prestataire de paiement n’est connecté.

La rubrique **Forfaits** affiche :

- le nombre de forfaits configurés et actifs ;
- le nombre total de comptes attribués ;
- le forfait par défaut ;
- les prix mensuel et annuel de chaque forfait ;
- le quota de stockage, la durée d’essai et le nombre de comptes associés.

Le bouton **Nouveau forfait** crée un forfait. Le bouton **Dupliquer** ouvre un nouveau forfait avec les valeurs du forfait source. Le code du forfait dupliqué reste à saisir.

Un forfait peut être supprimé uniquement s’il n’est attribué à aucun compte et s’il n’est pas le forfait par défaut. Un forfait inactif reste appliqué aux comptes qui l’utilisent déjà, mais il n’apparaît plus dans les forfaits attribuables à un autre compte.

La fenêtre de gestion d’un compte affiche les prix, le quota et la durée d’essai du forfait sélectionné. Le quota exceptionnel du compte remplace le quota du forfait lorsqu’il est défini.

## Abonnements

La table des abonnements conserve le prestataire, les identifiants du client et de l’abonnement, l’intervalle de facturation, l’état, la période courante et la demande de résiliation en fin de période. Le prestataire `manual` et l’état `none` sont utilisés avant la connexion d’un système de paiement.

## Journal d’audit

Les modifications de comptes, de forfaits et d’utilisateurs effectuées depuis l’administration enregistrent l’auteur, l’action, la cible, la date, l’adresse réseau et les champs modifiés.
