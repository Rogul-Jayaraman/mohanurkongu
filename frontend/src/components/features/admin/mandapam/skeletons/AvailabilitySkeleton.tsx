import React from 'react';
import { motion } from 'framer-motion';
import { SkeletonBlock, SkeletonCalendar } from '@/components/ui/feedback/PageSkeleton';

const AvailabilitySkeleton: React.FC = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
    >
        <div className="flex items-center justify-between">
            <SkeletonBlock className="h-7 w-48 rounded-lg!" />
            <SkeletonBlock className="h-10 w-32 rounded-full!" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <SkeletonCalendar />
            </div>
            <div className="space-y-4">
                <SkeletonBlock className="h-6 w-32" />
                <div className="bg-white rounded-xl border border-gold/5 p-5 space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                            <SkeletonBlock className="size-6 rounded-md!" />
                            <SkeletonBlock className="h-3 flex-1" />
                            <SkeletonBlock className="h-6 w-14 rounded-full!" />
                        </div>
                    ))}
                </div>
                <SkeletonBlock className="h-11 w-full rounded-xl!" />
            </div>
        </div>

        <div className="bg-white rounded-xl border border-gold/5 p-5 space-y-4">
            <SkeletonBlock className="h-5 w-40" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="border border-gold/5 rounded-xl p-4 space-y-2">
                        <SkeletonBlock className="h-4 w-24" />
                        <div className="flex gap-2">
                            <SkeletonBlock className="flex-1 h-8 rounded-lg!" />
                            <SkeletonBlock className="flex-1 h-8 rounded-lg!" />
                            <SkeletonBlock className="flex-1 h-8 rounded-lg!" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </motion.div>
);

export default AvailabilitySkeleton;
