<?php
/**
 * SonoRiva product landing page.
 *
 * @package SonoRiva_Marketing
 */
get_header();
$theme_uri = get_template_directory_uri();
?>
<main id="main">
    <section class="product-hero">
        <div class="product-hero-glow" aria-hidden="true"></div>
        <div class="shell product-hero-inner">
            <div class="product-hero-copy" data-reveal>
                <p class="eyebrow">Régie son pour le spectacle vivant</p>
                <h1>La régie son.<br><em>Dans le cloud.</em><br>Prête pour la scène.</h1>
                <p class="product-hero-lede">SonoRiva est un logiciel de régie son en ligne pour le théâtre et le spectacle vivant. Cherchez sur Freesound, organisez vos cues et déclenchez plusieurs sons sur les sorties audio de votre choix.</p>
                <div class="hero-actions">
                    <a class="button button-primary" href="https://app.sonoriva.fr/demo">Tester la régie <span aria-hidden="true">↗</span></a>
                    <a class="button button-ghost" href="#fonctionnalites">Voir les fonctionnalités <span aria-hidden="true">↓</span></a>
                </div>
                <div class="product-hero-facts" aria-label="Fonctionnalités principales">
                    <span><i></i> Multi-lecture</span>
                    <span><i></i> Freesound intégré</span>
                    <span><i></i> Import SoundShow</span>
                    <span><i></i> Mode hors ligne</span>
                </div>
            </div>

            <figure class="product-shot product-shot-hero" data-reveal>
                <div class="product-shot-bar" aria-hidden="true">
                    <span><i></i><i></i><i></i></span>
                    <strong>Découverte de SonoRiva</strong>
                    <em>Démo réelle</em>
                </div>
                <div class="product-shot-crop product-shot-crop-dashboard">
                    <img src="<?php echo esc_url($theme_uri . '/assets/images/app-dashboard.png'); ?>" alt="Interface réelle de SonoRiva avec les catégories Lancements, Transitions et Final, la recherche et les cartes de sons" width="1600" height="1050" fetchpriority="high">
                </div>
                <div class="shot-callout callout-categories"><span>01</span><b>Catégories</b></div>
                <div class="shot-callout callout-search"><span>02</span><b>Recherche + Freesound</b></div>
                <div class="shot-callout callout-sounds"><span>03</span><b>Sons prêts à jouer</b></div>
            </figure>
            <p class="real-capture-note" data-reveal><span></span> Capture réalisée dans la démo en ligne de SonoRiva</p>
        </div>
    </section>

    <section class="outcome-strip" aria-label="Ce que SonoRiva permet de faire">
        <div class="shell outcome-grid">
            <article data-reveal><span>01</span><div><strong>Trouver</strong><p>Recherche Freesound sans quitter la régie.</p></div></article>
            <article data-reveal><span>02</span><div><strong>Préécouter</strong><p>Écoute immédiate sur la sortie choisie.</p></div></article>
            <article data-reveal><span>03</span><div><strong>Organiser</strong><p>Catégories, couleurs, colonnes et ordre libre.</p></div></article>
            <article data-reveal><span>04</span><div><strong>Déclencher</strong><p>Plusieurs lectures, plusieurs sorties audio.</p></div></article>
        </div>
    </section>

    <section class="feature-stories section" id="fonctionnalites">
        <div class="shell">
            <div class="section-heading split" data-reveal>
                <div><p class="eyebrow">Du besoin au son</p><h2>Moins de fenêtres.<br><em>Plus de jeu.</em></h2></div>
                <p>Les fonctions principales sont directement accessibles depuis le soundboard. Chaque écran ci-dessous correspond à l’interface actuelle de l’application.</p>
            </div>

            <article class="feature-story feature-story-freesound">
                <div class="feature-story-copy" data-reveal>
                    <span class="story-number">01 / Freesound</span>
                    <h3>Cherchez, écoutez, ajoutez. Sans téléchargement intermédiaire.</h3>
                    <p>La recherche Freesound est intégrée au champ de recherche de SonoRiva. Un même écran regroupe les résultats, la préécoute et l’ajout au spectacle.</p>
                    <ul class="concrete-list">
                        <li><span>01</span><div><strong>Rechercher précisément</strong><p>Texte, licence compatible et durée minimale ou maximale.</p></div></li>
                        <li><span>02</span><div><strong>Écouter tout de suite</strong><p>Lecture, pause, progression et volume sans quitter les résultats.</p></div></li>
                        <li><span>03</span><div><strong>Ajouter au bon endroit</strong><p>Nom, catégorie et couleur sont choisis avant l’import.</p></div></li>
                    </ul>
                </div>
                <figure class="product-shot feature-shot" data-reveal>
                    <div class="product-shot-bar" aria-hidden="true"><span><i></i><i></i><i></i></span><strong>Recherche «&nbsp;orage&nbsp;»</strong><em>Capture réelle</em></div>
                    <div class="product-shot-crop product-shot-crop-freesound"><img src="<?php echo esc_url($theme_uri . '/assets/images/app-freesound.png'); ?>" alt="Fenêtre réelle de recherche Freesound intégrée à SonoRiva avec filtres de licence, résultats, boutons d’écoute et d’ajout" width="1600" height="1050" loading="lazy"></div>
                </figure>
            </article>

            <article class="feature-story feature-story-routing">
                <div class="feature-story-copy" data-reveal>
                    <span class="story-number">02 / Multi-sorties</span>
                    <h3>Le même son sur la façade. Un autre dans les retours.</h3>
                    <p>Avec SonoRiva Bridge, chaque sortie audio reçoit un nom et une couleur. La sortie principale reste accessible par le grand bouton, les autres apparaissent sous forme de boutons de lecture supplémentaires.</p>
                    <div class="routing-facts">
                        <span><b>1 clic</b> sur la sortie principale</span>
                        <span><b>Multi-play</b> sur les sorties alternatives</span>
                        <span><b>Simultané</b> avec plusieurs sons actifs</span>
                    </div>
                </div>
                <div class="routing-demo" data-reveal aria-label="Aperçu fidèle des contrôles multi-sorties de SonoRiva">
                    <div class="routing-demo-label"><span>Aperçu fidèle de l’interface Bridge</span><em>3 sorties détectées</em></div>
                    <div class="output-strip-demo">
                        <strong>Sorties audio</strong>
                        <button class="is-main" style="--output:#22d3b6"><i></i><span>Façade</span><em>Principale</em></button>
                        <button style="--output:#8b5cf6"><i></i><span>Retours scène</span></button>
                        <button style="--output:#06b6d4"><i></i><span>Casque régie</span></button>
                    </div>
                    <div class="routing-board-demo">
                        <article style="--track:#22d3b6">
                            <div class="multi-play-row"><button class="main-play" aria-label="Lecture principale">▶</button><button style="--output:#8b5cf6" aria-label="Lire dans les retours">▶</button><button style="--output:#06b6d4" aria-label="Lire dans le casque">▶</button></div>
                            <strong>Ambiance salle</strong><span>12:48 · Boucle</span>
                        </article>
                        <article style="--track:#8b5cf6">
                            <div class="multi-play-row"><button class="main-play" aria-label="Lecture principale">▶</button><button style="--output:#8b5cf6" aria-label="Lire dans les retours">▶</button><button style="--output:#06b6d4" aria-label="Lire dans le casque">▶</button></div>
                            <strong>Entrée comédien</strong><span>00:18 · Cue 12</span>
                        </article>
                        <article class="is-playing" style="--track:#06b6d4">
                            <div class="multi-play-row"><button class="main-play" aria-label="Lecture principale">▮▮</button><button style="--output:#8b5cf6" aria-label="Lire dans les retours">▶</button><button style="--output:#06b6d4" aria-label="Lire dans le casque">▶</button></div>
                            <strong>Annonce plateau</strong><span>En lecture · Casque régie</span>
                        </article>
                    </div>
                    <div class="freesound-route-demo"><span>Dans Freesound, les mêmes boutons apparaissent à côté de la préécoute.</span><div><button style="--output:#22d3b6">▶</button><button style="--output:#8b5cf6">▶</button><button style="--output:#06b6d4">▶</button></div></div>
                </div>
            </article>

            <article class="feature-story feature-story-organize">
                <div class="organize-visual" data-reveal>
                    <figure class="product-shot feature-shot">
                        <div class="product-shot-bar" aria-hidden="true"><span><i></i><i></i><i></i></span><strong>Soundboard</strong><em>Capture réelle</em></div>
                        <div class="product-shot-crop product-shot-crop-organize"><img src="<?php echo esc_url($theme_uri . '/assets/images/app-dashboard.png'); ?>" alt="Soundboard réel de SonoRiva montrant les catégories, le réglage des colonnes, la réorganisation et les cartes de sons colorées" width="1600" height="1050" loading="lazy"></div>
                    </figure>
                </div>
                <div class="feature-story-copy" data-reveal>
                    <span class="story-number">03 / Organisation</span>
                    <h3>La disposition s’adapte au spectacle, pas l’inverse.</h3>
                    <p>Le soundboard se réorganise directement par glisser-déposer. Les catégories structurent le spectacle et les couleurs rendent chaque famille de cues immédiatement identifiable.</p>
                    <ul class="check-list">
                        <li>De 2 à 12 colonnes sur ordinateur</li>
                        <li>De 1 à 3 colonnes sur mobile</li>
                        <li>Ordre libre des sons, playlists et catégories</li>
                        <li>Largeur des catégories réglable</li>
                        <li>Recherche dans tout le spectacle</li>
                    </ul>
                </div>
            </article>

            <article class="feature-story feature-story-cues">
                <div class="feature-story-copy" data-reveal>
                    <span class="story-number">04 / Cues et réglages</span>
                    <h3>Chaque son démarre et s’arrête exactement au bon endroit.</h3>
                    <p>La forme d’onde permet de définir visuellement le début et la fin. Le même écran regroupe les réglages qui distinguent un fichier brut d’un cue prêt à jouer.</p>
                    <div class="cue-tags" aria-label="Réglages disponibles"><span>Début / fin</span><span>Volume</span><span>Fondus</span><span>Boucle</span><span>Couleur</span><span>Catégorie</span></div>
                </div>
                <figure class="product-shot feature-shot" data-reveal>
                    <div class="product-shot-bar" aria-hidden="true"><span><i></i><i></i><i></i></span><strong>Réglages du son</strong><em>Capture réelle</em></div>
                    <div class="product-shot-crop product-shot-crop-settings"><img src="<?php echo esc_url($theme_uri . '/assets/images/app-track-settings.png'); ?>" alt="Fenêtre réelle de réglage d’un son avec couleur, catégorie, forme d’onde, points de début et fin, volume, fondus et boucle" width="1600" height="1050" loading="lazy"></div>
                </figure>
            </article>
        </div>
    </section>

    <section class="capabilities-section section">
        <div class="shell">
            <div class="section-heading centered" data-reveal><p class="eyebrow">Et aussi, concrètement</p><h2>Tout ce qu’il faut autour du bouton Play.</h2></div>
            <div class="capability-grid">
                <article class="capability-card capability-playlist" data-reveal>
                    <span class="capability-icon">≡</span><p class="card-kicker">Playlists</p><h3>Enchaînez plusieurs sons.</h3><p>Glissez les sons dans une playlist, changez leur ordre et choisissez lecture automatique, boucle, aléatoire, blanc ou fondu enchaîné.</p>
                    <div class="mini-playlist" aria-hidden="true"><span><i>1</i>Accueil public</span><span><i>2</i>Annonce ouverture</span><span><i>3</i>Jingle</span></div>
                </article>
                <article class="capability-card capability-import" data-reveal>
                    <span class="capability-icon">.SSP</span><p class="card-kicker">Import SoundShow</p><h3>Reprenez un spectacle existant.</h3><p>SonoRiva analyse le projet <code>.ssp</code>, retrouve les médias locaux et les sources Freesound compatibles, puis recrée catégories, couleurs, boucles, points de lecture et fondus.</p>
                    <div class="import-flow" aria-hidden="true"><b>.SSP</b><i>→</i><span><em>6</em> catégories</span><span><em>42</em> sons</span><span><em>3</em> sources</span></div>
                </article>
                <article class="capability-card" data-reveal>
                    <span class="capability-icon">⇣</span><p class="card-kicker">Hors ligne</p><h3>Chargez les sons sur l’appareil.</h3><p>Une catégorie peut être rendue disponible hors ligne. Les médias sont alors lus localement dans le navigateur.</p>
                    <div class="status-chip"><i></i> Catégorie disponible hors ligne</div>
                </article>
                <article class="capability-card" data-reveal>
                    <span class="capability-icon">↗</span><p class="card-kicker">Télécommande</p><h3>Pilotez la régie depuis un autre écran.</h3><p>Le mode télécommande envoie les commandes de lecture à la régie principale connectée au même spectacle.</p>
                    <div class="remote-link"><span>Régie <i></i></span><b>••••••</b><span><i></i> Télécommande</span></div>
                </article>
                <article class="capability-card" data-reveal>
                    <span class="capability-icon">⌁</span><p class="card-kicker">Actions de lecture</p><h3>Un geste peut avoir plusieurs sens.</h3><p>Démarrer, remplacer, arrêter, faire un fondu d’entrée ou un fondu enchaîné&nbsp;: les clics gauche et droit sont configurables.</p>
                    <div class="mouse-actions-demo"><span><kbd>G</kbd>Démarrer</span><span><kbd>D</kbd>Fondu enchaîné</span></div>
                </article>
                <article class="capability-card" data-reveal>
                    <span class="capability-icon">◷</span><p class="card-kicker">Repères de régie</p><h3>Le temps reste visible.</h3><p>Horloge, chronomètre, historique de progression et volume du prochain son restent accessibles au-dessus du soundboard.</p>
                    <div class="time-demo"><span><small>CHRONO</small>00:42:18</span><span><small>HEURE</small>20:47:06</span></div>
                </article>
            </div>
        </div>
    </section>

    <section class="soundshow-promo">
        <div class="shell soundshow-promo-grid">
            <div data-reveal><p class="eyebrow">Vous utilisez SoundShow&nbsp;?</p><h2>Importez votre régie dans le cloud.</h2><p>SonoRiva analyse les projets <code>.ssp</code>, retrouve les médias locaux et recrée les catégories, couleurs, boucles, points de lecture et fondus compatibles.</p></div>
            <div class="soundshow-promo-action" data-reveal><span><b>.SSP</b><i>→</i><b class="cloud-mark">☁</b></span><a class="button button-primary" href="<?php echo esc_url(home_url('/alternative-soundshow/')); ?>">Découvrir l’alternative cloud <span aria-hidden="true">→</span></a></div>
        </div>
    </section>

    <section class="usecases-section section" id="pour-qui">
        <div class="shell">
            <div class="section-heading centered" data-reveal><p class="eyebrow">Une régie, plusieurs plateaux</p><h2>Pour les spectacles où le son doit partir maintenant.</h2></div>
            <div class="usecase-grid">
                <article data-reveal><span>01</span><h3>Théâtre & improvisation</h3><p>Bruitages, ambiances, musiques et changements improvisés réunis par spectacle.</p><i>→</i></article>
                <article data-reveal><span>02</span><h3>Danse & performance</h3><p>Points de lecture, fondus, playlists et sorties dédiées pour accompagner le plateau.</p><i>→</i></article>
                <article data-reveal><span>03</span><h3>Événementiel & live</h3><p>Jingles, annonces, lancements et transitions accessibles par couleur et catégorie.</p><i>→</i></article>
            </div>
        </div>
    </section>

    <section class="pricing-section section" id="tarifs">
        <div class="shell">
            <div class="section-heading centered" data-reveal><p class="eyebrow">Offres</p><h2>Commencez dans le navigateur.<br>Passez au multi-sorties avec Bridge.</h2><p>Les offres disponibles et leurs limites sont chargées directement depuis SonoRiva.</p></div>
            <?php echo do_blocks('<!-- wp:sonoriva/plans /-->'); ?>
        </div>
    </section>

    <section class="faq-section section" id="faq">
        <div class="shell faq-grid">
            <div data-reveal><p class="eyebrow">Questions fréquentes</p><h2>Les détails<br>avant le show.</h2><p>Une question qui n’est pas traitée ici peut être envoyée directement à l’équipe SonoRiva.</p><a class="inline-link" href="mailto:contact@sebastienj.com">Poser une question <span>↗</span></a></div>
            <div class="faq-list" data-reveal>
                <details open><summary>Peut-on jouer plusieurs sons en même temps&nbsp;?<span>＋</span></summary><p>Oui. SonoRiva gère plusieurs lectures simultanées. Avec SonoRiva Bridge, chaque lecture peut aussi être dirigée vers une sortie audio distincte.</p></details>
                <details><summary>Comment fonctionne la recherche Freesound&nbsp;?<span>＋</span></summary><p>La recherche est accessible depuis le soundboard. Elle permet de filtrer par licence et durée, d’écouter les résultats, puis de choisir le nom, la catégorie et la couleur avant l’ajout. Les sons CC BY conservent leur attribution.</p></details>
                <details><summary>Que récupère l’import SoundShow&nbsp;?<span>＋</span></summary><p>L’import lit un projet <code>.ssp</code> et reprend les catégories, couleurs, boucles, points d’entrée et de sortie, fondus et médias disponibles. Les sources Freesound compatibles sont également reconnues.</p></details>
                <details><summary>SonoRiva fonctionne-t-il sans Internet&nbsp;?<span>＋</span></summary><p>Oui. Une catégorie peut être rendue disponible hors ligne. Les médias concernés sont ensuite lus localement par le navigateur.</p></details>
                <details><summary>Quels formats audio sont acceptés&nbsp;?<span>＋</span></summary><p>SonoRiva prend en charge MP3, WAV, OGG, FLAC, M4A et AAC, avec des fichiers allant jusqu’à 250&nbsp;Mo.</p></details>
            </div>
        </div>
    </section>

    <section class="final-cta">
        <div class="cta-glow" aria-hidden="true"></div>
        <div class="shell final-cta-inner" data-reveal><p class="eyebrow">La démo utilise la vraie application</p><h2>Essayez les gestes.</h2><p>Ouvrez le soundboard, jouez les sons fournis, changez de catégorie et lancez une recherche Freesound.</p><div><a class="button button-light" href="https://app.sonoriva.fr/demo">Ouvrir la démo <span>↗</span></a><a class="button button-dark" href="https://app.sonoriva.fr/docs/">Lire la documentation</a></div></div>
    </section>
</main>
<?php get_footer(); ?>
