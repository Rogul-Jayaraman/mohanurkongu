import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from './queryKeys';
import { createBookingPipeline } from '../pipelines/mandapam/booking-create.pipeline';
import { bookingWritePipeline } from '../pipelines/mandapam/booking-write.pipeline';
import {
  blockDatesPipeline,
  unblockDatesPipeline,
} from '../pipelines/mandapam/calendar.pipeline';
import {
  updatePackagePipeline,
  deleteFunctionPipeline,
} from '../pipelines/mandapam/package.pipeline';
import {
  createFacilityPipeline,
  updateFacilityPipeline,
  deleteFacilityPipeline,
  createAddonPipeline,
  updateAddonPipeline,
  deleteAddonPipeline,
} from '../pipelines/mandapam/catalog-entity.pipeline';
import type { CreateBookingInput, BookingWriteInput } from '../pipelines/mandapam/context.types';
import type { UpdatePackageDto, CreateFacilityDto, UpdateFacilityDto, CreateAddonDto, UpdateAddonDto } from '../api/mandapam.api';
import { getErrorMessage } from '../lib/errors';

// ── Booking Creation ──

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBookingInput) => createBookingPipeline(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.mandapam.bookings() });
      qc.invalidateQueries({ queryKey: ['mandapam', 'calendar'] });
      toast.success('Booking created successfully');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

// ── Booking Writes (status, payment, refund, addon, settlement) ──

export function useBookingWrite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BookingWriteInput) => bookingWritePipeline(input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.mandapam.bookings() });
      qc.invalidateQueries({ queryKey: queryKeys.mandapam.booking(vars.bookingId) });
      qc.invalidateQueries({ queryKey: ['mandapam', 'calendar'] });
      toast.success('Booking updated');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

// ── Calendar ──

export function useBlockDates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof blockDatesPipeline>[0]) =>
      blockDatesPipeline(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mandapam', 'calendar'] });
      toast.success('Dates blocked');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUnblockDates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof unblockDatesPipeline>[0]) =>
      unblockDatesPipeline(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mandapam', 'calendar'] });
      toast.success('Dates unblocked');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

// ── Package ──

export function useUpdatePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; dto: UpdatePackageDto }) =>
      updatePackagePipeline(args.id, args.dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.mandapam.packages() });
      toast.success('Package updated');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeletePackageFunction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { packageId: string; functionId: string }) =>
      deleteFunctionPipeline(args.packageId, args.functionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.mandapam.packages() });
      toast.success('Function deleted');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

// ── Facilities ──

export function useCreateFacility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateFacilityDto) => createFacilityPipeline(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.mandapam.facilities() });
      toast.success('Facility created');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateFacility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; dto: UpdateFacilityDto }) =>
      updateFacilityPipeline(args.id, args.dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.mandapam.facilities() });
      toast.success('Facility updated');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteFacility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFacilityPipeline(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.mandapam.facilities() });
      toast.success('Facility deleted');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

// ── Addons ──

export function useCreateAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAddonDto) => createAddonPipeline(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.mandapam.addons() });
      toast.success('Addon created');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; dto: UpdateAddonDto }) =>
      updateAddonPipeline(args.id, args.dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.mandapam.addons() });
      toast.success('Addon updated');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAddonPipeline(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.mandapam.addons() });
      toast.success('Addon deleted');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
