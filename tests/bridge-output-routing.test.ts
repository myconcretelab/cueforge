import { describe, expect, it } from 'vitest';
import { playbackBridgeOutput, routableBridgeOutputs, supportsPerPlaybackOutput } from '../src/client/lib/bridge-output-routing.js';
import type { BridgeOutput, BridgeStatus } from '../src/client/lib/bridge-client.js';

const outputs: BridgeOutput[] = [
  { id: 'default', name: 'Sortie système par défaut', isDefault: true },
  { id: 'speakers', name: 'Haut-parleurs', isDefault: true },
  { id: 'usb', name: 'Jean Luc', isDefault: false },
];

describe('routage des sorties Bridge', () => {
  it('active le routage par lecture uniquement lorsque le Bridge l’annonce', () => {
    const status = { capabilities: ['perPlaybackOutput'] } as BridgeStatus;
    expect(supportsPerPlaybackOutput(status)).toBe(true);
    expect(supportsPerPlaybackOutput({} as BridgeStatus)).toBe(false);
  });

  it('retire l’alias système et attribue une couleur à chaque sortie physique', () => {
    const routed = routableBridgeOutputs(outputs, true);
    expect(routed.map(({ id }) => id)).toEqual(['speakers', 'usb']);
    expect(new Set(routed.map(({ color }) => color)).size).toBe(2);
  });

  it('masque les commandes avec une seule sortie physique ou un Bridge incompatible', () => {
    expect(routableBridgeOutputs(outputs.slice(0, 2), true)).toEqual([]);
    expect(routableBridgeOutputs(outputs, false)).toEqual([]);
  });

  it('associe l’alias par défaut à la sortie physique par défaut', () => {
    const routed = routableBridgeOutputs(outputs, true);
    expect(playbackBridgeOutput(routed, 'default')?.id).toBe('speakers');
    expect(playbackBridgeOutput(routed, 'usb')?.name).toBe('Jean Luc');
  });
});
