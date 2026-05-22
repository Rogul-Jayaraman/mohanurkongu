import React, { useRef, useState } from 'react';
import { useIntersection } from '@/hooks/useIntersection';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    className?: string;
    skeletonClassName?: string;
}

/**
 * Premium LazyImage component with IntersectionObserver and smooth fade-in.
 * Optimized for discovery grid performance and heritage aesthetic.
 */
export const LazyImage: React.FC<LazyImageProps> = ({ 
    src, 
    alt, 
    className = "", 
    skeletonClassName = "",
    ...props 
}) => {
    const imgRef = useRef<HTMLDivElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const isInView = useIntersection(imgRef);

    return (
        <div 
            ref={imgRef} 
            className={`relative overflow-hidden ${className}`}
        >
            {/* 1. Progress Skeleton (Visible while out of view OR loading) */}
            {(!isInView || !isLoaded) && (
                <div className={`absolute inset-0 bg-slate-100 animate-pulse ${skeletonClassName}`} />
            )}

            {/* 2. The Actual Image (Only rendered when in view) */}
            {isInView && (
                <img
                    alt={alt}
                    src={src}
                    onLoad={() => setIsLoaded(true)}
                    className={`
                        w-full h-full object-cover transition-all duration-700 ease-out
                        ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}
                        ${className}
                    `}
                    {...props}
                />
            )}
        </div>
    );
};
