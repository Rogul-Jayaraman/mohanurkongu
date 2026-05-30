export interface TranslationPair {
  language: 'EN' | 'TA';
  value: string;
}

export interface MandapamPackage {
  id: string;
  code: 'STANDARD' | 'ROYAL' | 'GRAND';
  bookingType: 'HOURLY' | 'DAY_BASED';
  durationType: 'CUSTOM_HOURS' | 'FIXED_DAY';
  durationValue: number | null;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  translations: PackageTranslation[];
  functions: PackageFunction[];
  pricings: PackagePricing[];
}

export interface PackageTranslation {
  id: string;
  language: 'EN' | 'TA';
  displayName: string;
}

export interface PackageFunction {
  id: string;
  packageId: string;
  status: boolean;
  createdAt: string;
  translations: FunctionTranslation[];
}

export interface FunctionTranslation {
  id: string;
  language: 'EN' | 'TA';
  name: string;
}

export interface PackagePricing {
  id: string;
  packageId: string;
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
  chargeType: 'GENERAL' | 'ADDITIONAL';
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
  pricingType: 'HOURLY' | 'FIXED';
  amount: number;
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
  bookingType: string;
  durationType: string;
  durationValue: number | null;
  displayName: string;
  functions: { name: string }[];
  pricing: { amount: number; currencyCode: string; pricingType: string } | null;
}

export interface PublicFacility {
  iconName: string;
  name: string;
}

export interface PublicAddon {
  iconName: string;
  pricingType: string;
  amount: number;
  name: string;
}

// ── Booking Types ──

export type BookingStatus = 'CONFIRMED' | 'EVENT_IN_PROGRESS' | 'EVENT_COMPLETED' | 'SETTLEMENT_PENDING' | 'COMPLETED' | 'CANCELLED';
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
  pricingType: 'HOURLY' | 'FIXED';
  quantity: number;
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
  referenceNo: string | null;
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
  settlement: Settlement | null;
  timeline: BookingTimelineEntry[];
  _outstanding?: number;
}
