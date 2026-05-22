import React from 'react';
import { motion } from 'framer-motion';

// ====================
// 🔹 Interfaces
// ====================

interface SectionHeaderProps {
    id?: string; // Optional element ID for navigation
    title: string; // Primary heading text
    titleSuffix?: string; // Optional text rendered after title with smaller font, in brackets
    subtitle?: string; // Optional descriptive text below heading
    align?: 'left' | 'center' | 'right'; // Horizontal alignment of text and decorations
    decoration?: 'line' | 'ornament' | 'none'; // Visual element style below title
    lang?: 'EN' | 'TA' | 'en' | 'ta'; // Language mode for specific tracking/kerning
    className?: string; // Additional Tailwind utility classes
}

interface SectionDecorationProps {
    type: 'line' | 'ornament'; // Style of visual decoration
}

interface SectionSubtitleProps {
    text: string; // Text content for the subtitle
}

// ============================================
// 📌 SectionHeader Component
// Standardized header for feature sections.
// Used consistently across the landing page for Hero, Payment, OfficeBearers.
// ============================================

/**
 * Main SectionHeader component.
 * Ensures consistent heading hierarchy and visual decorations across sections.
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
    id,
    title,
    titleSuffix,
    subtitle,
    align = 'center',
    decoration = 'line',
    lang = 'EN',
    className = ''
}) => {
    const normalizedLang = lang.toUpperCase();
    const alignmentClasses = {
        left: 'text-left items-start',
        center: 'text-center items-center mx-auto',
        right: 'text-right items-end ml-auto'
    };

    return (
        <div id={id} className={`flex flex-col max-w-3xl ${alignmentClasses[align]} ${className}`}>
            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`font-heading font-black text-rosewood mb-2 leading-tight ${normalizedLang === 'TA' ? 'text-2xl md:text-3xl lg:text-4xl' : 'text-3xl md:text-4xl lg:text-5xl'} ${normalizedLang === 'TA' ? '' : ''} ${normalizedLang === 'TA' ? 'tracking-normal' : 'tracking-tight'}`}
            >
                {title}
                {titleSuffix && <span className="block text-lg md:text-xl font-semibold text-rosewood/80 mt-1">{titleSuffix}</span>}
            </motion.h2>

            {decoration !== 'none' && (
                <SectionDecoration type={decoration} />
            )}

            {subtitle && (
                <SectionSubtitle text={subtitle} />
            )}
        </div>
    );
};

// ====================
// 🔹 Sub-components
// ====================

/**
 * Visual decoration displayed below the section title.
 * Width is calculated based on the decoration type using theme variables.
 */
const SectionDecoration: React.FC<SectionDecorationProps> = ({ type }) => (
    <motion.div
        initial={{ opacity: 0, width: 0 }}
        whileInView={{ opacity: 1, width: type === 'ornament' ? '7.5rem' : '5rem' }}
        viewport={{ once: true }}
        className="h-1 bg-gold-500 mb-6 flex items-center justify-center relative"
    >
        {type === 'ornament' && (
            <span className="material-symbols-outlined text-gold-500 bg-white px-2 text-xl absolute">
                local_florist
            </span>
        )}
    </motion.div>
);

/**
 * Descriptive paragraph displayed below the section decoration.
 */
const SectionSubtitle: React.FC<SectionSubtitleProps> = ({ text }) => (
    <motion.p
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="text-sm md:text-base text-dark-brown/60 font-body leading-relaxed max-w-xl"
    >
        {text}
    </motion.p>
);

export default SectionHeader;
