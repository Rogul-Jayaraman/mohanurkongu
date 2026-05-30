import type { Prisma } from '@prisma/client';

export type LocalizedText = { en: string; ta: string };

export type BookingConfig = {
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
};

export interface CreateBookingDto {
  customerName: LocalizedText;
  customerPhone: string;
  customerEmail?: string;
  eventTitle: LocalizedText;
  eventAddress?: LocalizedText;
  packageCode: 'STANDARD' | 'ROYAL' | 'GRAND';
  bookingConfig: BookingConfig;
  addons?: { addonId: string; quantity: number }[];
  notes?: string;
}

export interface UpdateBookingStatusDto {
  status: 'CONFIRMED' | 'EVENT_IN_PROGRESS' | 'EVENT_COMPLETED' | 'SETTLEMENT_PENDING' | 'COMPLETED' | 'CANCELLED';
}

export interface AddPaymentDto {
  paymentType: 'ADVANCE' | 'INSTALLMENT' | 'FINAL_PAYMENT';
  paymentMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CARD' | 'CHEQUE';
  amount: number;
  referenceNo?: string;
}

export interface AddRefundDto {
  refundType: 'PARTIAL_REFUND' | 'FULL_REFUND';
  refundMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CARD' | 'CHEQUE';
  amount: number;
  reason?: string;
}

export interface AddAddonDto {
  addonId: string;
  quantity: number;
}

export interface BlockDatesDto {
  dates: string[];
  reason?: LocalizedText;
}

export interface AddChargesDto {
  type: 'damage' | 'penalty' | 'extra';
  description: LocalizedText;
  amount: number;
}

export interface SettlementActionDto {
  action: 'start' | 'complete';
  finalAmount?: number;
  charges?: AddChargesDto[];
  notes?: string;
}

export interface BookingFilters {
  search?: string;
  status?: string;
  packageCode?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export type BookingWithRelations = Prisma.MandapamBookingGetPayload<{
  include: {
    packageSnapshot: true;
    addonSnapshots: true;
    calendarEntries: true;
    ledgerEntries: { orderBy: { createdAt: 'desc' } };
    paymentEntries: { orderBy: { createdAt: 'desc' } };
    refundEntries: { orderBy: { createdAt: 'desc' } };
    tokenEntries: true;
    settlement: true;
    timeline: { orderBy: { createdAt: 'asc' } };
    invoice: { include: { lines: true } };
  };
}>;

export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  CONFIRMED: ['EVENT_IN_PROGRESS', 'CANCELLED'],
  EVENT_IN_PROGRESS: ['EVENT_COMPLETED', 'CANCELLED'],
  EVENT_COMPLETED: ['SETTLEMENT_PENDING'],
  SETTLEMENT_PENDING: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export const PACKAGE_TOKEN_MAP: Record<string, number> = {
  STANDARD: 0,
  ROYAL: 1,
  GRAND: 2,
};
