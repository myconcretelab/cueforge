<?php
/**
 * SonoRiva landing page.
 *
 * @package SonoRiva_Marketing
 */
get_header();
$theme_uri = get_template_directory_uri();
?>
<main id="main">
    <section class="hero">
        <img class="hero-art" src="<?php echo esc_url($theme_uri . '/assets/images/hero-sonoriva.jpg'); ?>" alt="" width="1536" height="1024" fetchpriority="high">
        <div class="hero-grid" aria-hidden="true"></div>
        <div class="shell hero-inner">
            <div class="hero-copy" data-reveal>
                <a class="announcement" href="#tarifs"><span></span> SonoRiva est disponible en ligne <b>Découvrir <i>→</i></b></a>
                <p class="eyebrow">Régie son web pour la scène</p>
                <h1>Play sound.<br><em>Play the scene.</em></h1>
                <p class="hero-lede">Préparez vos spectacles, déclenchez vos médias instantanément et gardez le contrôle — même sans connexion.</p>
                <div class="hero-actions">
                    <a class="button button-primary" href="https://app.sonoriva.fr/demo">Essayer sans compte <span aria-hidden="true">↗</span></a>
                    <a class="button button-ghost" href="#demo"><span class="play-dot" aria-hidden="true">▶</span> Voir l’interface</a>
                </div>
                <div class="hero-notes"><span><i>✓</i> Essai gratuit</span><span><i>✓</i> Sans carte bancaire</span><span><i>✓</i> Installable en PWA</span></div>
            </div>
        </div>
        <div class="shell hero-proof" data-reveal>
            <p>Une régie pensée pour</p>
            <div><span>Théâtre</span><span>Improvisation</span><span>Danse</span><span>Événementiel</span><span>Podcast live</span></div>
        </div>
    </section>

    <section class="product-section" id="demo">
        <div class="shell">
            <div class="section-heading centered" data-reveal>
                <p class="eyebrow">Le spectacle d’abord</p>
                <h2>Une interface qui disparaît<br>quand le rideau se lève.</h2>
                <p>Tout est visible, accessible et prêt à jouer. Pas de menus techniques au moment où chaque seconde compte.</p>
            </div>
            <div class="product-window" data-reveal>
                <div class="window-topbar"><div class="window-dots"><i></i><i></i><i></i></div><div class="window-brand"><img src="<?php echo esc_url($theme_uri . '/assets/images/sonoriva-mark.svg'); ?>" alt="" width="24" height="24"> SonoRiva</div><div class="window-status"><span></span> Prêt hors ligne</div></div>
                <div class="app-layout">
                    <aside class="app-sidebar">
                        <strong>NUIT DES ROIS</strong>
                        <button class="active"><i style="--cat:#22d3b6"></i>Tous les sons <span>24</span></button>
                        <button><i style="--cat:#8b5cf6"></i>Ambiances <span>7</span></button>
                        <button><i style="--cat:#06b6d4"></i>Transitions <span>6</span></button>
                        <button><i style="--cat:#22c55e"></i>Musiques <span>8</span></button>
                        <button><i style="--cat:#ec4899"></i>Final <span>3</span></button>
                        <div class="sidebar-bottom"><span>●</span> Télécommande connectée</div>
                    </aside>
                    <div class="app-main">
                        <div class="app-console">
                            <div><small>PROCHAIN SON</small><strong>100<sup>%</sup></strong></div>
                            <div><small>CHRONOMÈTRE</small><strong class="mono">00:42:18</strong></div>
                            <div><small>HEURE</small><strong class="mono">20:47:06</strong></div>
                            <button><span>＋</span> Importer</button>
                        </div>
                        <div class="track-grid">
                            <article class="track-card playing" style="--track:#22d3b6"><div class="wave-bars"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><span class="track-state">EN LECTURE</span><h3>Ouverture</h3><footer><span>02:38</span><b>■</b></footer></article>
                            <article class="track-card" style="--track:#8b5cf6"><span class="track-number">2</span><div class="wave-line"></div><h3>Forêt — nuit</h3><footer><span>08:14</span><b>▶</b></footer></article>
                            <article class="track-card" style="--track:#8b5cf6"><span class="track-number">3</span><div class="wave-line alt"></div><h3>Orage lointain</h3><footer><span>03:20</span><b>▶</b></footer></article>
                            <article class="track-card" style="--track:#06b6d4"><span class="track-number">4</span><div class="wave-line short"></div><h3>Changement I</h3><footer><span>00:14</span><b>▶</b></footer></article>
                            <article class="track-card" style="--track:#22c55e"><span class="track-number">5</span><div class="wave-line alt"></div><h3>Bal masqué</h3><footer><span>04:09</span><b>▶</b></footer></article>
                            <article class="track-card" style="--track:#ec4899"><span class="track-number">6</span><div class="wave-line"></div><h3>Applaudissements</h3><footer><span>01:32</span><b>▶</b></footer></article>
                        </div>
                    </div>
                </div>
            </div>
            <div class="product-caption" data-reveal><span><i class="status-pulse"></i> Lecture locale, sans latence réseau</span><span>MP3 · WAV · OGG · FLAC · AAC</span></div>
        </div>
    </section>

    <section class="feature-section section" id="fonctionnalites">
        <div class="shell">
            <div class="section-heading split" data-reveal>
                <div><p class="eyebrow">Conçu pour le direct</p><h2>Fiable en répétition.<br><em>Imperturbable en scène.</em></h2></div>
                <p>SonoRiva transforme votre navigateur en régie complète, sans sacrifier la rapidité ni la précision d’un outil professionnel.</p>
            </div>
            <div class="feature-grid">
                <article class="feature-card feature-wide" data-reveal>
                    <div class="feature-icon accent"><span>▶</span></div>
                    <div><p class="card-kicker">Déclenchement immédiat</p><h3>Un geste. Le bon son.</h3><p>Clic, raccourci clavier ou télécommande : chaque action est instantanée et personnalisable par spectacle.</p></div>
                    <div class="cue-visual" aria-hidden="true"><span>1</span><i></i><span>2</span><i></i><span class="current">3<b>PLAY</b></span><i></i><span>4</span></div>
                </article>
                <article class="feature-card" data-reveal>
                    <div class="feature-icon violet"><span>⌁</span></div><p class="card-kicker">Toujours disponible</p><h3>Votre spectacle fonctionne hors connexion.</h3><p>Téléchargez un projet sur l’appareil. Les sons restent prêts, même si le Wi-Fi vous abandonne.</p><div class="offline-chip"><i></i> Projet disponible hors ligne</div>
                </article>
                <article class="feature-card" data-reveal>
                    <div class="feature-icon cyan"><span>⌁</span></div><p class="card-kicker">Pilotage à distance</p><h3>Une télécommande dans chaque poche.</h3><p>Contrôlez la régie depuis un téléphone connecté au même spectacle, en temps réel.</p><div class="remote-visual"><div><small>RÉGIE</small><b>En ligne</b></div><i>······</i><div><small>TÉLÉCOMMANDE</small><b>Connectée</b></div></div>
                </article>
                <article class="feature-card" data-reveal>
                    <div class="feature-icon green"><span>⇥</span></div><p class="card-kicker">Migration facile</p><h3>Vos projets SoundShow vous suivent.</h3><p>Importez un fichier <code>.ssp</code> avec ses catégories, couleurs, boucles et points de lecture.</p><div class="import-visual"><span>.SSP</span><i>→</i><b><img src="<?php echo esc_url($theme_uri . '/assets/images/sonoriva-mark.svg'); ?>" alt="" width="30" height="30"> Projet prêt</b></div>
                </article>
                <article class="feature-card" data-reveal>
                    <div class="feature-icon pink"><span>≋</span></div><p class="card-kicker">Édition précise</p><h3>Le son commence exactement où vous voulez.</h3><p>Zoomez sur la forme d’onde, placez vos points d’entrée et de sortie, puis réglez les fondus.</p><div class="editor-wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><span></span></div>
                </article>
            </div>
        </div>
    </section>

    <section class="usecases-section section" id="pour-qui">
        <div class="shell">
            <div class="section-heading centered" data-reveal><p class="eyebrow">Un outil, plusieurs scènes</p><h2>Vous créez l’instant.<br>SonoRiva tient le tempo.</h2></div>
            <div class="usecase-grid">
                <article data-reveal><span>01</span><h3>Théâtre & improvisation</h3><p>Ambiances, bruitages et musiques au bout des doigts, même quand le spectacle change en direct.</p><i>→</i></article>
                <article data-reveal><span>02</span><h3>Danse & performance</h3><p>Des enchaînements fluides, des fondus maîtrisés et une lecture fiable pour accompagner chaque mouvement.</p><i>→</i></article>
                <article data-reveal><span>03</span><h3>Événements & live</h3><p>Jingles, lancements et transitions organisés par séquences pour garder une longueur d’avance.</p><i>→</i></article>
            </div>
        </div>
    </section>

    <section class="workflow-section section">
        <div class="shell workflow-grid">
            <div class="workflow-copy" data-reveal><p class="eyebrow">Simple par nature</p><h2>De vos fichiers<br>à la scène en trois temps.</h2><p>Pas de manuel de cent pages. SonoRiva reprend les gestes évidents d’une régie et les rend plus rapides.</p><a class="inline-link" href="https://app.sonoriva.fr">Créer mon premier spectacle <span>→</span></a></div>
            <ol class="workflow-steps">
                <li data-reveal><span>01</span><div><h3>Créez votre spectacle</h3><p>Organisez votre espace par projet, catégorie et couleur.</p></div></li>
                <li data-reveal><span>02</span><div><h3>Déposez vos médias</h3><p>Importez vos fichiers ou retrouvez un son compatible sur Freesound.</p></div></li>
                <li data-reveal><span>03</span><div><h3>Jouez en confiance</h3><p>Préchargez hors ligne, branchez votre sortie audio et lancez le show.</p></div></li>
            </ol>
        </div>
    </section>

    <section class="pricing-section section" id="tarifs">
        <div class="shell">
            <div class="section-heading centered" data-reveal><p class="eyebrow">Un tarif simple et transparent</p><h2>Faire vivre SonoRiva,<br>sans faire grimper la note.</h2><p>L’abonnement sert essentiellement à couvrir les frais d’hébergement, de maintenance et de développement continu.</p></div>
            <?php echo do_blocks('<!-- wp:sonoriva/plans /-->'); ?>
        </div>
    </section>

    <section class="faq-section section" id="faq">
        <div class="shell faq-grid">
            <div data-reveal><p class="eyebrow">Questions fréquentes</p><h2>Avant de monter<br>le son.</h2><p>Une question qui n’est pas traitée ici peut être envoyée directement à l’équipe SonoRiva.</p><a class="inline-link" href="mailto:contact@sebastienj.com">Poser une question <span>↗</span></a></div>
            <div class="faq-list" data-reveal>
                <details open><summary>SonoRiva fonctionne-t-il vraiment sans Internet ?<span>＋</span></summary><p>Oui. Vous pouvez rendre un projet disponible hors ligne depuis l’application. Les médias sont alors lus localement par le navigateur.</p></details>
                <details><summary>Quels formats audio sont acceptés ?<span>＋</span></summary><p>SonoRiva prend en charge MP3, WAV, OGG, FLAC, M4A et AAC, avec des fichiers allant jusqu’à 250 Mo.</p></details>
                <details><summary>Puis-je importer mes anciens spectacles ?<span>＋</span></summary><p>Oui. L’import SoundShow récupère les catégories, couleurs, boucles, points d’entrée et de sortie depuis un projet <code>.ssp</code>.</p></details>
                <details><summary>Faut-il installer un logiciel ?<span>＋</span></summary><p>Non. SonoRiva fonctionne dans un navigateur moderne et peut être installé comme une application PWA sur votre ordinateur ou téléphone.</p></details>
                <details><summary>Que se passe-t-il à la fin de l’essai ?<span>＋</span></summary><p>L’espace passe en lecture seule jusqu’à l’activation d’un abonnement. Les projets et les sons restent accessibles.</p></details>
            </div>
        </div>
    </section>

    <section class="final-cta">
        <div class="cta-glow" aria-hidden="true"></div>
        <div class="shell final-cta-inner" data-reveal><p class="eyebrow">Votre prochain spectacle commence ici</p><h2>Prêt quand vous l’êtes.</h2><p>Créez votre régie, importez quelques sons et sentez immédiatement la différence.</p><div><a class="button button-light" href="https://app.sonoriva.fr">Ouvrir SonoRiva <span>↗</span></a><a class="button button-dark" href="https://app.sonoriva.fr/docs/">Lire la documentation</a></div></div>
    </section>
</main>
<?php get_footer(); ?>
