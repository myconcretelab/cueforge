export interface StorageAllowanceInput {
  accessStatus: string;
  trialEndsAt: Date | null;
  gracePeriodEndsAt: Date | null;
  storageQuotaBytes: number | null;
  usedBytes: number;
  incomingBytes: number;
  now?: Date;
}

export type StorageAllowance =
  | { allowed: true }
  | { allowed: false; reason: 'read-only' | 'quota-exceeded' };

export function evaluateStorageAllowance(input: StorageAllowanceInput): StorageAllowance {
  const now = input.now ?? new Date();
  const hasAccess = input.accessStatus === 'active'
    || (input.accessStatus === 'grace_period' && input.gracePeriodEndsAt !== null && input.gracePeriodEndsAt > now)
    || (input.accessStatus === 'trialing' && input.trialEndsAt !== null && input.trialEndsAt > now);
  if (!hasAccess) return { allowed: false, reason: 'read-only' };
  if (input.storageQuotaBytes !== null && input.usedBytes + input.incomingBytes > input.storageQuotaBytes) {
    return { allowed: false, reason: 'quota-exceeded' };
  }
  return { allowed: true };
}
