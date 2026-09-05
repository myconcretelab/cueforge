import { describe, expect, it } from 'vitest';
import { supportStatusAfterMessage, supportTicketStatusDates } from '../src/server/services/support.js';

describe('support ticket state', () => {
  it('routes each new message to the person expected to answer next', () => {
    expect(supportStatusAfterMessage('user')).toBe('open');
    expect(supportStatusAfterMessage('admin')).toBe('awaiting_user');
  });

  it('keeps only the timestamp matching a terminal status', () => {
    const now = new Date('2026-09-05T12:00:00.000Z');
    expect(supportTicketStatusDates('resolved', now)).toEqual({ resolvedAt: now, closedAt: null });
    expect(supportTicketStatusDates('closed', now)).toEqual({ resolvedAt: null, closedAt: now });
    expect(supportTicketStatusDates('open', now)).toEqual({ resolvedAt: null, closedAt: null });
  });
});
