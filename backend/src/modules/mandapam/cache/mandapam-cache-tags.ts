export const MandapamCacheTtls = {
  CALENDAR: 600,
  CALENDAR_DAY: 300,
  BOOKING_DETAIL: 120,
  BOOKING_LIST: 60,
  CATALOG: 1800,
  PACKAGES: 1800,
  PUBLIC_PACKAGES: 1800,
} as const;

export function buildCalendarTag(from: string, to: string): string {
  return `mandapam:calendar:${from}:${to}`;
}

export function buildCalendarDayTag(dateStr: string): string {
  return `mandapam:calendar-day:${dateStr}`;
}

export function buildBookingTag(id: string): string {
  return `mandapam:booking:${id}`;
}

export function buildBookingListTag(): string {
  return 'mandapam:booking-list';
}

export function buildCatalogTag(entityType: string): string {
  return `mandapam:catalog:${entityType}`;
}

export function buildPackageTag(code: string): string {
  return `mandapam:package:${code}`;
}

export function buildPackagesListTag(): string {
  return 'mandapam:packages:all';
}

export function buildCalendarInvalidationTag(): string {
  return 'mandapam:calendar:*';
}

export function buildPublicCalendarTag(from: string, to: string): string {
  return `mandapam:public-calendar:${from}:${to}`;
}
