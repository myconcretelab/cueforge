<?php
/**
 * Standard page template.
 *
 * @package SonoRiva_Marketing
 */
get_header();
?>
<main id="main" class="page-main">
    <div class="shell prose-shell">
        <?php while (have_posts()) : the_post(); ?>
            <article <?php post_class('content-card'); ?>>
                <p class="eyebrow">SonoRiva</p>
                <h1><?php the_title(); ?></h1>
                <div class="entry-content"><?php the_content(); ?></div>
            </article>
        <?php endwhile; ?>
    </div>
</main>
<?php get_footer(); ?>
