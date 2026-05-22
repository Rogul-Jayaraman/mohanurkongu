import React from 'react';

interface CornerFlourishProps {
    /** Tailwind text-color class for the SVG stroke & fill. Defaults to `text-gold-accent`. */
    color?: string;
    /** Extra Tailwind classes for custom overrides (positioning, opacity, etc.). */
    className?: string;
}

/** Reusable SVG path — actual bracket shape. */
const FlourishSvg: React.FC = () => (
    <svg
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 100 100"
        className="w-full h-full"
        aria-hidden="true"
    >
        <path
            d="M0 0 L40 0 M0 0 L0 40 M0 0 Q 30 0, 30 30 T 60 60"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <circle cx="8" cy="8" fill="currentColor" stroke="none" r="3" />
    </svg>
);

const CornerFlourish: React.FC<CornerFlourishProps> = ({
    color = 'text-gold-accent',
    className = '',
}) => {
    const base = `absolute w-24 h-24 md:w-36 md:h-36 pointer-events-none select-none ${color} ${className}`;

    return (
        <>
            {/* Top-left */}
            <div className={`${base} top-3 left-3 md:top-16 md:left-16`}>
                <FlourishSvg />
            </div>
            {/* Bottom-right (rotated 180°) */}
            <div className={`${base} bottom-3 right-3 md:bottom-16 md:right-16 rotate-180`}>
                <FlourishSvg />
            </div>
        </>
    );
};

export default CornerFlourish;
