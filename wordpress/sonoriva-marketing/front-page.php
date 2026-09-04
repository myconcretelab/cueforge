<?php
/**
 * Editable SonoRiva product landing page.
 *
 * The published page is stored as Gutenberg content. The bundled block pattern is
 * only used as a safe fallback while the database content is empty.
 *
 * @package SonoRiva_Marketing
 */

get_header();
?>
<main id="main" class="sr-landing">
    <?php
    while (have_posts()) {
        the_post();
        $content = trim((string) get_post_field('post_content', get_the_ID()));
        echo $content !== ''
            ? apply_filters('the_content', $content)
            : do_blocks(sonoriva_marketing_home_block_content());
    }
    ?>
</main>
<?php get_footer(); ?>
