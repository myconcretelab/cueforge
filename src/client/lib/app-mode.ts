import type { User } from '../types';

export function appNoticesEnabled(user: Pick<User, 'isDemo'> | null | undefined): boolean {
  return Boolean(user && !user.isDemo);
}
