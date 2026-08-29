import { describe, expect, it } from 'vitest';
import { checkoutTrialSettings, stripeAccessStatus } from '../src/server/services/billing.js';

describe('Stripe billing access projection', () => {
  it('projette les états qui autorisent les écritures', () => {
    expect(stripeAccessStatus('trialing', false)).toBe('trialing');
    expect(stripeAccessStatus('active', false)).toBe('active');
    expect(stripeAccessStatus('past_due', false)).toBe('grace_period');
  });

  it('passe en lecture seule après la fin effective de l’abonnement', () => {
    for (const status of ['canceled', 'unpaid', 'paused', 'incomplete', 'incomplete_expired'] as const) {
      expect(stripeAccessStatus(status, false)).toBe('read_only');
    }
  });

  it('préserve toujours une suspension administrative', () => {
    expect(stripeAccessStatus('active', true)).toBe('suspended');
    expect(stripeAccessStatus('trialing', true)).toBe('suspended');
  });
});

describe('Stripe checkout trial', () => {
  const now = new Date('2030-01-01T00:00:00Z');

  it('conserve la date de fin de l’essai déjà commencé dans SonoRiva', () => {
    const storedTrialEndsAt = new Date('2030-01-10T00:00:00Z');
    expect(checkoutTrialSettings({ storedTrialEndsAt, trialStartedAt: now, planTrialDays: 14, now }))
      .toEqual({ trial_end: Math.floor(storedTrialEndsAt.getTime() / 1000) });
  });

  it('ne recrée pas un essai consommé ou presque terminé', () => {
    expect(checkoutTrialSettings({
      storedTrialEndsAt: new Date('2030-01-02T00:00:00Z'),
      trialStartedAt: now,
      planTrialDays: 14,
      now,
    })).toEqual({});
  });

  it('accorde l’essai du forfait à un compte qui ne l’a jamais commencé', () => {
    expect(checkoutTrialSettings({ storedTrialEndsAt: null, trialStartedAt: null, planTrialDays: 14, now }))
      .toEqual({ trial_period_days: 14 });
  });

  it('n’ajoute aucun essai lorsque le forfait ne prévoit aucun jour gratuit', () => {
    expect(checkoutTrialSettings({ storedTrialEndsAt: null, trialStartedAt: null, planTrialDays: 0, now }))
      .toEqual({});
  });
});
