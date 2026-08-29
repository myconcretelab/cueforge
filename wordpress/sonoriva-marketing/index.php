<?php
/**
 * Fallback template.
 *
 * @package SonoRiva_Marketing
 */
get_header();
?>
<main id="main" class="page-main">
    <div class="shell prose-shell">
        <?php if (have_posts()) : ?>
            <?php while (have_posts()) : the_post(); ?>
                <article <?php post_class('content-card'); ?>>
                    <p class="eyebrow">SonoRiva</p>
                    <h1><?php the_title(); ?></h1>
                    <div class="entry-content"><?php the_content(); ?></div>
                </article>
            <?php endwhile; ?>
        <?php else : ?>
            <article class="content-card"><h1>Contenu introuvable</h1><p>Cette page n’existe pas encore.</p></article>
        <?php endif; ?>
    </div>
</main>
<?php get_footer(); ?>
