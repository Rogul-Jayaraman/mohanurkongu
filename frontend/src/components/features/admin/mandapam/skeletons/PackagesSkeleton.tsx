import React from 'react';
import { motion } from 'framer-motion';
import { SkeletonBlock, SkeletonCard } from '@/components/ui/feedback/PageSkeleton';

const PackagesSkeleton: React.FC = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
    >
        <div className="flex items-center justify-between">
            <SkeletonBlock className="h-7 w-48 rounded-lg!" />
            <SkeletonBlock className="h-11 w-40 rounded-full!" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gold/5 p-5 space-y-4">
                    <SkeletonBlock className="h-5 w-32" />
                    <SkeletonBlock className="h-8 w-28" />
                    <SkeletonBlock className="h-3 w-20" />
                    <div className="space-y-2 pt-1">
                        {[1, 2, 3, 4].map((j) => (
                            <SkeletonBlock key={j} className="h-3 w-full" />
                        ))}
                    </div>
                    <SkeletonCard className="h-10" />
                </div>
            ))}
        </div>

        <div className="bg-white rounded-xl border border-gold/5 overflow-hidden">
            <div className="flex items-center gap-4 px-4 py-3 border-b border-gold/10 bg-ivory">
                {['Package', 'Price', 'Duration', 'Status', 'Actions'].map((_, i) => (
                    <SkeletonBlock
                        key={i}
                        className={`h-3.5 ${i === 4 ? 'w-20' : 'flex-1'}`}
                    />
                ))}
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-gold-500/5">
                    <SkeletonBlock className="h-3.5 flex-1" />
                    <SkeletonBlock className="h-3.5 w-24" />
                    <SkeletonBlock className="h-3.5 w-20" />
                    <SkeletonBlock className="h-6 w-16 rounded-full!" />
                    <SkeletonBlock className="h-8 w-20 rounded-lg!" />
                </div>
            ))}
        </div>
    </motion.div>
);

export default PackagesSkeleton;
