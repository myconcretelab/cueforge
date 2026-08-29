# Bloc WordPress des forfaits

`cueforge-plans.php` est le fichier principal du bloc dynamique installé sur `cueforge.fr`. Il lit les forfaits depuis `https://app.cueforge.fr/api/public/plans` et conserve la dernière réponse valide dans WordPress.

Le déploiement du fichier principal s’effectue avec :

```sh
./scripts/deploy-wordpress-plans.sh
```

Le script vérifie la syntaxe PHP locale et distante, conserve une copie du fichier remplacé sur Alwaysdata, remplace le fichier du plugin puis vide son transient de données.
