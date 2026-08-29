import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AudioOutputUpgradeConsole } from '../src/client/components/AudioOutputUpgradeConsole.js';

function renderUpgrade(mode: 'demo' | 'free' | 'trial' | 'restricted') {
  return renderToStaticMarkup(createElement(AudioOutputUpgradeConsole, { mode, onAction: () => undefined }));
}

describe('accès à la gestion des sorties audio', () => {
  it('adapte le bouton au forfait gratuit et à la démonstration', () => {
    expect(renderUpgrade('free')).toContain('Choisir un forfait');
    expect(renderUpgrade('demo')).toContain('Découvrir les forfaits');
  });

  it('indique que les sorties seront disponibles après la période d’essai', () => {
    const markup = renderUpgrade('trial');
    expect(markup).toContain('Gérer mon abonnement');
    expect(markup).toContain('après la période d’essai');
  });

  it('affiche la phrase et le bouton dans le module du header', () => {
    const markup = renderUpgrade('free');
    expect(markup).toContain('console-audio-upgrade');
    expect(markup).toContain('La gestion des sorties audio est réservée aux forfaits payants.');
    expect(markup).toContain('Choisir un forfait');
  });

  it('place le module de sortie avant le volume du son suivant', () => {
    const source = readFileSync(new URL('../src/client/App.tsx', import.meta.url), 'utf8');
    expect(source.indexOf('<AudioOutputUpgradeConsole')).toBeLessThan(source.indexOf('className="console-module next-volume"'));
    expect(source.indexOf('<AudioOutputConsole')).toBeLessThan(source.indexOf('className="console-module next-volume"'));
  });
});
