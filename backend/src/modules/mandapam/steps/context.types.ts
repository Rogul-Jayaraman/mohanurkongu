export type LocalizedText = { en: string; ta: string };

export type BookingType = 'HOURLY' | 'ONE_DAY' | 'TWO_DAY';
export type BookingMethod = 'NORMAL_BOOKING' | 'TOKEN_BOOKING';
export type EventType = 'MARRIAGE' | 'RECEPTION' | 'ENGAGEMENT' | 'BIRTHDAY' | 'BABY_SHOWER' | 'EAR_PIERCING' | 'PUBERTY_FUNCTION' | 'OTHER';

export type BookingConfig = {
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  durationHours?: number;
};

export interface CreateBookingDto {
  customerName: LocalizedText;
  customerPhone: string;
  customerEmail?: string;
  eventTitle: LocalizedText;
  eventAddress?: LocalizedText;
  bookingType: BookingType;
  eventType: EventType;
  bookingMethod: BookingMethod;
  bookingConfig: BookingConfig;
  tokenNumber?: string;
  advanceAmount?: number;
  paymentMethod?: string;
  addonIds?: string[];
  addonQuantities?: Record<string, number>;
  addons?: Array<{
    addonId: string;
    amount: number;
    quantity?: number;
    units?: number;
  }>;
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
  amount: number;
  quantity?: number;
  units?: number;
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

export interface ValidateTokenDto {
  tokenNumber: string;
}

export type CalendarReservation = { date: Date; startTime?: string; endTime?: string };
export type CalendarAction = 'VALIDATE' | 'CREATE' | 'RELEASE';
export type TokenAction = 'ISSUE' | 'CONSUME' | 'REVERSE';
export type SettlementAction = 'INITIATE' | 'START_SETTLEMENT' | 'COMPLETE';
export type FinancialTransactionType = 'PAYMENT' | 'REFUND';
export type AddonAction = 'ATTACH' | 'DETACH';
export type CalendarBlockAction = 'BLOCK' | 'UNBLOCK';
export type CalendarViewMode = 'list' | 'detail';
export type EntityType = 'facility' | 'addon';
export type EntityCrudAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LIST' | 'PUBLIC_LIST';
export type CatalogEntityOperation = 'CREATE' | 'UPDATE' | 'DELETE' | 'LIST' | 'PUBLIC_LIST';

export interface ResolvedPackage {
  id: string;
  code: string;
  bookingType: string;
  durationType: string;
  durationValue: number | null;
  pricingAmount: number;
  currencyCode: string;
  pricingType: string;
  packageName: LocalizedText;
  version: number;
  tokenCount: number;
}

export interface EntityCrudConfig {
  tableName: 'mandapamFacility' | 'mandapamAddonService';
  translationTableName: 'mandapamFacilityTranslation' | 'mandapamAddonServiceTranslation';
  fkField: 'facilityId' | 'addonId';
  extraFields: string[];
  publicSelectFields: string[];
  publicListTransform: (item: any, language: string) => any;
}

export interface MandapamPipelineContext {
  input: Record<string, unknown>;
  performedBy: string;
  id?: string;
  bookingNo?: string;
  package?: ResolvedPackage;
  dates?: string[];
  reservations?: CalendarReservation[];
  booking?: any;
  entityType?: EntityType;
  catalogOperation?: CatalogEntityOperation;
  responseData?: Record<string, unknown>;

  cacheManager?: import('../../../common/cache/CacheManager.js').CacheManager;
  cacheEnabled?: boolean;
  cacheResolved?: boolean;
  cacheReadResult?: Record<string, unknown>;
  cacheInvalidations?: { tags: string[] };
  cacheInvalidationsLog?: { tags: string[]; flushed: number };
  logger?: {
    warn?: (obj: object, msg?: string) => void;
    info?: (obj: object, msg?: string) => void;
    error?: (obj: object, msg?: string) => void;
  };
}

export type MandapamStep = (ctx: MandapamPipelineContext) => Promise<MandapamPipelineContext>;

export const PACKAGE_TOKEN_MAP: Record<string, number> = {
  STANDARD: 0,
  ROYAL: 1,
  GRAND: 2,
};

export const PACKAGE_METADATA: Record<string, { bookingType: string; durationType: string; pricingType: string; durationValue?: number }> = {
  STANDARD: { bookingType: 'HOURLY', durationType: 'CUSTOM_HOURS', pricingType: 'HOURLY' },
  ROYAL: { bookingType: 'ONE_DAY', durationType: 'FIXED_DAY', pricingType: 'FIXED', durationValue: 1 },
  GRAND: { bookingType: 'TWO_DAY', durationType: 'FIXED_DAY', pricingType: 'FIXED', durationValue: 2 },
};

export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  CONFIRMED: ['EVENT_IN_PROGRESS', 'CANCELLED'],
  EVENT_IN_PROGRESS: ['EVENT_COMPLETED', 'CANCELLED'],
  EVENT_COMPLETED: ['SETTLEMENT_PENDING'],
  SETTLEMENT_PENDING: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export const ENTITY_CRUD_CONFIGS: Record<EntityType, EntityCrudConfig> = {
  facility: {
    tableName: 'mandapamFacility',
    translationTableName: 'mandapamFacilityTranslation',
    fkField: 'facilityId',
    extraFields: ['iconName'],
    publicSelectFields: ['iconName'],
    publicListTransform: (item: any, language: string) => ({
      iconName: item.iconName,
      name: item.translations?.[0]?.name ?? '',
    }),
  },
  addon: {
    tableName: 'mandapamAddonService',
    translationTableName: 'mandapamAddonServiceTranslation',
    fkField: 'addonId',
    extraFields: ['iconName', 'pricingType', 'supportsQuantity'],
    publicSelectFields: ['iconName', 'pricingType', 'supportsQuantity'],
    publicListTransform: (item: any, language: string) => ({
      iconName: item.iconName,
      pricingType: item.pricingType,
      supportsQuantity: item.supportsQuantity,
      name: item.translations?.[0]?.name ?? '',
    }),
  },
};
