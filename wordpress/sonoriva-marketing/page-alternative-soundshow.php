<?php
/**
 * Editable landing page: cloud alternative to SoundShow.
 *
 * The published page is stored as Gutenberg content. The bundled pattern is
 * only rendered while the database content is empty.
 *
 * @package SonoRiva_Marketing
 */

get_header();
?>
<main id="main" class="comparison-page">
    <?php
    while (have_posts()) {
        the_post();
        $content = trim((string) get_post_field('post_content', get_the_ID()));
        echo $content !== ''
            ? apply_filters('the_content', $content)
            : do_blocks(sonoriva_marketing_soundshow_block_content());
    }
    ?>
</main>
<?php get_footer(); ?>
