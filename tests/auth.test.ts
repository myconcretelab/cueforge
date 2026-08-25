import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../src/server/services/auth.js';
import { passwordResetMessage } from '../src/server/services/mail.js';
import { createPasswordResetToken, hashPasswordResetToken, passwordResetLifetimeMs } from '../src/server/services/password-reset.js';
import { parseByteRange } from '../src/server/services/range.js';
import { evaluateStorageAllowance } from '../src/server/services/account-access.js';

describe('password hashing', () => {
  it('accepte le bon mot de passe et refuse les autres', async () => {
    const stored = await hashPassword('un-mot-de-passe-solide');
    expect(stored).not.toContain('un-mot-de-passe-solide');
    await expect(verifyPassword('un-mot-de-passe-solide', stored)).resolves.toBe(true);
    await expect(verifyPassword('mauvais-mot-de-passe', stored)).resolves.toBe(false);
  });

  it('produit des empreintes différentes grâce au sel', async () => {
    const first = await hashPassword('mot-de-passe-identique');
    const second = await hashPassword('mot-de-passe-identique');
    expect(first).not.toBe(second);
  });
});

describe('password reset', () => {
  it('crée un jeton aléatoire et ne conserve qu’une empreinte exploitable', () => {
    const now = new Date('2030-01-01T12:00:00Z');
    const first = createPasswordResetToken(now);
    const second = createPasswordResetToken(now);
    expect(first.token).not.toBe(second.token);
    expect(first.tokenHash).toBe(hashPasswordResetToken(first.token));
    expect(first.tokenHash).not.toContain(first.token);
    expect(first.expiresAt.getTime()).toBe(now.getTime() + passwordResetLifetimeMs);
  });

  it('échappe le nom affiché dans la version HTML de l’e-mail', () => {
    const message = passwordResetMessage('<script>alert(1)</script>', 'https://app.cueforge.fr/reset-password?token=abc');
    expect(message.html).not.toContain('<script>');
    expect(message.html).toContain('&lt;script&gt;');
    expect(message.text).toContain('expire dans 30 minutes');
  });
});

describe('HTTP byte ranges', () => {
  it('analyse une plage explicite', () => {
    expect(parseByteRange('bytes=100-199', 1000)).toEqual({ start: 100, end: 199 });
  });

  it('limite la fin à la taille du fichier', () => {
    expect(parseByteRange('bytes=900-1200', 1000)).toEqual({ start: 900, end: 999 });
  });

  it('prend en charge une plage suffixe', () => {
    expect(parseByteRange('bytes=-250', 1000)).toEqual({ start: 750, end: 999 });
  });

  it('refuse les plages impossibles', () => {
    expect(parseByteRange('bytes=1000-', 1000)).toBeNull();
    expect(parseByteRange('bytes=-', 1000)).toBeNull();
  });
});

describe('storage allowance', () => {
  const future = new Date('2030-01-15T00:00:00Z');
  const now = new Date('2030-01-01T00:00:00Z');

  it('autorise un abonnement actif sans quota', () => {
    expect(evaluateStorageAllowance({ accessStatus: 'active', trialEndsAt: null, storageQuotaBytes: null, usedBytes: 10_000, incomingBytes: 5_000, now })).toEqual({ allowed: true });
  });

  it('autorise un essai en cours dans la limite de stockage', () => {
    expect(evaluateStorageAllowance({ accessStatus: 'trialing', trialEndsAt: future, storageQuotaBytes: 20_000, usedBytes: 10_000, incomingBytes: 5_000, now })).toEqual({ allowed: true });
  });

  it('refuse un essai expiré', () => {
    expect(evaluateStorageAllowance({ accessStatus: 'trialing', trialEndsAt: now, storageQuotaBytes: 20_000, usedBytes: 0, incomingBytes: 1, now })).toEqual({ allowed: false, reason: 'read-only' });
  });

  it('refuse un fichier qui dépasserait le quota', () => {
    expect(evaluateStorageAllowance({ accessStatus: 'active', trialEndsAt: null, storageQuotaBytes: 20_000, usedBytes: 18_000, incomingBytes: 2_001, now })).toEqual({ allowed: false, reason: 'quota-exceeded' });
  });

  it('autorise les écritures pendant le délai de grâce', () => {
    expect(evaluateStorageAllowance({ accessStatus: 'grace_period', trialEndsAt: null, storageQuotaBytes: 20_000, usedBytes: 5_000, incomingBytes: 1_000, now })).toEqual({ allowed: true });
  });

  it('refuse les écritures pour un compte suspendu ou en lecture seule', () => {
    expect(evaluateStorageAllowance({ accessStatus: 'read_only', trialEndsAt: null, storageQuotaBytes: 20_000, usedBytes: 0, incomingBytes: 0, now })).toEqual({ allowed: false, reason: 'read-only' });
    expect(evaluateStorageAllowance({ accessStatus: 'suspended', trialEndsAt: null, storageQuotaBytes: 20_000, usedBytes: 0, incomingBytes: 0, now })).toEqual({ allowed: false, reason: 'read-only' });
  });
});
