import api from '@/lib/api';

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
    status?: 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
    createdAt: string;
}

export const mandapamService = {
    // Packages
    getPackages: async () => {
        const response = await api.get<MandapamPackage[]>('/admin/mandapam/packages');
        return response.data;
    },

    createPackage: async (packageData: any) => {
        const response = await api.post('/admin/mandapam/package', packageData);
        return response.data;
    },

    updatePackage: async (id: string, packageData: any) => {
        const response = await api.put(`/admin/mandapam/package/${id}`, packageData);
        return response.data;
    },

    // Bookings
    getBookings: async (filters?: { month?: number; year?: number; status?: string; paymentStatus?: string }) => {
        const response = await api.get<MandapamBooking[]>('/admin/mandapam/bookings', { params: filters });
        return response.data;
    },

    createBooking: async (bookingData: any) => {
        const response = await api.post('/admin/mandapam/booking', bookingData);
        return response.data;
    },

    updateBooking: async (id: string, bookingData: any) => {
        const response = await api.patch(`/admin/mandapam/booking/${id}`, bookingData);
        return response.data;
    },

    deleteBooking: async (id: string) => {
        const response = await api.delete(`/admin/mandapam/booking/${id}`);
        return response.data;
    },

    addPayment: async (bookingId: string, paymentData: { amount: number; paymentMethod?: string; transactionId?: string; notes?: string }) => {
        const response = await api.post(`/admin/mandapam/bookings/${bookingId}/payments`, paymentData);
        return response.data;
    },

    getBookedDates: async () => {
        const response = await api.get('/admin/mandapam/calendar');
        return response.data;
    },

    blockDate: async (data: { date: string; reasonEn: string; reasonTa: string }) => {
        const response = await api.post('/admin/mandapam/block-date', data);
        return response.data;
    },

    unblockDate: async (date: string) => {
        const response = await api.delete('/admin/mandapam/block-date', { params: { date } });
        return response.data;
    },

    checkAvailability: async (date: string, session: string) => {
        const response = await api.get('/admin/mandapam/check-availability', { params: { date, session } });
        return response.data;
    },

    getBookingsByDate: async (date: string) => {
        const response = await api.get('/admin/mandapam/booking/by-date', { params: { date } });
        return response.data;
    },

    getBlockedDetails: async (date: string) => {
        const response = await api.get(`/admin/mandapam/blocked-date/${date}`);
        return response.data;
    }
};
