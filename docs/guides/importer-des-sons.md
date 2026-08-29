# Import des sons

SonoRiva accepte un fichier unique, une sélection de fichiers, une source Freesound ou un projet SoundShow.

## Fichier unique

1. Sélectionner un spectacle.
2. Ouvrir **Ajouter un son**.
3. Sélectionner un fichier audio.
4. Définir le titre et la catégorie.
5. Exécuter **Importer**.

Le titre initial correspond au nom du fichier sans son extension. Le fichier est envoyé vers le stockage du compte et une piste est créée dans le spectacle sélectionné.

## Sélection de fichiers

Une sélection de fichiers peut être déposée sur la fenêtre de SonoRiva. Les fichiers sont importés dans la catégorie active et la progression globale est affichée pendant le transfert.

Un fichier dont l’extension n’est pas reconnue est ignoré. Un fichier qui dépasse la taille maximale ou le quota disponible est refusé sans annuler les imports terminés.

## Freesound

La commande **Paramètres → Bibliothèque → Rechercher sur Freesound** ouvre la recherche. Les résultats peuvent être filtrés par durée, préécoutés puis importés dans le spectacle sélectionné.

SonoRiva propose les résultats sous licence CC0 ou CC BY. Lors de l’import, l’application conserve le nom de l’auteur, la licence et l’adresse de la source. La préécoute haute qualité devient un média du compte.

## Projet SoundShow

La commande **Paramètres → Bibliothèque → Importer SoundShow** analyse un fichier `.ssp`. Les dossiers de médias associés peuvent être ajoutés pendant l’analyse.

L’import recrée les catégories, leurs couleurs, les pistes, les boucles et les points d’entrée et de sortie détectés. Les playlists et les séquences SoundShow ne sont pas recréées.

Les extensions et tailles acceptées sont listées dans [Formats et limites](../reference/formats-et-limites.md).
