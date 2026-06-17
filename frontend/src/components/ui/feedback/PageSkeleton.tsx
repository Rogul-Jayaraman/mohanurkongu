import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonBlockProps {
    className?: string;
}

export const SkeletonBlock: React.FC<SkeletonBlockProps> = ({ className = 'h-4 w-full' }) => (
    <div className={`skeleton rounded-lg! ${className}`} />
);

export const SkeletonAvatar: React.FC<{ size?: string }> = ({ size = 'size-10' }) => (
    <div className={`${size} skeleton rounded-full! shrink-0`} />
);

export const SkeletonCard: React.FC<{ className?: string; children?: React.ReactNode }> = ({ className = '', children }) => (
    <div className={`bg-white rounded-xl border border-gold/5 overflow-hidden ${className}`}>
        {children || (
            <div className="p-5 space-y-3">
                <SkeletonBlock className="h-5 w-2/3" />
                <SkeletonBlock className="h-3 w-full" />
                <SkeletonBlock className="h-3 w-4/5" />
            </div>
        )}
    </div>
);

export const SkeletonHeader: React.FC = () => (
    <div className="h-16 md:h-20 border-b border-gold-500/5 flex items-center px-4 md:px-8 lg:px-12 gap-3 shrink-0 bg-ivory">
        <SkeletonBlock className="size-8 rounded-lg!" />
        <SkeletonBlock className="h-4 w-40" />
        <div className="ml-auto">
            <SkeletonBlock className="size-8 rounded-full!" />
        </div>
    </div>
);

export const SkeletonSidebar: React.FC = () => (
    <div className="hidden xl:flex w-72 shrink-0 flex-col gap-2 p-4 border-r border-gold-500/5 bg-ivory">
        {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                <SkeletonBlock className="size-5 rounded-md!" />
                <SkeletonBlock className="h-3.5 w-28" />
            </div>
        ))}
        <div className="mt-auto pt-4 border-t border-gold-500/5">
            <div className="flex items-center gap-3 px-3 py-2.5">
                <SkeletonBlock className="size-5 rounded-md!" />
                <SkeletonBlock className="h-3.5 w-16" />
            </div>
        </div>
    </div>
);

export const SkeletonTableRow: React.FC<{ cols?: number }> = ({ cols = 5 }) => (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-gold-500/5">
        {Array.from({ length: cols }).map((_, i) => (
            <SkeletonBlock
                key={i}
                className={`h-3.5 ${i === 0 ? 'w-12' : i === cols - 1 ? 'w-20' : 'flex-1'}`}
            />
        ))}
    </div>
);

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ lines = 3, className = '' }) => (
    <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
            <SkeletonBlock
                key={i}
                className={`h-3 ${i === lines - 1 ? 'w-3/5' : 'w-full'}`}
            />
        ))}
    </div>
);

export const SkeletonStatCard: React.FC = () => (
    <div className="bg-white rounded-xl border border-gold/5 p-5 space-y-3">
        <div className="flex items-center justify-between">
            <SkeletonBlock className="size-10 rounded-xl!" />
            <SkeletonBlock className="h-3 w-16" />
        </div>
        <SkeletonBlock className="h-8 w-24" />
        <SkeletonBlock className="h-3 w-20" />
    </div>
);

export const SkeletonChart: React.FC<{ className?: string }> = ({ className = 'h-64' }) => (
    <div className={`bg-white rounded-xl border border-gold/5 p-5 ${className}`}>
        <div className="flex items-center justify-between mb-4">
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="h-4 w-16" />
        </div>
        <div className="flex items-end gap-2 h-4/5">
            {[40, 65, 45, 80, 55, 90, 70, 60, 85, 50, 75, 95].map((h, i) => (
                <div key={i} className="flex-1 skeleton rounded-t-md!" style={{ height: `${h}%` }} />
            ))}
        </div>
    </div>
);

export const SkeletonFilterChips: React.FC = () => (
    <div className="flex items-center gap-2 flex-wrap">
        {[1, 2, 3, 4].map((i) => (
            <SkeletonBlock key={i} className="h-8 w-20 rounded-full!" />
        ))}
    </div>
);

export const SkeletonCalendar: React.FC = () => (
    <div className="bg-white rounded-xl border border-gold/5 p-5">
        <div className="flex items-center justify-between mb-4">
            <SkeletonBlock className="size-8 rounded-lg!" />
            <SkeletonBlock className="h-5 w-40" />
            <SkeletonBlock className="size-8 rounded-lg!" />
        </div>
        <div className="grid grid-cols-7 gap-1.5">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <SkeletonBlock key={d} className="h-3 w-full" />
            ))}
            {Array.from({ length: 42 }).map((_, i) => (
                <SkeletonBlock key={i} className="aspect-square rounded-md!" />
            ))}
        </div>
    </div>
);
