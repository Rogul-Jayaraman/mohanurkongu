import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import { listBookingsPipeline } from '../pipelines/mandapam/booking-list.pipeline';
import { getBookingPipeline, validateTokenPipeline } from '../pipelines/mandapam/booking-read.pipeline';
import { getAdminCalendarPipeline, getCalendarDayPipeline, getPublicCalendarPipeline } from '../pipelines/mandapam/calendar.pipeline';
import { listAdminPackagesPipeline, getAdminPackagePipeline, listPublicPackagesPipeline } from '../pipelines/mandapam/package.pipeline';
import { listFacilitiesPipeline, listAddonsPipeline, listPublicFacilitiesPipeline, listPublicAddonsPipeline } from '../pipelines/mandapam/catalog-entity.pipeline';

// ── Bookings ──

export function useBookingList(filters?: Parameters<typeof listBookingsPipeline>[0]) {
  return useQuery({
    queryKey: [...queryKeys.mandapam.bookings(), filters ?? null] as const,
    queryFn: () => listBookingsPipeline(filters),
  });
}

export function useBooking(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.mandapam.booking(id!),
    queryFn: () => getBookingPipeline({ id: id! }),
    enabled: !!id,
  });
}

export function useTokenValidation(tokenNumber: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.mandapam.token(), tokenNumber ?? null] as const,
    queryFn: () => validateTokenPipeline({ tokenNumber: tokenNumber! }),
    enabled: !!tokenNumber,
    retry: false,
  });
}

// ── Calendar ──

export function useAdminCalendar(from?: string, to?: string) {
  return useQuery({
    queryKey: queryKeys.mandapam.calendar(from, to),
    queryFn: () => getAdminCalendarPipeline({ from, to }),
  });
}

export function useCalendarDay(date: string | undefined) {
  return useQuery({
    queryKey: queryKeys.mandapam.calendarDay(date!),
    queryFn: () => getCalendarDayPipeline({ date: date! }),
    enabled: !!date,
  });
}

export function usePublicCalendar(from?: string, to?: string) {
  return useQuery({
    queryKey: [...queryKeys.mandapam.publicCalendar(), from, to] as const,
    queryFn: () => getPublicCalendarPipeline({ from, to }),
    staleTime: 120_000,
  });
}

// ── Packages ──

export function useAdminPackages() {
  return useQuery({
    queryKey: queryKeys.mandapam.packages(),
    queryFn: listAdminPackagesPipeline,
    staleTime: 60_000,
  });
}

export function useAdminPackage(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.mandapam.package(id!),
    queryFn: () => getAdminPackagePipeline(id!),
    enabled: !!id,
  });
}

export function usePublicPackages(language?: string) {
  return useQuery({
    queryKey: [...queryKeys.mandapam.publicPackages(), language] as const,
    queryFn: () => listPublicPackagesPipeline(language),
    staleTime: 120_000,
  });
}

// ── Catalog Entities ──

export function useFacilities() {
  return useQuery({
    queryKey: queryKeys.mandapam.facilities(),
    queryFn: listFacilitiesPipeline,
    staleTime: 60_000,
  });
}

export function useAddons() {
  return useQuery({
    queryKey: queryKeys.mandapam.addons(),
    queryFn: listAddonsPipeline,
    staleTime: 60_000,
  });
}

export function usePublicFacilities(language?: string) {
  return useQuery({
    queryKey: [...queryKeys.mandapam.publicCatalog(), 'facilities', language] as const,
    queryFn: () => listPublicFacilitiesPipeline(language),
    staleTime: 120_000,
  });
}

export function usePublicAddons(language?: string) {
  return useQuery({
    queryKey: [...queryKeys.mandapam.publicCatalog(), 'addons', language] as const,
    queryFn: () => listPublicAddonsPipeline(language),
    staleTime: 120_000,
  });
}
