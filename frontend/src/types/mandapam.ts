export interface TranslationPair {
  language: 'EN' | 'TA';
  value: string;
}

export interface MandapamPackage {
  id: string;
  code: 'STANDARD' | 'ROYAL' | 'GRAND';
  bookingType: 'HOURLY' | 'ONE_DAY' | 'TWO_DAY';
  durationType: 'CUSTOM_HOURS' | 'FIXED_DAY';
  durationValue: number | null;
  tokenCount: number;
  status: boolean;
  translations: PackageTranslation[];
  functions: PackageFunction[];
  pricings: PackagePricing[];
}

export interface PackageTranslation {
  language: 'EN' | 'TA';
  displayName: string;
}

export interface PackageFunction {
  id: string;
  status: boolean;
  translations: FunctionTranslation[];
}

export interface FunctionTranslation {
  language: 'EN' | 'TA';
  name: string;
}

export interface PackagePricing {
  id: string;
  pricingType: 'HOURLY' | 'FIXED';
  amount: number;
  currencyCode: string;
  isActive: boolean;
  effectiveFrom: string | null;
  effectiveTo: string | null;
}

export interface MandapamFacility {
  id: string;
  iconName: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  translations: FacilityTranslation[];
}

export interface FacilityTranslation {
  id: string;
  language: 'EN' | 'TA';
  name: string;
}

export interface MandapamAddon {
  id: string;
  iconName: string;
  pricingType: 'PER_EVENT' | 'PER_HOUR' | 'PER_DAY';
  supportsQuantity: boolean;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  translations: AddonTranslation[];
}

export interface AddonTranslation {
  id: string;
  language: 'EN' | 'TA';
  name: string;
}

export interface PublicPackage {
  code: string;
  bookingType?: string;
  durationType?: string;
  durationValue?: number | null;
  displayName: string;
  functions: { name: string }[];
  pricing?: { amount: number; currencyCode: string; pricingType: string } | null;
}

export interface PublicFacility {
  iconName: string;
  name: string;
}

export interface PublicAddon {
  iconName: string;
  pricingType?: string;
  supportsQuantity?: boolean;
  name: string;
}

export interface PublicCatalog {
  packages: PublicPackage[];
  facilities: PublicFacility[];
  addons: PublicAddon[];
}

// ── Booking Types ──

export type BookingStatus = 'CONFIRMED' | 'IN_PROGRESS' | 'SETTLEMENT_PENDING' | 'COMPLETED' | 'CANCELLED';
export type BookingType = 'HOURLY' | 'ONE_DAY' | 'TWO_DAY';
export type EventType = 'MARRIAGE' | 'RECEPTION' | 'ENGAGEMENT' | 'BIRTHDAY' | 'BABY_SHOWER' | 'EAR_PIERCING' | 'PUBERTY_FUNCTION' | 'OTHER';
export type BookingMethod = 'NORMAL_BOOKING' | 'TOKEN_BOOKING';
export type CalendarEntryStatus = 'AVAILABLE' | 'PARTIALLY_BOOKED' | 'FULLY_BOOKED' | 'BLOCKED';
export type PaymentEntryType = 'ADVANCE' | 'INSTALLMENT' | 'FINAL_PAYMENT';
export type PaymentMethodType = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CARD' | 'CHEQUE';
export type RefundType = 'PARTIAL_REFUND' | 'FULL_REFUND';
export type SettlementState = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface LocalizedText {
  en: string;
  ta: string;
}

export interface BookingConfig {
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
}

export interface BookingPackageSnapshot {
  id: string;
  bookingId: string;
  packageId: string;
  packageCode: string;
  packageName: LocalizedText;
  packagePrice: number;
  packageVersion: number;
}

export interface BookingAddonSnapshot {
  id: string;
  bookingId: string;
  addonId: string;
  addonName: LocalizedText;
  pricingType: 'PER_EVENT' | 'PER_HOUR' | 'PER_DAY';
  quantity: number | null;
  units: number | null;
  amount: number;
}

export interface FinancialLedgerEntry {
  id: string;
  bookingId: string;
  source: string;
  description: LocalizedText | null;
  amount: number;
  currencyCode: string;
  createdAt: string;
}

export interface PaymentEntry {
  id: string;
  bookingId: string;
  paymentType: PaymentEntryType;
  paymentMethod: PaymentMethodType;
  amount: number;
  receivedAt: string;
  createdAt: string;
}

export interface RefundEntry {
  id: string;
  bookingId: string;
  refundType: RefundType;
  refundMethod: PaymentMethodType;
  amount: number;
  reason: string | null;
  createdAt: string;
}

export interface TokenConsumption {
  id: string;
  bookingId: string;
  tokens: number;
  state: string;
  consumedAt: string;
  reversedAt: string | null;
}

export interface MandapamToken {
  id: string;
  tokenId: string;
  status: string;
  bookingId: string | null;
}

export interface Settlement {
  id: string;
  bookingId: string;
  state: SettlementState;
  damageCharges: any[];
  penaltyCharges: any[];
  extraCharges: any[];
  finalAmount: number | null;
  settledAt: string | null;
  settledBy: string | null;
  notes: string | null;
}

export interface BookingTimelineEntry {
  id: string;
  bookingId: string;
  event: string;
  metadata: any;
  notes: string | null;
  createdAt: string;
}

export interface CalendarEntry {
  id: string;
  date: string;
  status: CalendarEntryStatus;
  reason: LocalizedText | null;
  bookingId: string | null;
}

export interface Booking {
  id: string;
  bookingNo: string;
  customerName: LocalizedText;
  customerPhone: string;
  customerEmail: string | null;
  eventTitle: LocalizedText;
  eventAddress: LocalizedText | null;
  bookingType: BookingType;
  eventType: EventType;
  status: BookingStatus;
  bookingMethod: BookingMethod;
  packageCode: string;
  bookingConfig: BookingConfig;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  packageSnapshot: BookingPackageSnapshot | null;
  addonSnapshots: BookingAddonSnapshot[];
  ledgerEntries: FinancialLedgerEntry[];
  paymentEntries: PaymentEntry[];
  refundEntries: RefundEntry[];
  tokenEntries: TokenConsumption[];
  tokens: MandapamToken[];
  settlement: Settlement | null;
  timeline: BookingTimelineEntry[];
  calendarEntries?: CalendarEntry[];
  totalCharges?: number;
  totalPayments?: number;
  totalRefunds?: number;
  outstandingAmount?: number;
}

/** Slimmed-down booking shape returned by list endpoints (scalar fields + aggregate finances only) */
export interface BookingListItem {
  id: string;
  bookingNo: string;
  customerName: LocalizedText;
  customerPhone: string;
  customerEmail: string | null;
  eventTitle: LocalizedText;
  eventAddress: LocalizedText | null;
  bookingType: BookingType;
  eventType: EventType;
  status: BookingStatus;
  bookingMethod: BookingMethod;
  packageCode: string;
  bookingConfig: BookingConfig;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  packageSnapshot: BookingPackageSnapshot | null;
  settlement: Settlement | null;
  totalCharges?: number;
  totalPayments?: number;
  totalRefunds?: number;
  outstandingAmount?: number;
}

export interface MutationBookingResponse {
  id: string;
  bookingNo: string;
  status: BookingStatus;
  outstandingAmount: number;
}
