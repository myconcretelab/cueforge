export const supportTicketStatuses = ['open', 'awaiting_user', 'resolved', 'closed'] as const;
export const supportTicketPriorities = ['normal', 'high', 'urgent'] as const;

export type SupportTicketStatus = typeof supportTicketStatuses[number];
export type SupportTicketPriority = typeof supportTicketPriorities[number];
export type SupportAuthorKind = 'user' | 'admin';

export function supportStatusAfterMessage(authorKind: SupportAuthorKind): SupportTicketStatus {
  return authorKind === 'admin' ? 'awaiting_user' : 'open';
}

export function supportTicketStatusDates(status: SupportTicketStatus, now: Date) {
  return {
    resolvedAt: status === 'resolved' ? now : null,
    closedAt: status === 'closed' ? now : null,
  };
}
