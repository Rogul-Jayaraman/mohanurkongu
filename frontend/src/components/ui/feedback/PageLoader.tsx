import React from 'react';
import { motion } from 'framer-motion';
import { SkeletonHeader, SkeletonSidebar, SkeletonBlock, SkeletonCard } from './PageSkeleton';

const PageLoader: React.FC = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen bg-ivory flex flex-col"
        >
            <div className="fixed inset-0 kolam-pattern opacity-[0.015] pointer-events-none" />
            <SkeletonHeader />
            <div className="flex flex-1">
                <SkeletonSidebar />
                <div className="flex-1 p-4 md:p-8 lg:p-12 overflow-hidden">
                    <div className="max-w-7xl mx-auto space-y-6 relative z-10">
                        <SkeletonBlock className="h-6 w-56 rounded-lg!" />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <SkeletonCard className="h-48" />
                                <SkeletonCard className="h-24" />
                            </div>
                            <div className="space-y-4">
                                <SkeletonCard className="h-36" />
                                <SkeletonCard className="h-36" />
                            </div>
                        </div>
                        <SkeletonCard className="h-40" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default PageLoader;
