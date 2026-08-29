# Notes de version

Chaque entrée décrit les modifications fonctionnelles et techniques d’une version.

## Version 0.17.0 — 29 août 2026

- ajout d’un installateur CueForge Bridge pour Windows x64 ;
- stockage des clés dans le Gestionnaire d’identification Windows ;
- conservation du moteur Web Audio complet lorsque le bridge n’est pas installé ou sélectionné.

[Détails de la version 0.17.0](./0.17.0.md)

## Version 0.16.1 — 29 août 2026

- téléchargement de CueForge Bridge depuis une publication GitHub publique ;
- paquet Apple Silicon et paquet Intel ;
- signature ad hoc sans certificat Apple Developer ni notarisation.

[Détails de la version 0.16.1](./0.16.1.md)

## Version 0.16.0 — 29 août 2026

- ajout du moteur natif facultatif CueForge Bridge pour macOS ;
- association depuis les paramètres au moyen d’un lien natif à usage unique ;
- cache audio propre au bridge et sélection indépendante des sorties principale et préécoute ;
- maintien du moteur Web Audio complet lorsque le bridge n’est pas installé ou sélectionné.

[Détails de la version 0.16.0](./0.16.0.md)

## Version 0.15.0 — 28 août 2026

- ajout du choix du périphérique dans les paramètres ;
- application de la sortie à la régie et aux préécoutes ;
- mémorisation locale avec retour à la sortie système lorsque le périphérique n’est plus disponible.

[Détails de la version 0.15.0](./0.15.0.md)

## Version 0.14.0 — 28 août 2026

- ajout des forfaits gratuits sans carte bancaire ;
- activation immédiate avec le quota de stockage configuré ;
- passage ultérieur vers une offre payante depuis les paramètres.

[Détails de la version 0.14.0](./0.14.0.md)

## Version 0.13.0 — 27 août 2026

- sélection du forfait mensuel ou annuel lors de la création du compte ;
- enregistrement du moyen de paiement sur Stripe avant le début de l’essai ;
- première échéance à la fin de la durée d’essai du forfait.

[Détails de la version 0.13.0](./0.13.0.md)

## Version 0.12.0 — 26 août 2026

- ajout de la souscription mensuelle ou annuelle avec Stripe Checkout ;
- ajout du portail Stripe pour l’abonnement, les factures et le moyen de paiement ;
- synchronisation des droits CueForge à partir des événements Stripe.

[Détails de la version 0.12.0](./0.12.0.md)

## Version 0.11.0 — 26 août 2026

- ajout du réglage de mises à jour automatiques ;
- installation d’une version en attente lorsque aucune lecture n’est active ;
- affichage de notes de version limitées aux fonctions de la régie.

[Détails de la version 0.11.0](./0.11.0.md)

## Version 0.10.1 — 25 août 2026

- masquage des messages de mise à jour dans les démonstrations ;
- masquage de la fenêtre et de la rubrique Nouveautés dans les démonstrations ;
- maintien de ces messages dans les espaces personnels.

[Détails de la version 0.10.1](./0.10.1.md)

## Version 0.10.0 — 25 août 2026

- ajout de la démonstration sans compte sous `/demo` ;
- création d’un espace temporaire isolé avec trois sons préchargés ;
- limite de 15 fichiers importés et de 5 Mo par fichier ;
- suppression après 24 heures d’inactivité et commande de réinitialisation.

[Détails de la version 0.10.0](./0.10.0.md)

## Version 0.7.0 — 25 août 2026

- ajout de la demande de réinitialisation depuis la page de connexion ;
- envoi d’un lien temporaire et à usage unique par e-mail ;
- fermeture des sessions existantes après la modification du mot de passe.

[Détails de la version 0.7.0](./0.7.0.md)

## Version 0.6.0 — 25 août 2026

- mise en ligne du site de présentation sur `cueforge.fr` ;
- déplacement de l’application sur `app.cueforge.fr` ;
- maintien de la documentation sous `/docs/` sur le domaine de l’application.

[Détails de la version 0.6.0](./0.6.0.md)

## Version 0.4.0 — 25 août 2026

- changement du nom de l’application vers CueForge ;
- changement des domaines, chemins, identifiants techniques et éléments graphiques ;
- migration des préférences locales, du cache audio et des cookies de session ;
- maintien temporaire de l’ancienne origine pour les PWA et télécommandes existantes.

[Détails de la version 0.4.0](./0.4.0.md)

## Version 0.3.0 — 25 août 2026

- ajout de la documentation publique ;
- ajout de la recherche et de la navigation par rubrique ;
- intégration de la documentation au build et au déploiement.

[Détails de la version 0.3.0](./0.3.0.md)

## Version 0.2.0 — 25 août 2026

- ajout des notes de version dans l’application ;
- détection et installation différée des mises à jour PWA ;
- exposition de la version par l’API.

[Détails de la version 0.2.0](./0.2.0.md)

## Cycle de mise à jour

1. La nouvelle version du service worker est téléchargée en arrière-plan.
2. Lorsque les mises à jour automatiques sont désactivées, l’application affiche une notification.
3. Le bouton reste désactivé pendant une lecture audio.
4. Lorsque les mises à jour automatiques sont activées, la version est installée dès qu’aucun son n’est en lecture.
5. L’activation remplace le service worker courant et recharge l’interface.
6. Les nouveautés non consultées sont affichées après la connexion.
