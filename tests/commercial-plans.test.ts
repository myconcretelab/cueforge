import { describe, expect, it } from 'vitest';
import { planDeletionError, planIsFree, planPublicationError } from '../src/server/services/commercial-plans.js';

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

describe('commercial plan publication', () => {
  it('refuse la mise en avant d’un forfait masqué', () => {
    expect(planPublicationError({ visibleOnWebsite: false, featuredOnWebsite: true })).toBe('Un forfait mis en avant doit être visible sur le site.');
  });

  it('autorise un forfait visible mis en avant', () => {
    expect(planPublicationError({ visibleOnWebsite: true, featuredOnWebsite: true })).toBeNull();
  });

  it('autorise un forfait actif réservé à une attribution interne', () => {
    expect(planPublicationError({ visibleOnWebsite: false, featuredOnWebsite: false })).toBeNull();
  });
});

describe('commercial free plan', () => {
  it('reconnaît un tarif mensuel nul sans tarif annuel', () => {
    expect(planIsFree({ monthlyPriceCents: 0, annualPriceCents: null })).toBe(true);
  });

  it('reconnaît deux périodicités gratuites', () => {
    expect(planIsFree({ monthlyPriceCents: 0, annualPriceCents: 0 })).toBe(true);
  });

  it('ne traite pas un forfait sans prix comme une offre gratuite publique', () => {
    expect(planIsFree({ monthlyPriceCents: null, annualPriceCents: null })).toBe(false);
  });

  it('ne traite pas un forfait comportant un prix payant comme gratuit', () => {
    expect(planIsFree({ monthlyPriceCents: 0, annualPriceCents: 2_500 })).toBe(false);
  });
});
