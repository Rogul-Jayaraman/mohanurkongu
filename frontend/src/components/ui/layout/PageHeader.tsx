import React from 'react';
import { SearchBar } from '../SearchBar';
import { QuickFilters } from '../table/QuickFilters';
import { useTranslations } from '../../../hooks/useTranslations';

interface PageHeaderProps {
    title: string;
    description?: string;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    onFilterClick?: (filterKey?: string) => void;
    filters?: any;
    onFilterChange?: (key: string, value: any) => void;
    placeholder?: string;
    actions?: React.ReactNode;
    children?: React.ReactNode;
}

/**
 * Common Header component for profile-related pages (Browse, Shortlist, etc.)
 * 
 * Centralizes:
 * 1. Page Title (now reduced size for elegant look)
 * 2. Search Bar at the top (per user preference)
 * 3. Page-specific actions/tabs
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    description,
    searchQuery,
    setSearchQuery,
    onFilterClick,
    filters,
    onFilterChange,
    placeholder,
    actions,
    children
}) => {
    const { t } = useTranslations(['common', 'dashboard']);
    return (
        <div className="space-y-4">
            {/* Search Bar at the very top */}
            <div>
                <SearchBar 
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onFilterClick={onFilterClick}
                    placeholder={placeholder}
                />
            </div>

            {/* Title & Actions Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-gold/10">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-rosewood/95 via-dark-rosewood/95 to-rosewood/95 flex items-center justify-center shrink-0 shadow-[0_10px_25px_rgba(107,0,40,0.15)] border border-gold/20 relative group overflow-hidden">
                        <div className="absolute inset-0 bg-kolam-pattern opacity-10 group-hover:scale-125 transition-transform duration-700" />
                        <span className="material-symbols-outlined text-ivory/90 text-2xl relative z-10">groups</span>
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-xl md:text-xl font-serif font-semibold text-rosewood ">
                            {title}
                        </h1>
                        {description && (
                            <p className="text-rosewood/40 text-[11px] font-black">
                                {description}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 px-2">
                    {children}
                    {actions && children && <div className="h-6 w-px bg-gold/20 hidden md:block" />}
                    {actions}
                </div>
            </div>

            {/* Redesigned Quick Filters - Modern Iconographic UI */}
            {(onFilterClick || onFilterChange) && !searchQuery.trim() && (
                <QuickFilters 
                    filters={filters}
                    onFilterChange={onFilterChange}
                    onFilterClick={onFilterClick} 
                    className="mt-3"
                />
            )}
        </div>
    );
};
