import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
    title: string;
    icon?: LucideIcon | React.ReactNode;
    action?: React.ReactNode;
    className?: string;
    description?: string;
    subtitle?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ 
    title, 
    icon: Icon, 
    action, 
    className = "",
    description,
    subtitle
}) => {
    const text = description || subtitle;

    return (
        <div className={`flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-0 border-b border-gold/10 pb-4 ${className}`}>
            <div>
                <div className="flex items-center gap-3 ">
                    {Icon ? (
                        <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold shrink-0">
                            {typeof Icon === 'function' ? (
                                <Icon size={20} />
                            ) : typeof Icon === 'object' && Icon !== null && 'render' in Icon ? (
                                React.createElement(Icon as unknown as React.ComponentType<{ size?: number }>, { size: 20 })
                            ) : (
                                Icon
                            )}
                        </div>
                    ) : (
                        <div className="h-6 w-1 bg-gold rounded-full shrink-0" />
                    )}
                    <h3 className="text-xl font-serif font-bold text-rosewood">{title}</h3>
                </div>
                {text && (
                    <p className="text-slate-600 text-xs italic ml-4">{text}</p>
                )}
            </div>
            {action && (
                <div className="shrink-0">{action}</div>
            )}
        </div>
    );
};
