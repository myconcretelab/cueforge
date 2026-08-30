import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AudioOutputConsole } from '../src/client/components/AudioOutputConsole.js';
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

  it('affiche la phrase et le bouton dans la réglette des sorties', () => {
    const markup = renderUpgrade('free');
    expect(markup).toContain('bridge-output-strip bridge-output-upgrade');
    expect(markup).toContain('La gestion des sorties audio est réservée aux forfaits payants.');
    expect(markup).toContain('Choisir un forfait');
  });

  it('place la réglette de sortie au-dessus du header et retire son ancien cadre', () => {
    const source = readFileSync(new URL('../src/client/App.tsx', import.meta.url), 'utf8');
    expect(source.indexOf('<AudioOutputUpgradeConsole')).toBeLessThan(source.indexOf('<header className="topbar">'));
    expect(source.indexOf('<AudioOutputConsole')).toBeLessThan(source.indexOf('<header className="topbar">'));
    expect(source.match(/<AudioOutputConsole/g)).toHaveLength(1);
  });

  it('regroupe le voyant et les commandes du Bridge dans la réglette', () => {
    const markup = renderToStaticMarkup(createElement(AudioOutputConsole, { bridgeAvailable: true, onError: () => undefined, onRoutingChange: () => undefined }));
    expect(markup).toContain('bridge-output-strip bridge-output-console');
    expect(markup).toContain('bridge-status-led');
    expect(markup).toContain('Actualiser l’état du Bridge');
  });
});
