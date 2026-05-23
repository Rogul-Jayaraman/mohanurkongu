/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */

import type { LoginData, SignupData } from '@/utils/validation';

// ─── Auth ───────────────────────────────────────────────

export async function stubLogin(data: LoginData) {
  return { success: true, data: { token: 'mock-token', user: { id: '1', role: 'USER', customId: '', firstNameEn: '', lastNameEn: '', email: data.identifier, phone: '', plan: 'BASIC', planExpiry: null, createdAt: '', updatedAt: '' } } };
}

export async function stubAdminLogin(data: LoginData) {
  return { success: true, data: { token: 'mock-token', user: { id: '1', role: 'ADMIN', customId: '', firstNameEn: '', lastNameEn: '', firstNameTa: '', lastNameTa: '', email: data.identifier, phone: '', createdAt: '' } } };
}

export async function stubSignup(data: SignupData) {
  return { success: true, data: { message: 'Signup successful' } };
}

export async function stubSendRegistrationOtp(email: string) {
  return { success: true };
}

export async function stubVerifyRegistrationOtp(data: { email: string; otp: string }) {
  return { success: true, data: { verificationToken: 'mock-verification-token' } };
}

export async function stubForgotPassword(email: string) {
  return { success: true };
}

export async function stubResetPassword(data: { email: string; otp: string; password: string }) {
  return { success: true };
}

// ─── User Profiles ─────────────────────────────────────

export async function stubFetchMyProfiles(): Promise<any[]> {
  return [];
}

export async function stubFetchProfile(id: string): Promise<any> {
  return null;
}

export async function stubToggleProfileStatus(args: { id: string; status: string }) {}

export async function stubDeleteProfile(id: string) {}

export async function stubSaveDraft(payload: any) {
  return { data: { draftId: 'mock-draft-id' } };
}

export async function stubFetchDraft(id: string): Promise<any> {
  return null;
}

export async function stubPublishProfile(id: string) {}

export async function stubCancelDraft(id: string) {}

export async function stubUploadImage(args: { id: string; type: string; file: File; index?: number }) {
  return { data: { url: URL.createObjectURL(args.file) } };
}

export async function stubDeleteImage(args: { id: string; type: string; index?: number }) {}

export async function stubGenerateHoroscope(args: any) {
  return { summary: { locationName: args.location?.displayName || '' }, input: { location: { latitude: args.location?.latitude || 0, longitude: args.location?.longitude || 0 } }, meta: { timezone: 'UTC', ayanamsa: 0 } };
}

export async function stubToggleShortlist(args: { profileId: string }) {}

export async function stubFetchPremiumPrice() {
  return 0;
}

export async function stubFetchPurchaseHistory(): Promise<any[]> {
  return [];
}

// ─── Admin – Matrimony ─────────────────────────────────

export async function stubFetchAdminAccounts(params: { page: number; search?: string }) {
  return { accounts: [], meta: { total: 0, totalPages: 1, page: 1, limit: 10 } };
}

export async function stubSuspendAccount(args: { id: string; data: { reasonEn: string; reasonTa: string } }) {}

export async function stubRevokeAccount(id: string) {}

export async function stubFetchAdminProfiles(params: { page: number; search?: string; status?: string; limit?: number }) {
  return { profiles: [], meta: { total: 0, totalPages: 1, page: 1, limit: params.limit || 10 } };
}

export async function stubVerifyProfile(args: { id: string; data: { status: string; reasonEn?: string; reasonTa?: string } }) {}

export async function stubBlockProfile(args: { id: string; data: { reasonEn: string; reasonTa: string } }) {}

export async function stubSuspendProfile(args: { id: string; data: { reasonEn: string; reasonTa: string } }) {}

export async function stubFetchAdminProfileDetail(id: string): Promise<any> {
  return null;
}

export async function stubFetchVerificationQueue() {
  return { profiles: [] };
}

// ─── Admin – Analytics ─────────────────────────────────

export async function stubFetchAnalyticsData() {
  return { matrimony: { total: 0, verified: 0, premium: 0 }, revenue: { trends: { matrimony: [], mandapam: [] }, highlights: { matrimony: 0, bookings: 0 } }, bookings: { total: 0, trend: [], slots_utilization: [] }, users: { total: 0, newThisMonth: 0 }, distributions: { gender: [], district: [], plan: { basic: 0, premium: 0 } }, funnels: { matrimony: [], booking: [] }, packages: { distribution: [] }, topPackages: [], recentActivity: [] };
}

export async function stubFetchBasicStats() {
  return { totalUsers: 0, totalProfiles: 0, totalBookings: 0, totalRevenue: 0, recentUsers: 0, pendingVerifications: 0, matrimony: { total: 0, verified: 0, premium: 0 }, mandapam: { total: 0, completed: 0 }, revenue: { matrimony: 0, mandapam: 0 } };
}

export async function stubFetchAdminStats() {
  return { stats: { totalUsers: 0, totalProfiles: 0, totalBookings: 0, totalRevenue: 0, newUsers: 0, pendingVerifications: 0 }, recentBookings: [] };
}

// ─── Admin – Mandapam ──────────────────────────────────

export async function stubFetchPackages(): Promise<any[]> {
  return [];
}

export async function stubTogglePackageStatus(args: { id: string; isActive: boolean }) {}

export async function stubFetchCalendarData(): Promise<any[]> {
  return [];
}

export async function stubBlockDate(args: any) {}

export async function stubUnblockDate(date: string) {}

export async function stubFetchBookingsByDate(date: string): Promise<any[]> {
  return [];
}

export async function stubFetchBlockedDetails(date: string): Promise<any> {
  return null;
}

export async function stubFetchBookings(params: { search?: string; status?: string }): Promise<any[]> {
  return [];
}

export async function stubUpdateBooking(args: { id: string; data: any }) {}

export async function stubAddPayment(args: { bookingId: string; data: { amount: number; paymentMethod: string } }) {}

export async function stubDeleteBooking(id: string) {}

export async function stubCreateBooking(data: any) {}
