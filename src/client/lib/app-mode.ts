import type { User } from '../types';

export function appNoticesEnabled(user: Pick<User, 'isDemo'> | null | undefined): boolean {
  return Boolean(user && !user.isDemo);
}

export function shouldApplyAppUpdate(input: {
  automaticUpdates: boolean;
  updateAvailable: boolean;
  activePlaybackCount: number;
}): boolean {
  return input.automaticUpdates && input.updateAvailable && input.activePlaybackCount === 0;
}

export function shouldOpenReleaseNotes(input: {
  noticesEnabled: boolean;
  automaticUpdates: boolean;
  unseenReleaseCount: number;
  activePlaybackCount: number;
  alreadyOpened: boolean;
}): boolean {
  return input.noticesEnabled
    && !input.automaticUpdates
    && input.unseenReleaseCount > 0
    && input.activePlaybackCount === 0
    && !input.alreadyOpened;
}
