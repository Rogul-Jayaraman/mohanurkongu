import api from '../lib/api';
import { ApiResponse } from './profiles.api';

export interface MandapamPackage {
    id: string;
    nameEn: string;
    nameTa: string;
    price: number;
    featuresEn: string[];
    featuresTa: string[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface MandapamBooking {
    id: string;
    eventId: string;
    date: string;
    session: 'MORNING' | 'EVENING' | 'FULL_DAY';
    eventTitleEn: string;
    eventTitleTa: string;
    contactNameEn: string;
    contactNameTa: string;
    phone: string;
    email?: string;
    addressEn?: string;
    addressTa?: string;
    packageId: string;
    packageNameEn: string;
    packageNameTa: string;
    packageSnapshotPrice: number;
    paymentMode: string;
    paymentStatus: 'NOT_PAID' | 'ADVANCE' | 'FULLY_PAID';
    totalAmount: number;
    paidAmount: number;
    balance: number;
    status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
    createdAt: string;
}

export const adminMandapamApi = {
    // Packages
    listPackages: async (): Promise<ApiResponse<MandapamPackage[]>> => {
        return api.get('/admin/mandapam/packages');
    },

    createPackage: async (data: any): Promise<ApiResponse<MandapamPackage>> => {
        return api.post('/admin/mandapam/package', data);
    },

    updatePackage: async (id: string, data: any): Promise<ApiResponse<MandapamPackage>> => {
        return api.put(`/admin/mandapam/package/${id}`, data);
    },

    togglePackageStatus: async (id: string, isActive: boolean): Promise<ApiResponse<MandapamPackage>> => {
        return api.patch(`/admin/mandapam/package/${id}/status`, { isActive });
    },

    // Bookings
    listBookings: async (params?: any): Promise<ApiResponse<MandapamBooking[]>> => {
        return api.get('/admin/mandapam/bookings', { params });
    },

    createBooking: async (data: any): Promise<ApiResponse<MandapamBooking>> => {
        return api.post('/admin/mandapam/booking', data);
    },

    updateBooking: async (id: string, data: any): Promise<ApiResponse<MandapamBooking>> => {
        return api.patch(`/admin/mandapam/booking/${id}`, data);
    },

    addPayment: async (bookingId: string, data: { amount: number; paymentMethod?: string; transactionId?: string; notes?: string }): Promise<ApiResponse<any>> => {
        return api.post(`/admin/mandapam/bookings/${bookingId}/payments`, data);
    },

    getCalendar: async (): Promise<ApiResponse<any>> => {
        return api.get('/admin/mandapam/calendar');
    },

    blockDate: async (data: any): Promise<ApiResponse<any>> => {
        return api.post('/admin/mandapam/block-date', data);
    },

    unblockDate: async (date: string): Promise<ApiResponse<any>> => {
        return api.delete('/admin/mandapam/block-date', { params: { date } });
    },

    checkAvailability: async (date: string, session: string): Promise<ApiResponse<any>> => {
        return api.get('/admin/mandapam/check-availability', { params: { date, session } });
    },

    getBookingByDate: async (date: string): Promise<ApiResponse<any>> => {
        return api.get('/admin/mandapam/booking/by-date', { params: { date } });
    },

    getBlockedDetails: async (date: string): Promise<ApiResponse<any>> => {
        return api.get(`/admin/mandapam/blocked-date/${date}`);
    },

    deleteBooking: async (id: string): Promise<ApiResponse<void>> => {
        return api.delete(`/admin/mandapam/booking/${id}`);
    }
};
