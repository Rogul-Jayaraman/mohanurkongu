import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, ChevronDown, LucideIcon, Settings2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Utility for cleaner tailwind classes */
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface DropdownItem {
    label: string;
    icon: LucideIcon;
    onClick: (e: React.MouseEvent) => void;
    danger?: boolean;
    show?: boolean;
    className?: string;
}

interface TableActionDropdownProps {
    items: DropdownItem[];
    triggerIcon?: LucideIcon;
    triggerLabel?: string;
    triggerClassName?: string;
    dropdownWidth?: string;
    variant?: 'action' | 'filter';
}

export const TableActionDropdown: React.FC<TableActionDropdownProps> = ({ 
    items, 
    triggerIcon: TriggerIcon = MoreVertical,
    triggerLabel,
    triggerClassName = "",
    dropdownWidth = "w-64",
    variant = 'action'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, placement: 'bottom' as 'top' | 'bottom' });
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const updatePosition = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const menuHeight = visibleItems.length * 40 + 20; 
            const placement = spaceBelow < menuHeight ? 'top' : 'bottom';
            
            setCoords({
                top: placement === 'bottom' ? rect.bottom + 6 : rect.top - 6,
                left: rect.right,
                width: rect.width,
                placement
            });
        }
    };

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isOpen) updatePosition();
        setIsOpen(!isOpen);
    };

    useLayoutEffect(() => {
        if (isOpen) {
            updatePosition();
            
            // Auto close on scroll (requested feature)
            const handleAutoClose = () => setIsOpen(false);
            
            // Listen to scroll on any parent container (useCapture: true)
            window.addEventListener('scroll', handleAutoClose, true);
            window.addEventListener('resize', handleAutoClose);
            window.addEventListener('blur', handleAutoClose); // Close when window loses focus

            return () => {
                window.removeEventListener('scroll', handleAutoClose, true);
                window.removeEventListener('resize', handleAutoClose);
                window.removeEventListener('blur', handleAutoClose);
            };
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && 
                triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const visibleItems = items.filter(item => item.show !== false);

    return (
        <div className="relative inline-block">
            <motion.button
                ref={triggerRef}
                onClick={handleToggle}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                    "relative flex items-center justify-center transition-all duration-300 rounded-xl font-bold text-sm",
                    variant === 'action' 
                        ? cn(
                            "w-9 h-9 border",
                            isOpen 
                                ? "bg-rosewood border-rosewood text-white shadow-lg" 
                                : "bg-white border-gold/20 text-rosewood hover:bg-ivory hover:border-gold/40 shadow-sm"
                          )
                        : cn(
                            "gap-2 px-5 py-2.5 border transition-all shadow-sm",
                            isOpen 
                                ? "bg-rosewood border-rosewood text-white shadow-lg" 
                                : "bg-ivory/40 backdrop-blur-md border-gold/20 text-rosewood hover:bg-white hover:border-gold/40"
                          ),
                    triggerClassName
                )}
            >
                <div className="flex items-center justify-center">
                    <motion.div
                        animate={{ rotate: variant === 'action' && isOpen ? 90 : 0 }}
                        className={cn("flex items-center justify-center", variant === 'filter' && !isOpen && "text-gold")}
                    >
                        {variant === 'filter' && !TriggerIcon ? <Settings2 size={16} /> : <TriggerIcon size={variant === 'action' ? 18 : 16} strokeWidth={2.5} />}
                    </motion.div>
                </div>
                
                {variant === 'filter' && (
                    <>
                        <span className="truncate max-w-[140px] tracking-tight">{triggerLabel || 'Filter'}</span>
                        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} className="ml-1 opacity-60">
                            <ChevronDown size={14} />
                        </motion.div>
                    </>
                )}
            </motion.button>

            {isOpen && createPortal(
                <AnimatePresence mode="wait">
                    <motion.div 
                        ref={dropdownRef}
                        initial={{ opacity: 0, scale: 0.95, y: coords.placement === 'bottom' ? -10 : 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: coords.placement === 'bottom' ? -10 : 10 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className={cn(
                            dropdownWidth,
                            "fixed bg-white rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.12)] border border-gold/20 py-1 z-9999 outline-none"
                        )}
                        style={{
                            top: coords.placement === 'bottom' ? coords.top : undefined,
                            bottom: coords.placement === 'top' ? (window.innerHeight - coords.top) : undefined,
                            left: coords.left - (dropdownWidth.includes('w-') ? parseInt(dropdownWidth.replace('w-', '')) * 4 : 256),
                        }}
                    >
                        {visibleItems.map((item, index) => (
                            <motion.button 
                                key={index}
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.02 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    item.onClick(e);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-all duration-200 font-bold group border-l-2 border-transparent",
                                    item.danger 
                                        ? "text-red-600 hover:bg-red-50 hover:border-red-600/50" 
                                        : "text-rosewood hover:bg-ivory hover:text-rosewood hover:border-gold/50",
                                    item.className
                                )}
                            >
                                <div className={cn(
                                    "flex items-center justify-center shrink-0 w-6 h-6 transition-all duration-200",
                                    item.danger ? "text-red-600" : "text-gold"
                                )}>
                                    <item.icon size={15} strokeWidth={2.5} />
                                </div>
                                <span className={cn(
                                    "truncate transition-colors",
                                    item.danger ? "group-hover:text-red-700" : "group-hover:text-rosewood font-extrabold"
                                )}>
                                    {item.label}
                                </span>
                            </motion.button>
                        ))}
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};
