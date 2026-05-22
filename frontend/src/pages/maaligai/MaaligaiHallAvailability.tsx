import React from 'react';
import { AvailabilityCalendar } from '@/components/features/maaligai/HallAvailability';

const MaaligaiHallAvailability: React.FC = () => {
    return (
        <main className="min-h-screen bg-background-light selection:bg-rosewood selection:text-white overflow-x-hidden">
            <AvailabilityCalendar />
        </main>
    );
};

export default MaaligaiHallAvailability;
