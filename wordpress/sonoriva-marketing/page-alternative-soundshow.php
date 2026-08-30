<?php
/**
 * Landing page: cloud alternative to SoundShow.
 *
 * @package SonoRiva_Marketing
 */
get_header();
$theme_uri = get_template_directory_uri();
?>
<main id="main" class="comparison-page">
    <section class="comparison-hero">
        <div class="product-hero-glow" aria-hidden="true"></div>
        <div class="shell comparison-hero-grid">
            <div class="comparison-hero-copy" data-reveal>
                <nav class="breadcrumbs" aria-label="Fil d’Ariane"><a href="<?php echo esc_url(home_url('/')); ?>">Accueil</a><span>→</span><span>Alternative à SoundShow</span></nav>
                <p class="eyebrow">Alternative cloud à SoundShow</p>
                <h1>Votre régie SoundShow.<br><em>Accessible dans le cloud.</em></h1>
                <p>SonoRiva est une régie son en ligne pour le théâtre et le spectacle vivant. Elle importe les projets <code>.ssp</code>, stocke les sons avec le spectacle et ouvre la régie depuis un navigateur.</p>
                <div class="hero-actions">
                    <a class="button button-primary" href="https://app.sonoriva.fr/demo">Tester SonoRiva <span aria-hidden="true">↗</span></a>
                    <a class="button button-ghost" href="#comparatif">Comparer les approches <span aria-hidden="true">↓</span></a>
                </div>
                <p class="comparison-disclaimer">SoundShow et SonoRiva sont deux produits indépendants. Cette page décrit leurs modes d’utilisation respectifs et les possibilités d’import disponibles dans SonoRiva.</p>
            </div>
            <figure class="product-shot comparison-hero-shot" data-reveal>
                <div class="product-shot-bar" aria-hidden="true"><span><i></i><i></i><i></i></span><strong>SonoRiva dans le navigateur</strong><em>Capture réelle</em></div>
                <div class="product-shot-crop product-shot-crop-comparison"><img src="<?php echo esc_url($theme_uri . '/assets/images/app-dashboard.png'); ?>" alt="Soundboard de la régie son cloud SonoRiva dans un navigateur" width="1600" height="1050" fetchpriority="high"></div>
            </figure>
        </div>
    </section>

    <section class="comparison-intro section">
        <div class="shell comparison-intro-grid">
            <div data-reveal><p class="eyebrow">Ce que change le cloud</p><h2>Le spectacle n’est plus lié à une seule installation.</h2></div>
            <div class="comparison-benefits">
                <article data-reveal><span>01</span><h3>Projet associé au compte</h3><p>Les catégories, réglages et médias du spectacle sont enregistrés dans SonoRiva et retrouvés après connexion.</p></article>
                <article data-reveal><span>02</span><h3>Ouverture dans le navigateur</h3><p>La régie web fonctionne sans installation initiale et peut aussi être installée comme PWA.</p></article>
                <article data-reveal><span>03</span><h3>Lecture hors ligne</h3><p>Les catégories choisies peuvent être chargées sur l’appareil pour une lecture locale sans connexion réseau.</p></article>
                <article data-reveal><span>04</span><h3>Multi-sorties avec Bridge</h3><p>Sur macOS et Windows, SonoRiva Bridge relie l’interface cloud aux sorties audio physiques de la régie.</p></article>
            </div>
        </div>
    </section>

    <section class="comparison-table-section section" id="comparatif">
        <div class="shell">
            <div class="section-heading centered" data-reveal><p class="eyebrow">SoundShow ou SonoRiva</p><h2>Deux régies visuelles.<br>Deux architectures différentes.</h2><p>SoundShow est une application de bureau pour Windows, macOS et Linux. SonoRiva place les projets dans une application web, avec un composant desktop uniquement pour les sorties audio avancées.</p></div>
            <div class="comparison-table-wrap" data-reveal>
                <table class="comparison-table">
                    <thead><tr><th scope="col">Usage</th><th scope="col">SoundShow</th><th scope="col" class="sonoriva-column">SonoRiva</th></tr></thead>
                    <tbody>
                        <tr><th scope="row">Accès à la régie</th><td>Application installée sur Windows, macOS ou Linux</td><td>Application web dans le navigateur et PWA</td></tr>
                        <tr><th scope="row">Emplacement du projet</th><td>Fichier de projet exportable ou transférable</td><td>Projet et médias associés au compte cloud</td></tr>
                        <tr><th scope="row">Freesound</th><td>Recherche et ajout intégrés</td><td>Recherche, préécoute, filtres, attribution et ajout intégrés</td></tr>
                        <tr><th scope="row">Lecture simultanée</th><td>Plusieurs lecteurs et instances</td><td>Plusieurs lectures actives dans la colonne de régie</td></tr>
                        <tr><th scope="row">Sorties audio</th><td>Routage depuis l’application de bureau</td><td>Routage coloré par son avec SonoRiva Bridge</td></tr>
                        <tr><th scope="row">Utilisation sans Internet</th><td>Projet et médias locaux</td><td>Catégories chargées localement dans la PWA</td></tr>
                        <tr><th scope="row">Passage vers SonoRiva</th><td>Export du projet <code>.ssp</code></td><td>Import du <code>.ssp</code> et des médias associés</td></tr>
                    </tbody>
                </table>
            </div>
            <p class="comparison-source-note" data-reveal>Comparaison fonctionnelle fondée sur les informations publiques de SoundShow et sur la version actuelle de SonoRiva. Les fonctions des deux logiciels peuvent évoluer.</p>
        </div>
    </section>

    <section class="migration-section section">
        <div class="shell migration-grid">
            <div class="migration-copy" data-reveal>
                <p class="eyebrow">Import SoundShow</p>
                <h2>Le fichier <code>.ssp</code> devient un projet cloud.</h2>
                <p>L’import analyse le projet, recherche les médias disponibles et recrée les éléments audio compatibles dans un nouveau spectacle SonoRiva.</p>
                <a class="inline-link" href="https://app.sonoriva.fr/docs/guides/importer-des-sons">Voir le fonctionnement de l’import <span>↗</span></a>
            </div>
            <ol class="migration-steps">
                <li data-reveal><span>01</span><div><h3>Sélection du dossier</h3><p>SonoRiva repère le fichier <code>.ssp</code>, ses sous-dossiers et les médias audio présents.</p></div></li>
                <li data-reveal><span>02</span><div><h3>Analyse avant import</h3><p>L’écran récapitule les catégories, les fichiers locaux, les sources Freesound reconnues et les médias manquants.</p></div></li>
                <li data-reveal><span>03</span><div><h3>Création du spectacle</h3><p>Les catégories, couleurs, boucles, points d’entrée et de sortie, fondus et métadonnées compatibles sont recréés.</p></div></li>
            </ol>
        </div>
    </section>

    <section class="migration-scope section">
        <div class="shell migration-scope-grid">
            <article data-reveal><p class="card-kicker">Repris par l’import</p><h2>La structure audio utile à la régie.</h2><ul class="check-list"><li>Catégories et ordre des sons</li><li>Couleurs et titres</li><li>Points de début et de fin</li><li>Boucles et fondus</li><li>Fichiers locaux retrouvés</li><li>Sources Freesound compatibles</li></ul></article>
            <article data-reveal><p class="card-kicker">Périmètre</p><h2>Un import centré sur le son.</h2><p>SonoRiva ne reproduit pas les modules vidéo, éclairage, MIDI, Stream Deck ou effets audio de SoundShow. Les éléments absents ou non compatibles sont signalés pendant l’analyse et restent à compléter séparément.</p></article>
        </div>
    </section>

    <section class="faq-section section">
        <div class="shell faq-grid">
            <div data-reveal><p class="eyebrow">Questions sur la migration</p><h2>Passer de SoundShow à SonoRiva.</h2><p>L’import peut être testé depuis la démo ou depuis un espace SonoRiva.</p></div>
            <div class="faq-list" data-reveal>
                <details open><summary>SonoRiva remplace-t-il entièrement SoundShow&nbsp;?<span>＋</span></summary><p>Les deux applications couvrent la lecture et l’organisation de sons, mais leur périmètre diffère. SonoRiva se concentre sur la régie audio cloud, le fonctionnement dans le navigateur, le hors-ligne et le routage avec Bridge.</p></details>
                <details><summary>Faut-il envoyer tous les sons un par un&nbsp;?<span>＋</span></summary><p>Non. La sélection d’un dossier permet d’analyser ensemble le fichier <code>.ssp</code>, les sous-dossiers et les médias disponibles.</p></details>
                <details><summary>Que deviennent les sons Freesound du projet&nbsp;?<span>＋</span></summary><p>Les sources distantes compatibles sont reconnues pendant l’analyse. Leur disponibilité et leur licence sont conservées dans les informations du son importé.</p></details>
                <details><summary>Le spectacle fonctionne-t-il ensuite hors ligne&nbsp;?<span>＋</span></summary><p>Oui. Après l’import, les catégories nécessaires peuvent être rendues disponibles hors ligne depuis SonoRiva.</p></details>
            </div>
        </div>
    </section>

    <section class="final-cta">
        <div class="cta-glow" aria-hidden="true"></div>
        <div class="shell final-cta-inner" data-reveal><p class="eyebrow">Test sans compte</p><h2>Ouvrez la régie cloud.</h2><p>La démo donne accès au vrai soundboard, à la recherche Freesound et aux réglages des sons.</p><div><a class="button button-light" href="https://app.sonoriva.fr/demo">Tester SonoRiva <span>↗</span></a><a class="button button-dark" href="<?php echo esc_url(home_url('/#fonctionnalites')); ?>">Voir toutes les fonctionnalités</a></div></div>
    </section>
</main>
<?php get_footer(); ?>
