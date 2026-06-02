export const CacheTtls = {
  PROFILE_DETAIL: 300,
  PROFILE_LIST_USER: 60,
  PROFILE_LIST_ADMIN: 30,
  MY_PROFILES: 120,
  SHORTLISTED: 60,
  SHOWCASE: 1800,
  VERIFICATION_QUEUE: 15,
  VERIFICATION_STATS: 60,
  MEMBERSHIP_CAPS: 300,
  MEMBERSHIP_MINE: 300,
  AUTH_ME: 60,
  ANALYTICS_DASHBOARD: 300,
} as const;

export function buildProfileTag(profileId: string): string {
  return `profile:${profileId}`;
}

export function buildProfileListUserTag(accountId: string): string {
  return `profile-list:user:${accountId}`;
}

export function buildProfileListAdminTag(): string {
  return 'profile-list:admin';
}

export function buildMyProfilesTag(accountId: string): string {
  return `my-profiles:${accountId}`;
}

export function buildShortlistedTag(accountId: string): string {
  return `shortlisted:${accountId}`;
}

export function buildShowcaseTag(): string {
  return 'showcase';
}

export function buildVerificationQueueTag(): string {
  return 'verification-queue';
}

export function buildVerificationStatsTag(): string {
  return 'verification-stats';
}

export function buildMembershipCapsTag(accountId: string): string {
  return `membership-caps:${accountId}`;
}

export function buildMembershipMineTag(accountId: string): string {
  return `membership-mine:${accountId}`;
}

export function buildAuthMeTag(accountId: string): string {
  return `account:${accountId}:auth-me`;
}

export function buildAnalyticsDashboardTag(): string {
  return 'analytics-dashboard';
}
