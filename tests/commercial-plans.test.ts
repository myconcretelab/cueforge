import { describe, expect, it } from 'vitest';
import { accountCanUseBridge, planDeletionError, planFeatures, planIncludesBridge, planIsFree, planPublicationError, projectLimitReached } from '../src/server/services/commercial-plans.js';

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

describe('SonoRiva Bridge entitlement', () => {
  it('inclut le bridge dans un forfait comportant un prix payant', () => {
    expect(planIncludesBridge({ monthlyPriceCents: 300, annualPriceCents: 2_500 })).toBe(true);
  });

  it('exclut le bridge d’un forfait gratuit', () => {
    expect(planIncludesBridge({ monthlyPriceCents: 0, annualPriceCents: 0 })).toBe(false);
  });

  it('exclut le bridge d’un forfait sans prix commercial', () => {
    expect(planIncludesBridge({ monthlyPriceCents: null, annualPriceCents: null })).toBe(false);
  });

  it.each(['active', 'grace_period'])('autorise un forfait payant dans l’état %s', (accessStatus) => {
    expect(accountCanUseBridge({ monthlyPriceCents: 300, annualPriceCents: null, accessStatus, isDemo: false })).toBe(true);
  });

  it.each([
    { monthlyPriceCents: 0, annualPriceCents: 0, accessStatus: 'active', isDemo: false },
    { monthlyPriceCents: 300, annualPriceCents: null, accessStatus: 'trialing', isDemo: false },
    { monthlyPriceCents: 300, annualPriceCents: null, accessStatus: 'read_only', isDemo: false },
    { monthlyPriceCents: 300, annualPriceCents: null, accessStatus: 'suspended', isDemo: false },
    { monthlyPriceCents: 300, annualPriceCents: null, accessStatus: 'active', isDemo: true },
  ])('refuse un compte sans droit Bridge', (input) => {
    expect(accountCanUseBridge(input)).toBe(false);
  });
});

describe('commercial plan features', () => {
  const configuredPlan = {
    customLayoutsEnabled: false,
    playlistsEnabled: true,
    remoteControlEnabled: false,
    maxProjects: 3,
  };

  it('expose les droits configurés sur le forfait', () => {
    expect(planFeatures(configuredPlan)).toEqual({
      customLayouts: false,
      playlists: true,
      remoteControl: false,
      maxProjects: 3,
    });
  });

  it('laisse toutes les fonctions disponibles dans la démonstration', () => {
    expect(planFeatures(configuredPlan, true)).toEqual({
      customLayouts: true,
      playlists: true,
      remoteControl: true,
      maxProjects: null,
    });
  });

  it('atteint une limite de spectacles sans dépasser la valeur configurée', () => {
    expect(projectLimitReached(3, 2)).toBe(false);
    expect(projectLimitReached(3, 3)).toBe(true);
    expect(projectLimitReached(null, 10_000)).toBe(false);
  });
});
