import React from 'react';
import { clsx } from 'clsx';
import { CheckCircle2, XCircle, Clock, AlertCircle, type LucideIcon } from 'lucide-react';

const colorMap: Record<BadgeColor, { bg: string; text: string; border: string; iconBg: string }> = {
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', iconBg: '' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', iconBg: '' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100', iconBg: '' },
    red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', iconBg: '' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', iconBg: '' },
    gold: { bg: 'bg-ivory', text: 'text-gold', border: 'border-gold/20', iconBg: '' },
    sage: { bg: 'bg-sage/10', text: 'text-sage', border: 'border-sage/20', iconBg: '' },
    rosewood: { bg: 'bg-rosewood/10', text: 'text-rosewood', border: 'border-rosewood/20', iconBg: '' },
    slate: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100', iconBg: '' },
};

const defaultIcons: Record<string, LucideIcon> = {
    amber: Clock,
    blue: Clock,
    green: CheckCircle2,
    red: XCircle,
    rose: XCircle,
    gold: Clock,
    sage: CheckCircle2,
    rosewood: XCircle,
    slate: AlertCircle,
};

export type BadgeColor = 'amber' | 'blue' | 'green' | 'red' | 'rose' | 'gold' | 'sage' | 'rosewood' | 'slate';

export interface BadgeProps {
    color?: BadgeColor;
    label?: string;
    icon?: LucideIcon | React.ReactNode;
    minimal?: boolean;
    className?: string;
    children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
    color = 'slate',
    label,
    icon,
    minimal = false,
    className,
    children,
}) => {
    const c = colorMap[color];
    const Icon = icon || defaultIcons[color] || AlertCircle;

    const renderIcon = () => {
        if (!Icon) return null;
        
        // Handle React.lazy components or other objects with $$typeof
        if (typeof Icon === 'object' && Icon !== null && '$$typeof' in Icon) {
            // This is a React element or lazy component, try to render if it's a valid element
            if (React.isValidElement(Icon)) return Icon;
            // If it's a lazy component or other non-element, don't render
            return null;
        }
        
        if (React.isValidElement(Icon)) return Icon;
        
        if (typeof Icon === 'function') {
            const IconComp = Icon as React.ComponentType<any>;
            return <IconComp size={12} strokeWidth={2.5} />;
        }
        
        return null;
    };

    const displayContent = label || children;

    // Ensure displayContent is a valid React child (not an object like lazy component)
    const safeDisplayContent = React.isValidElement(displayContent)
        ? displayContent
        : typeof displayContent === 'object' && displayContent !== null && '$$typeof' in displayContent
        ? String(displayContent)  // Convert objects (like lazy components) to string
        : displayContent;

    if (minimal) {
        return (
            <span className={clsx('inline-flex items-center gap-1.5 text-xs font-bold', c.text, className)}>
                {renderIcon()}
                {safeDisplayContent}
            </span>
        );
    }

    return (
        <span className={clsx('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border font-bold', c.bg, c.text, c.border, className)}>
            {renderIcon()}
            {safeDisplayContent}
        </span>
    );
};
