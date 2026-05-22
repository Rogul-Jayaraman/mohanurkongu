import React from 'react';

interface DiamondDividerProps {
    /**
     * Tailwind text-color class for the SVG.
     * @default "text-gold-accent"
     */
    color?: string;
    /** Extra wrapper Tailwind classes (margin, positioning, etc.). */
    className?: string;
}

/**
 * A decorative vine + diamond section divider.
 */
const DiamondDivider: React.FC<DiamondDividerProps> = ({
    color = 'text-gold-accent',
    className = '',
}) => (
    <div className={`flex items-center justify-center w-full  ${className}`}>
        <svg
            viewBox="0 0 400 40"
            height="40"
            width="400"
            className={`w-full max-w-md ${color}`}
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {/* ── Left vine ── */}
            {/* main stem from center outward */}
            <path d="M185 20 Q160 20 140 20 Q120 20 100 20 Q80 20 60 20" strokeWidth="1" />
            {/* top curls */}
            <path d="M160 20 Q155 14 148 12 Q142 10 138 14" strokeWidth="0.9" />
            <path d="M140 20 Q135 13 128 11 Q122 9 119 14" strokeWidth="0.9" />
            <path d="M120 20 Q115 13 107 11 Q101 9 98 14" strokeWidth="0.9" />
            <path d="M100 20 Q95 13 88 12 Q82 10 80 15" strokeWidth="0.9" />
            {/* bottom curls */}
            <path d="M150 20 Q145 27 139 28 Q133 30 130 25" strokeWidth="0.9" />
            <path d="M130 20 Q125 27 118 28 Q112 30 110 25" strokeWidth="0.9" />
            <path d="M110 20 Q105 27 98 28 Q92 30 90 25" strokeWidth="0.9" />
            {/* small leaf dots */}
            <circle cx="138" cy="13" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="119" cy="13" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="98" cy="13" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="80" cy="15" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="130" cy="27" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="110" cy="27" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="90" cy="27" r="1.5" fill="currentColor" stroke="none" />
            {/* end flourish */}
            <path d="M60 20 Q50 15 44 20 Q50 25 60 20" strokeWidth="1" />

            {/* ── Center diamond ── */}
            <rect
                x="183"
                y="9"
                width="34"
                height="22"
                rx="2"
                transform="rotate(45 200 20)"
                strokeWidth="1.5"
            />
            <rect
                x="191"
                y="14"
                width="18"
                height="12"
                rx="1"
                transform="rotate(45 200 20)"
                strokeWidth="0.8"
            />
            <circle cx="200" cy="20" r="2" fill="currentColor" stroke="none" />

            {/* ── Right vine (mirror) ── */}
            <path d="M215 20 Q240 20 260 20 Q280 20 300 20 Q320 20 340 20" strokeWidth="1" />
            {/* top curls */}
            <path d="M240 20 Q245 14 252 12 Q258 10 262 14" strokeWidth="0.9" />
            <path d="M260 20 Q265 13 272 11 Q278 9 281 14" strokeWidth="0.9" />
            <path d="M280 20 Q285 13 293 11 Q299 9 302 14" strokeWidth="0.9" />
            <path d="M300 20 Q305 13 312 12 Q318 10 320 15" strokeWidth="0.9" />
            {/* bottom curls */}
            <path d="M250 20 Q255 27 261 28 Q267 30 270 25" strokeWidth="0.9" />
            <path d="M270 20 Q275 27 282 28 Q288 30 290 25" strokeWidth="0.9" />
            <path d="M290 20 Q295 27 302 28 Q308 30 310 25" strokeWidth="0.9" />
            {/* small leaf dots */}
            <circle cx="262" cy="13" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="281" cy="13" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="302" cy="13" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="320" cy="15" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="270" cy="27" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="290" cy="27" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="310" cy="27" r="1.5" fill="currentColor" stroke="none" />
            {/* end flourish */}
            <path d="M340 20 Q350 15 356 20 Q350 25 340 20" strokeWidth="1" />
        </svg>
    </div>
);

export default DiamondDivider;
