import type { QueueItem, AuditTrail, QueueStats, StateHistoryEntry, ReviewEntry, QueueInfo } from '@/types/admin-types';

export function toQueueItem(raw: any): QueueItem {
  return {
    id: raw.id ?? '',
    regNo: raw.regNo ?? raw.id ?? '',
    status: raw.status ?? 'PENDING',
    firstNameEn: raw.firstNameEn ?? null,
    lastNameEn: raw.lastNameEn ?? null,
    firstNameTa: raw.firstNameTa ?? null,
    lastNameTa: raw.lastNameTa ?? null,
    name: raw.name ?? null,
    createdByEn: raw.createdByEn ?? null,
    createdByTa: raw.createdByTa ?? null,
    community: raw.community ?? null,
    caste: raw.caste ?? null,
    kulam: raw.kulam ?? null,
    kuladeivamEn: raw.kuladeivamEn ?? null,
    kuladeivamTa: raw.kuladeivamTa ?? null,
    age: raw.age ?? null,
    dob: raw.dob ?? null,
    gender: raw.gender ?? null,
    education: raw.education ?? null,
    jobDetail: raw.jobDetail ?? null,
    profilePhoto: raw.profilePhoto ?? null,
    photo: raw.photo ?? null,
    createdAt: raw.createdAt ?? '',
    submittedAt: raw.submittedAt ?? raw.createdAt ?? '',
    claimedBy: raw.claimedBy ?? null,
    currentDistrictEn: raw.currentDistrictEn ?? null,
    currentDistrict: raw.currentDistrict ?? null,
    currentDistrictTa: raw.currentDistrictTa ?? null,
    currentTaluk: raw.currentTaluk ?? null,
    currentTalukTa: raw.currentTalukTa ?? null,
    currentCityEn: raw.currentCityEn ?? null,
    currentCityTa: raw.currentCityTa ?? null,
    currentStateEn: raw.currentStateEn ?? null,
    currentStateTa: raw.currentStateTa ?? null,
    currentCountryEn: raw.currentCountryEn ?? null,
    currentCountryTa: raw.currentCountryTa ?? null,
    nativeDistrictEn: raw.nativeDistrictEn ?? null,
    nativeDistrict: raw.nativeDistrict ?? null,
    nativeDistrictTa: raw.nativeDistrictTa ?? null,
    nativeTaluk: raw.nativeTaluk ?? null,
    nativeCityEn: raw.nativeCityEn ?? null,
    nativeCityTa: raw.nativeCityTa ?? null,
    nativeStateEn: raw.nativeStateEn ?? null,
    nativeStateTa: raw.nativeStateTa ?? null,
    nativeCountryEn: raw.nativeCountryEn ?? null,
    nativeCountryTa: raw.nativeCountryTa ?? null,
  };
}

export function toAuditTrail(raw: any): AuditTrail {
  return {
    stateHistory: (raw.stateHistory ?? []).map(toStateHistoryEntry),
    reviews: (raw.reviews ?? []).map(toReviewEntry),
    queue: raw.queue ? toQueueInfo(raw.queue) : null,
  };
}

export function toStateHistoryEntry(raw: any): StateHistoryEntry {
  return {
    from: raw.from ?? '',
    to: raw.to ?? '',
    changedBy: raw.changedBy ?? 'System',
    changedAt: raw.changedAt ?? '',
    reason: raw.reason ?? null,
  };
}

export function toReviewEntry(raw: any): ReviewEntry {
  return {
    verifierName: raw.verifierName ?? 'Unknown',
    decision: raw.decision ?? '',
    comment: raw.comment ?? null,
    createdAt: raw.createdAt ?? '',
  };
}

export function toQueueInfo(raw: any): QueueInfo {
  return {
    assignedTo: raw.assignedTo ?? null,
    priority: raw.priority ?? null,
    createdAt: raw.createdAt ?? null,
    completedAt: raw.completedAt ?? null,
  };
}

export function toQueueStats(raw: any): QueueStats {
  return {
    pendingTotal: raw.pendingTotal ?? 0,
    pendingToday: raw.pendingToday ?? 0,
    approvedToday: raw.approvedToday ?? 0,
    rejectedToday: raw.rejectedToday ?? 0,
    avgReviewTimeHours: raw.avgReviewTimeHours ?? 0,
  };
}
