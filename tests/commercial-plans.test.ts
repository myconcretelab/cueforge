import { describe, expect, it } from 'vitest';
import { planDeletionError } from '../src/server/services/commercial-plans.js';

describe('commercial plan deletion', () => {
  it('refuse la suppression du forfait par défaut', () => {
    expect(planDeletionError({ isDefault: true, accountCount: 0 })).toBe('Le forfait par défaut ne peut pas être supprimé.');
  });

  it('refuse la suppression d’un forfait attribué', () => {
    expect(planDeletionError({ isDefault: false, accountCount: 3 })).toBe('Ce forfait est encore attribué à un ou plusieurs comptes.');
  });

  it('autorise la suppression d’un forfait inutilisé', () => {
    expect(planDeletionError({ isDefault: false, accountCount: 0 })).toBeNull();
  });
});
