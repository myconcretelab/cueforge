<?php
/**
 * SonoRiva Marketing theme setup.
 *
 * @package SonoRiva_Marketing
 */

if (!defined('ABSPATH')) {
    exit;
}

function sonoriva_marketing_setup(): void
{
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('responsive-embeds');
    add_theme_support('html5', ['search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script']);
    register_nav_menus([
        'primary' => __('Navigation principale', 'sonoriva-marketing'),
        'footer' => __('Navigation de pied de page', 'sonoriva-marketing'),
    ]);
}
add_action('after_setup_theme', 'sonoriva_marketing_setup');

function sonoriva_marketing_assets(): void
{
    $theme = wp_get_theme();
    $version = $theme->get('Version') ?: '1.0.0';
    wp_enqueue_style('sonoriva-marketing', get_stylesheet_uri(), [], $version);
    wp_enqueue_script(
        'sonoriva-marketing',
        get_template_directory_uri() . '/assets/js/site.js',
        [],
        $version,
        true
    );
}
add_action('wp_enqueue_scripts', 'sonoriva_marketing_assets');

function sonoriva_marketing_document_title(string $title): string
{
    if (is_front_page()) {
        return 'SonoRiva — Régie son web, Freesound et multi-sorties audio';
    }
    return $title;
}
add_filter('pre_get_document_title', 'sonoriva_marketing_document_title');

function sonoriva_marketing_description(): void
{
    if (is_front_page()) {
        echo '<meta name="description" content="SonoRiva réunit soundboard, recherche Freesound, multi-lecture, sorties audio, cues, catégories et import SoundShow dans une régie son web.">' . "\n";
        echo '<meta name="theme-color" content="#09090b">' . "\n";
        echo '<meta property="og:title" content="SonoRiva — Tous vos sons, toutes vos sorties, un seul geste.">' . "\n";
        echo '<meta property="og:description" content="La régie son web avec Freesound intégré, multi-lecture, sorties audio, cues et import SoundShow.">' . "\n";
        echo '<meta property="og:type" content="website">' . "\n";
    }
}
add_action('wp_head', 'sonoriva_marketing_description', 1);

function sonoriva_marketing_body_classes(array $classes): array
{
    $classes[] = 'sonoriva-site';
    return $classes;
}
add_filter('body_class', 'sonoriva_marketing_body_classes');

function sonoriva_marketing_site_icon(): string
{
    return get_template_directory_uri() . '/assets/images/sonoriva-site-icon.png';
}
add_filter('get_site_icon_url', 'sonoriva_marketing_site_icon');
