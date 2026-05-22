export const getBookingStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
        case 'confirmed':
            return 'bg-sage-green text-nav-gray';
        case 'completed':
            return 'bg-sage-tint text-deep-sage';
        case 'cancelled':
            return 'bg-rose-beige text-rosewood';
        default:
            return 'bg-gray-100 text-gray-700';
    }
};

export const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
        case 'fully_paid':
            return 'bg-sage-tint text-deep-sage';
        case 'advance':
            return 'bg-primary/20 text-yellow-800';
        case 'refunded':
            return 'bg-rose-beige text-rosewood';
        case 'not_paid':
        default:
            return 'bg-gray-100 text-gray-700';
    }
};
