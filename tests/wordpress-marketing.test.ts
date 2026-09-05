import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const themeFile = (path: string) => readFileSync(new URL(`../wordpress/sonoriva-marketing/${path}`, import.meta.url), 'utf8');

describe('site de présentation WordPress', () => {
  it('applique le bleu clair du logo à tous les fonds de page hors héros', () => {
    const styles = themeFile('style.css');
    const editorStyles = themeFile('assets/css/editor.css');

    expect(styles).toContain('--page-blue: #DBEDF7');
    expect(styles).toContain('.sr-landing .sr-section:not(.sr-hero)');
    expect(styles).toContain('.comparison-page > :not(.comparison-hero)');
    expect(styles).toContain('.page-main {');
    expect(styles).toContain('.site-footer {');
    expect(styles).toContain('.sr-hero {');
    expect(styles).toContain('background: #384661;');
    expect(styles).toContain(':is(.sr-offline-panel, .sr-layout-diagram, .sr-remote-diagram, .sr-routing)');
    expect(editorStyles).toContain('background: #DBEDF7');
    expect(editorStyles).toContain('.editor-styles-wrapper .sr-hero');
  });

  it('rend les pages éditables sans remplacer un contenu déjà publié', () => {
    const homepage = themeFile('front-page.php');
    const standardPage = themeFile('page.php');
    const comparisonPage = themeFile('page-alternative-soundshow.php');
    const comparisonBlocks = themeFile('inc/soundshow-content.php');
    const functions = themeFile('functions.php');
    const deploy = readFileSync(new URL('../scripts/deploy-wordpress-plans.sh', import.meta.url), 'utf8');

    expect(homepage).toContain("apply_filters('the_content', $content)");
    expect(standardPage).toContain('the_content()');
    expect(comparisonPage).toContain("apply_filters('the_content', $content)");
    expect(comparisonPage).toContain('sonoriva_marketing_soundshow_block_content()');
    expect(comparisonBlocks.match(/<!-- wp:/g)?.length).toBeGreaterThan(30);
    expect(functions).toContain("register_block_pattern('sonoriva/alternative-soundshow'");
    expect(deploy).toContain("post_content) === ''");
    expect(deploy).toContain('sonoriva_marketing_classic_content_to_blocks');
    expect(deploy).toContain('!has_blocks');
  });
});
