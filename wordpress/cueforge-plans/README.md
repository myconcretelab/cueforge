# Bloc WordPress des forfaits

`cueforge-plans.php` est le fichier principal du bloc dynamique installé sur `cueforge.fr`. Il lit les forfaits depuis `https://app.cueforge.fr/api/public/plans` et conserve la dernière réponse valide dans WordPress. `style.css` contient la présentation publique des cartes.

Le déploiement met également à jour `wordpress/cueforge-marketing/header.php`, qui contient le header public du thème et son accès à la démonstration sans compte.

Le déploiement du fichier principal s’effectue avec :

```sh
./scripts/deploy-wordpress-plans.sh
```

Le script vérifie la syntaxe PHP locale et distante, conserve une copie des fichiers remplacés sur Alwaysdata, met à jour le plugin et le header du thème, puis vide le transient de données des forfaits.
