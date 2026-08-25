---
layout: home

hero:
  name: "CueForge"
  text: "Documentation"
  tagline: Fonctions, commandes, paramètres, formats et limites de l’application.
  image:
    src: /cueforge-mark.svg
    alt: Logo de CueForge
  actions:
    - theme: brand
      text: Fonctionnement général
      link: /premiers-pas/
    - theme: alt
      text: Ouvrir l’application
      link: https://cueforge.sebastienj.com

features:
  - icon: "▶"
    title: Spectacles et médias
    details: Comptes, spectacles, catégories, couleurs, pistes et playlists.
    link: /guides/organiser-un-spectacle
  - icon: "⌁"
    title: Lecture hors ligne
    details: Mise en cache locale des médias et comportement sans réseau.
    link: /guides/mode-hors-ligne
  - icon: "↗"
    title: Télécommande
    details: Rôles du lecteur principal et du contrôleur distant.
    link: /guides/telecommande
---

## Contenu

- **Fonctionnement général** : création d’un compte, structure d’un spectacle, import et lecture.
- **Guides** : description détaillée d’une fonction et de ses commandes.
- **Référence** : formats, limites, raccourcis et actions configurables.
- **Dépannage** : symptômes, causes possibles et opérations de diagnostic.
- **Notes de version** : modifications apportées par chaque version.

## Éditions

**CueForge Cloud** est l’édition hébergée. Le service gère l’exécution de l’application, la base de données et le stockage des médias.

**CueForge Community** est l’édition auto-hébergée disponible sur [GitHub](https://github.com/myconcretelab/cueforge). Son installation utilise Node.js, PostgreSQL et un stockage persistant. La procédure est décrite dans [Installation de CueForge Community](./community/installation.md).

## Support

Les incidents peuvent être déclarés dans les [issues GitHub](https://github.com/myconcretelab/cueforge/issues). Les informations utiles sont la version de CueForge, le navigateur, le système d’exploitation, les étapes de reproduction et le message d’erreur.
