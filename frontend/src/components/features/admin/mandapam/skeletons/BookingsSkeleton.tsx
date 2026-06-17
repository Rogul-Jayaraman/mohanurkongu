import React from 'react';
import { motion } from 'framer-motion';
import { SkeletonBlock, SkeletonFilterChips, SkeletonTableRow } from '@/components/ui/feedback/PageSkeleton';

const BookingsSkeleton: React.FC = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
    >
        <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-full flex-1">
                <SkeletonBlock className="h-12 rounded-full!" />
            </div>
            <SkeletonBlock className="h-12 w-40 rounded-full!" />
        </div>

        <SkeletonFilterChips />

        <div className="bg-white rounded-xl border border-gold/5 overflow-hidden">
            <div className="flex items-center gap-4 px-4 py-3 border-b border-gold/10 bg-ivory">
                {['Booking#', 'Customer', 'Event', 'Date', 'Status', 'Payment', 'Actions'].map((_, i) => (
                    <SkeletonBlock
                        key={i}
                        className={`h-3.5 ${i === 0 ? 'w-20' : i === 6 ? 'w-20' : 'flex-1'}`}
                    />
                ))}
            </div>
            {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonTableRow key={i} cols={7} />
            ))}
        </div>

        <div className="flex items-center justify-between">
            <SkeletonBlock className="h-4 w-32" />
            <div className="flex gap-2">
                <SkeletonBlock className="size-8 rounded-md!" />
                <SkeletonBlock className="size-8 rounded-md!" />
            </div>
        </div>
    </motion.div>
);

export default BookingsSkeleton;
