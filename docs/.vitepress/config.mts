import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitepress';

const packageMetadata = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { version: string };

export default defineConfig({
  lang: 'fr-FR',
  title: 'Documentation CueForge',
  description: 'CueForge — Play sound. Play the scene. Guides et documentation de la régie son web pensée pour la scène.',
  base: '/docs/',
  outDir: '../dist/client/docs',
  cleanUrls: false,
  lastUpdated: true,
  head: [
    ['link', { rel: 'icon', href: '/docs/cueforge-mark.svg', type: 'image/svg+xml' }],
    ['meta', { name: 'theme-color', content: '#09090b' }],
    ['meta', { property: 'og:locale', content: 'fr_FR' }],
  ],
  themeConfig: {
    logo: '/cueforge-mark.svg',
    siteTitle: 'CueForge · Documentation',
    nav: [
      { text: 'Premiers pas', link: '/premiers-pas/' },
      { text: 'Guides', link: '/guides/importer-des-sons' },
      { text: 'Dépannage', link: '/depannage/' },
      { text: 'Nouveautés', link: '/nouveautes/' },
      {
        text: `v${packageMetadata.version}`,
        items: [
          { text: 'Ouvrir CueForge', link: 'https://cueforge.sebastienj.com' },
          { text: 'Version Community', link: 'https://github.com/myconcretelab/cueforge' },
        ],
      },
    ],
    sidebar: [
      {
        text: 'Commencer',
        items: [
          { text: 'Bienvenue', link: '/' },
          { text: 'Prise en main', link: '/premiers-pas/' },
          { text: 'Premier spectacle', link: '/premiers-pas/premier-spectacle' },
        ],
      },
      {
        text: 'Guides pratiques',
        items: [
          { text: 'Importer des sons', link: '/guides/importer-des-sons' },
          { text: 'Organiser un spectacle', link: '/guides/organiser-un-spectacle' },
          { text: 'Préparer le mode hors ligne', link: '/guides/mode-hors-ligne' },
          { text: 'Utiliser la télécommande', link: '/guides/telecommande' },
        ],
      },
      {
        text: 'Référence',
        items: [
          { text: 'Formats et limites', link: '/reference/formats-et-limites' },
          { text: 'Raccourcis et commandes', link: '/reference/raccourcis' },
        ],
      },
      {
        text: 'Assistance',
        items: [
          { text: 'Dépannage', link: '/depannage/' },
          { text: 'Notes de version', link: '/nouveautes/' },
          { text: 'Installer Community', link: '/community/installation' },
        ],
      },
    ],
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: 'Rechercher', buttonAriaLabel: 'Rechercher dans la documentation' },
          modal: {
            noResultsText: 'Aucun résultat pour',
            resetButtonTitle: 'Effacer la recherche',
            footer: { selectText: 'sélectionner', navigateText: 'naviguer', closeText: 'fermer' },
          },
        },
      },
    },
    outline: { level: [2, 3], label: 'Sur cette page' },
    editLink: {
      pattern: 'https://github.com/myconcretelab/cueforge/edit/main/docs/:path',
      text: 'Proposer une amélioration',
    },
    lastUpdated: { text: 'Mis à jour le', formatOptions: { dateStyle: 'long' } },
    docFooter: { prev: 'Page précédente', next: 'Page suivante' },
    socialLinks: [{ icon: 'github', link: 'https://github.com/myconcretelab/cueforge' }],
    footer: {
      message: 'CueForge · Play sound. Play the scene.',
      copyright: 'Documentation de CueForge',
    },
  },
});
