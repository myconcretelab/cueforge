<?php
/**
 * Helpers for preserving classic page copy while making it block-editable.
 *
 * @package SonoRiva_Marketing
 */

if (!defined('ABSPATH')) {
    exit;
}

function sonoriva_marketing_classic_content_to_blocks(string $content): string
{
    if (trim($content) === '' || str_contains($content, '<!-- wp:')) {
        return $content;
    }

    preg_match_all(
        '~<(h[1-6]|p)>(.*?)</\1>~is',
        $content,
        $matches,
        PREG_SET_ORDER | PREG_OFFSET_CAPTURE
    );
    if ($matches === []) {
        return $content;
    }

    $blocks = [];
    $offset = 0;
    foreach ($matches as $match) {
        $markup = $match[0][0];
        $position = $match[0][1];
        if (trim(substr($content, $offset, $position - $offset)) !== '') {
            return $content;
        }

        $tag = strtolower($match[1][0]);
        $inner = $match[2][0];
        if ($tag === 'p') {
            $blocks[] = "<!-- wp:paragraph -->\n<p>{$inner}</p>\n<!-- /wp:paragraph -->";
        } else {
            $level = (int) substr($tag, 1);
            $attributes = $level === 2 ? '' : ' {"level":' . $level . '}';
            $blocks[] = "<!-- wp:heading{$attributes} -->\n<{$tag} class=\"wp-block-heading\">{$inner}</{$tag}>\n<!-- /wp:heading -->";
        }
        $offset = $position + strlen($markup);
    }

    if (trim(substr($content, $offset)) !== '') {
        return $content;
    }
    return implode("\n\n", $blocks);
}
