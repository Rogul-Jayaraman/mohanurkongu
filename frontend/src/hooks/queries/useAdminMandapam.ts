import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminMandapamApi } from '../../api/admin-mandapam.api';

/**
 * Hook to list all mandapam packages for admin
 */
export const useAdminPackagesQuery = () => {
  return useQuery({
    queryKey: ['admin-mandapam', 'packages'],
    queryFn: () => adminMandapamApi.listPackages(),
    select: (response) => response.data,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to list mandapam bookings with filters
 */
export const useAdminBookingsQuery = (params: any = {}) => {
  return useQuery({
    queryKey: ['admin-mandapam', 'bookings', params],
    queryFn: () => adminMandapamApi.listBookings(params),
    select: (response) => response.data,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Hook to get mandapam calendar status
 */
export const useAdminCalendarQuery = () => {
  return useQuery({
    queryKey: ['admin-mandapam', 'calendar'],
    queryFn: () => adminMandapamApi.getCalendar(),
    select: (response) => response.data,
    staleTime: 1 * 60 * 1000,
  });
};

/**
 * Mutation for creating a mandapam package
 */
export const useCreatePackageMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => adminMandapamApi.createPackage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-mandapam', 'packages'] });
    },
  });
};

/**
 * Mutation for updating a mandapam package
 */
export const useUpdatePackageMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      adminMandapamApi.updatePackage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-mandapam', 'packages'] });
    },
  });
};

/**
 * Mutation for toggling package status
 */
export const useTogglePackageStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      adminMandapamApi.togglePackageStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-mandapam', 'packages'] });
    },
  });
};

/**
 * Mutation for creating a booking
 */
export const useCreateBookingMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => adminMandapamApi.createBooking(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-mandapam', 'bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-mandapam', 'calendar'] });
    },
  });
};

/**
 * Mutation for blocking a date
 */
export const useBlockDateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => adminMandapamApi.blockDate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-mandapam', 'calendar'] });
    },
  });
};

/**
 * Mutation for unblocking a date
 */
export const useUnblockDateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (date: string) => adminMandapamApi.unblockDate(date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-mandapam', 'calendar'] });
    },
  });
};

/**
 * Mutation for updating a mandapam booking
 */
export const useUpdateBookingMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      adminMandapamApi.updateBooking(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-mandapam', 'bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-mandapam', 'calendar'] });
    },
  });
};

/**
 * Mutation for adding a payment to a booking
 */
export const useAddPaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: string; data: any }) => 
      adminMandapamApi.addPayment(bookingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-mandapam', 'bookings'] });
    },
  });
};

/**
 * Mutation for deleting a booking
 */
export const useDeleteBookingMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminMandapamApi.deleteBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-mandapam', 'bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-mandapam', 'calendar'] });
    },
  });
};

/**
 * Hook to get bookings for a specific date
 */
export const useAdminBookingByDateQuery = (date: string | null) => {
  return useQuery({
    queryKey: ['admin-mandapam', 'booking', date],
    queryFn: () => adminMandapamApi.getBookingByDate(date!),
    select: (response) => response.data,
    enabled: !!date,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Hook to get blocked details for a specific date
 */
export const useAdminBlockedDetailsQuery = (date: string | null) => {
  return useQuery({
    queryKey: ['admin-mandapam', 'blocked-details', date],
    queryFn: () => adminMandapamApi.getBlockedDetails(date!),
    select: (response) => response.data,
    enabled: !!date,
    staleTime: 5 * 60 * 1000,
  });
};
