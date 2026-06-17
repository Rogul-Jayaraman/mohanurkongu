import api from '../lib/api';
import { publicApi } from '../lib/publicApi';
import type { MandapamPackage, MandapamFacility, MandapamAddon, TranslationPair, Booking, CalendarEntry } from '../types/mandapam';

// ── Admin Packages ──

export function adminGetAllPackages(): Promise<{ packages: MandapamPackage[] }> {
  return api.get('/admin/mandapam/packages');
}

export function adminGetPackageById(id: string): Promise<{ package: MandapamPackage }> {
  return api.get(`/admin/mandapam/packages/${id}`);
}

export interface UpdatePackageDto {
  displayName?: TranslationPair[];
  functions?: {
    id?: string;
    name: TranslationPair[];
    status?: boolean;
  }[];
  pricing?: {
    amount?: number;
    currencyCode?: string;
    isActive?: boolean;
  };
  status?: boolean;
}

export function adminUpdatePackage(id: string, dto: UpdatePackageDto): Promise<{ package: MandapamPackage }> {
  return api.patch(`/admin/mandapam/packages/${id}`, dto);
}

export function adminDeletePackageFunction(packageId: string, functionId: string): Promise<{ deleted: boolean }> {
  return api.delete(`/admin/mandapam/packages/${packageId}/functions/${functionId}`);
}

// ── Admin Facilities ──

export function adminGetAllFacilities(): Promise<{ facilities: MandapamFacility[] }> {
  return api.get('/admin/mandapam/facilities');
}

export interface CreateFacilityDto {
  iconName: string;
  name: TranslationPair[];
}

export interface UpdateFacilityDto {
  iconName?: string;
  name?: TranslationPair[];
  status?: boolean;
}

export function adminCreateFacility(dto: CreateFacilityDto): Promise<{ facility: MandapamFacility }> {
  return api.post('/admin/mandapam/facilities', dto);
}

export function adminUpdateFacility(id: string, dto: UpdateFacilityDto): Promise<{ facility: MandapamFacility }> {
  return api.patch(`/admin/mandapam/facilities/${id}`, dto);
}

export function adminDeleteFacility(id: string): Promise<{ deleted: boolean }> {
  return api.delete(`/admin/mandapam/facilities/${id}`);
}

// ── Admin Addons ──

export function adminGetAllAddons(): Promise<{ addons: MandapamAddon[] }> {
  return api.get('/admin/mandapam/addons');
}

export interface CreateAddonDto {
  iconName: string;
  pricingType?: 'PER_EVENT' | 'PER_HOUR' | 'PER_DAY';
  supportsQuantity?: boolean;
  name: TranslationPair[];
}

export interface UpdateAddonDto {
  iconName?: string;
  pricingType?: 'PER_EVENT' | 'PER_HOUR' | 'PER_DAY';
  supportsQuantity?: boolean;
  name?: TranslationPair[];
  status?: boolean;
}

export function adminCreateAddon(dto: CreateAddonDto): Promise<{ addon: MandapamAddon }> {
  return api.post('/admin/mandapam/addons', dto);
}

export function adminUpdateAddon(id: string, dto: UpdateAddonDto): Promise<{ addon: MandapamAddon }> {
  return api.patch(`/admin/mandapam/addons/${id}`, dto);
}

export function adminDeleteAddon(id: string): Promise<{ deleted: boolean }> {
  return api.delete(`/admin/mandapam/addons/${id}`);
}

// ── Public ──

export function getPublicPackages(language?: string): Promise<{ packages: any[] }> {
  return publicApi.get(`/mandapam/packages?language=${language || 'EN'}`);
}

export function getPublicFacilities(language?: string): Promise<{ facilities: any[] }> {
  return publicApi.get(`/mandapam/facilities?language=${language || 'EN'}`);
}

export function getPublicAddons(language?: string): Promise<{ addons: any[] }> {
  return publicApi.get(`/mandapam/addons?language=${language || 'EN'}`);
}

export function getPublicCatalog(language?: string): Promise<import('../types/mandapam').PublicCatalog> {
  return publicApi.get(`/mandapam/public/catalog?language=${language || 'EN'}`);
}

// ── Booking API ──

export interface BookingFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  from?: string;
  to?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AddonSelectionDto {
  addonId: string;
  amount: number;
  quantity?: number;
  units?: number;
}

export interface CreateBookingDto {
  customerName: { en: string; ta: string };
  customerPhone: string;
  customerEmail?: string;
  eventTitle: { en: string; ta: string };
  eventAddress?: { en: string; ta: string };
  bookingType: 'HOURLY' | 'ONE_DAY' | 'TWO_DAY';
  eventType: 'MARRIAGE' | 'RECEPTION' | 'ENGAGEMENT' | 'BIRTHDAY' | 'BABY_SHOWER' | 'EAR_PIERCING' | 'PUBERTY_FUNCTION' | 'OTHER';
  bookingMethod: 'NORMAL_BOOKING' | 'TOKEN_BOOKING';
  bookingConfig: {
    startDate: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    durationHours?: number;
  };
  addonIds?: string[];
  addonQuantities?: Record<string, number>;
  addons?: AddonSelectionDto[];
  tokenNumber?: string;
  tokenNumber2?: string;
  advanceAmount?: number;
  paymentMethod?: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CARD' | 'CHEQUE';
  notes?: string;
}

export interface UpdateStatusDto {
  status: string;
  notes?: string;
}

export interface AddPaymentDto {
  paymentType: 'ADVANCE' | 'INSTALLMENT' | 'FINAL_PAYMENT';
  paymentMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CARD' | 'CHEQUE';
  amount: number;
  receivedAt?: string;
  notes?: string;
}

export interface AddRefundDto {
  refundType: 'PARTIAL_REFUND' | 'FULL_REFUND';
  refundMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CARD' | 'CHEQUE';
  amount: number;
  reason?: string;
}

export interface AddAddonDto {
  addonId: string;
  amount: number;
  quantity?: number;
  units?: number;
}

export interface AddChargeDto {
  type: 'damage' | 'penalty' | 'extra';
  description: { en: string; ta: string };
  amount: number;
}

export interface SettlementActionDto {
  action: 'start' | 'complete';
  charges?: AddChargeDto[];
  finalAmount?: number;
  notes?: string;
}

export interface BlockDatesDto {
  dates: string[];
  reason?: { en: string; ta: string };
}

export interface UnblockDatesDto {
  dates: string[];
}

export function adminListBookings(filters?: BookingFilters): Promise<{ bookings: Booking[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
  return api.get('/admin/mandapam/bookings', { params: filters });
}

export function adminGetBooking(id: string): Promise<{ booking: Booking }> {
  return api.get(`/admin/mandapam/bookings/${id}`);
}

export function adminCreateBooking(dto: CreateBookingDto): Promise<{ booking: Booking }> {
  return api.post('/admin/mandapam/bookings', dto);
}

export function adminUpdateBookingStatus(id: string, dto: UpdateStatusDto): Promise<{ booking: Booking }> {
  return api.patch(`/admin/mandapam/bookings/${id}/status`, dto);
}

export function adminAddPayment(id: string, dto: AddPaymentDto): Promise<{ booking: Booking }> {
  return api.post(`/admin/mandapam/bookings/${id}/payments`, dto);
}

export function adminAddRefund(id: string, dto: AddRefundDto): Promise<{ booking: Booking }> {
  return api.post(`/admin/mandapam/bookings/${id}/refunds`, dto);
}

export function adminAddAddon(id: string, dto: AddAddonDto): Promise<{ booking: Booking }> {
  return api.post(`/admin/mandapam/bookings/${id}/addons`, dto);
}

export function adminRemoveAddon(bookingId: string, snapshotId: string): Promise<{ booking: Booking }> {
  return api.delete(`/admin/mandapam/bookings/${bookingId}/addons/${snapshotId}`);
}

export function adminAddCharge(id: string, dto: AddChargeDto): Promise<{ booking: Booking }> {
  return api.post(`/admin/mandapam/bookings/${id}/charges`, dto);
}

export function adminRemoveCharge(bookingId: string, chargeId: string): Promise<{ booking: Booking }> {
  return api.delete(`/admin/mandapam/bookings/${bookingId}/charges/${chargeId}`);
}

export function adminSettlementAction(id: string, dto: SettlementActionDto): Promise<{ booking: Booking }> {
  return api.post(`/admin/mandapam/bookings/${id}/settlement`, dto);
}

export function adminGetCalendar(from?: string, to?: string): Promise<{ entries: CalendarEntry[] }> {
  return api.get('/admin/mandapam/calendar', { params: { from, to } });
}

export function adminGetCalendarDay(date: string): Promise<any> {
  return api.get(`/admin/mandapam/calendar/${date}`);
}

export function adminBlockDates(dto: BlockDatesDto): Promise<{ entries: CalendarEntry[] }> {
  return api.post('/admin/mandapam/calendar/block', dto);
}

export function adminUnblockDates(dto: UnblockDatesDto): Promise<{ entries: CalendarEntry[] }> {
  return api.post('/admin/mandapam/calendar/unblock', dto);
}

export function adminValidateToken(tokenNumber: string): Promise<{ valid: boolean; availableTokens: number }> {
  return api.post('/admin/mandapam/bookings/validate-token', { tokenNumber });
}

export function getPublicCalendar(from?: string, to?: string): Promise<{ entries: { date: string; status: string }[]; month: string }> {
  return publicApi.get('/mandapam/calendar', { params: { from, to } });
}
