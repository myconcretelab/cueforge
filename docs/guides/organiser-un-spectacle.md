# Organisation d’un spectacle

SonoRiva utilise quatre niveaux d’organisation : spectacles, catégories, couleurs et playlists.

## Spectacles

Un spectacle est un espace indépendant associé au compte. Il contient ses propres médias, réglages et collections.

La section **Paramètres → Spectacles** permet de :

- créer un spectacle ;
- sélectionner le spectacle affiché ;
- modifier l’ordre par glisser-déposer ;
- supprimer un spectacle.

La suppression retire le spectacle, ses catégories, ses pistes, ses playlists et les fichiers audio qui ne sont plus référencés. Cette opération est définitive.

## Catégories

Une catégorie regroupe des pistes. La catégorie sélectionnée filtre la grille ; **Tous les sons** affiche l’ensemble des pistes du spectacle.

Les catégories possèdent un nom, une couleur et un ordre. Leur ordre est modifiable par glisser-déposer.

## Sous-catégories

Une sous-catégorie regroupe des morceaux à l’intérieur d’une catégorie parente. Elle occupe une case de la grille, quel que soit son nombre de morceaux. Sa tuile affiche son titre sur la bordure, une mosaïque de quatre aperçus et le nombre total de morceaux.

Un clic sur la tuile ouvre un tiroir pleine largeur sous sa ligne. Les morceaux du tiroir conservent les commandes de lecture, d’édition, de sélection et de glisser-déposer des autres morceaux. Un second clic sur la tuile ou la commande de fermeture du tiroir le referme.

En mode **Réorganiser** :

- déposer un morceau au centre d’un morceau non groupé crée une sous-catégorie contenant les deux morceaux ;
- déposer un morceau sur une tuile de sous-catégorie ou au centre d’un morceau de son tiroir l’ajoute à ce groupe ;
- déposer sur le bord gauche ou droit d’un morceau l’insère avant ou après à ce même niveau ;
- déposer un morceau du tiroir sur le bord d’un morceau de la grille principale le retire du groupe ;
- glisser la tuile d’une sous-catégorie réordonne le groupe complet ou le déplace avec ses morceaux vers une autre catégorie.

Le bouton **Nouvelle sous-catégorie** du tableau de bord crée un groupe vide. La commande **Modifier** de la tuile et du tiroir change son nom, sa couleur ou sa catégorie parente. Changer la catégorie parente déplace également ses morceaux. Supprimer une sous-catégorie conserve ses morceaux dans sa catégorie parente.

Pendant une recherche, les sous-catégories ne sont pas affichées : chaque morceau correspondant apparaît directement dans les résultats.

## Couleurs

La palette du spectacle fournit les couleurs disponibles pour les catégories et les pistes. Les couleurs sont ajoutées, supprimées et réordonnées dans les paramètres.

La suppression d’une couleur de la palette ne modifie pas les pistes qui utilisent déjà cette valeur.

## Tags

Chaque morceau peut contenir jusqu’à 30 tags de 40 caractères. Les tags sont ajoutés ou supprimés depuis les réglages du morceau. La touche Entrée ou une virgule valide le texte saisi.

Le sélecteur de la barre de recherche propose deux modes : **Noms**, sélectionné par défaut, recherche dans le titre du morceau et le nom du fichier ; **Tags** recherche uniquement dans les tags. Plusieurs mots saisis en mode **Tags** doivent tous correspondre à au moins un tag du morceau.

Les tags fournis par Freesound sont enregistrés automatiquement avec les morceaux importés depuis ce service.

## Sélection et édition de plusieurs morceaux

Le bouton **Sélection multiple** du tableau de bord active la sélection des morceaux. Dans ce mode :

- un clic ou un toucher sur une carte ajoute ou retire le morceau de la sélection ;
- un glisser à la souris trace un rectangle et sélectionne les cartes qu’il touche ;
- les touches Maj, Ctrl ou Cmd maintenues pendant le tracé ajoutent le rectangle à la sélection existante ;
- **Tout sélectionner** sélectionne les morceaux visibles et **Effacer** vide la sélection.

Le bouton **Modifier** ouvre l’édition de lot. Chaque champ doit être coché pour être appliqué aux morceaux sélectionnés. Les champs disponibles sont la catégorie, la couleur, les tags, le volume, la lecture en boucle et les fondus d’entrée et de sortie.

Pour les tags, l’édition de lot propose trois opérations : ajouter les tags à chaque morceau, retirer les tags indiqués ou remplacer entièrement les tags existants. Une liste vide avec l’opération de remplacement supprime tous les tags.

## Playlists

Une playlist contient une suite ordonnée de rangées. Une rangée contient un ou plusieurs morceaux qui démarrent ensemble. La playlist passe à la rangée suivante lorsque le dernier morceau de la rangée courante est terminé.

Les morceaux sont ajoutés depuis la grille. Un dépôt au centre d’une rangée ajoute le morceau à son groupe. Un dépôt dans la zone fine située entre deux rangées place le morceau seul à cet emplacement. Ce second dépôt permet également de retirer un morceau d’un groupe.

La section **Paramètres → Playlists** fixe la limite des rangées entre deux et huit morceaux pour le spectacle. La limite ne peut pas être abaissée sous la taille d’une rangée déjà enregistrée ou ouverte.

Les paramètres d’une playlist comprennent :

- l’ordre séquentiel ou aléatoire des rangées ;
- la répétition de la liste ;
- le démarrage automatique lors du chargement de la playlist ;
- un silence entre deux rangées ;
- un fondu enchaîné entre deux rangées.

Pause, arrêt et passage au suivant s’appliquent à tous les lecteurs de la rangée courante. Lors d’un fondu enchaîné, les morceaux encore actifs de la rangée sortante sont arrêtés ensemble tandis que la rangée suivante démarre.

Une playlist enregistrée appartient au spectacle sélectionné.
