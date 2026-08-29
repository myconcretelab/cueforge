# Bloc WordPress des forfaits

`sonoriva-plans.php` est le fichier principal du bloc dynamique installé sur `sonoriva.fr`. Il lit les forfaits depuis `https://app.sonoriva.fr/api/public/plans` et conserve la dernière réponse valide dans WordPress. `style.css` contient la présentation publique des cartes.

Le répertoire `wordpress/sonoriva-marketing` contient le thème public complet : page d’accueil, header, footer, styles, script et images.

Le déploiement du fichier principal s’effectue avec :

```sh
./scripts/deploy-wordpress-plans.sh
```

Le script vérifie la syntaxe PHP locale et distante, sauvegarde la version installée sur Alwaysdata, synchronise le plugin et le thème complets, les active, puis vide le transient de données des forfaits.
