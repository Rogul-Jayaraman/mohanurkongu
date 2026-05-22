import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Crown, ShieldCheck, CheckCircle2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const isComponent = (x: unknown): x is React.ComponentType<{ size?: number }> =>
    typeof x === 'function' || (typeof x === 'object' && x !== null);

const bgMap: Record<CardVariant, string> = {
    base: 'bg-white',
    stat: 'bg-ivory-tint',
    action: 'bg-white',
    pricing: 'bg-[#fdfbf4]',
    content: '',
};

export type CardVariant = 'base' | 'stat' | 'action' | 'pricing' | 'content';

interface BaseCardProps {
    className?: string;
    children?: React.ReactNode;
    as?: React.ElementType;
    onClick?: () => void;
    border?: boolean;
    hover?: boolean;
    animate?: boolean;
}

interface StatCardVariantProps {
    variant: 'stat';
    label?: string;
    value?: string | number;
    icon?: LucideIcon | React.ReactNode;
    iconColor?: string;
    isLoading?: boolean;
    delay?: number;
}

interface ActionCardVariantProps {
    variant: 'action';
    title?: string;
    description?: string;
    icon?: LucideIcon | React.ReactNode;
    delay?: number;
}

interface PricingCardVariantProps {
    variant: 'pricing';
    name?: string;
    price?: number;
    priceLabel?: string;
    period?: string;
    features?: string[];
    isPremium?: boolean;
    headerIcon?: React.ReactNode;
    subtitle?: string;
    featuresLabel?: string;
    actionArea?: React.ReactNode;
    badge?: React.ReactNode;
}

interface ContentCardVariantProps {
    variant: 'content';
    cardVariant?: 'white' | 'ivory' | 'glass';
    noPadding?: boolean;
}

interface BaseCardOnlyProps {
    variant?: 'base';
}

export type CardProps = BaseCardProps & (
    | StatCardVariantProps
    | ActionCardVariantProps
    | PricingCardVariantProps
    | ContentCardVariantProps
    | BaseCardOnlyProps
);

const contentBgMap: Record<string, string> = {
    white: 'bg-white border-gold/20 shadow-sm',
    ivory: 'bg-ivory-tint border-gold/20 shadow-sm',
    glass: 'bg-white/40 backdrop-blur-md border-white/40 shadow-xl',
};

export const Card: React.FC<CardProps> = ({
    variant = 'base',
    className,
    children,
    as: As,
    onClick,
    border = true,
    hover = false,
    animate = false,
    ...rest
}) => {
    if (variant === 'stat') {
        const props = rest as Omit<StatCardVariantProps, 'variant'>;
        const { label, value, icon: Icon, iconColor = 'text-gold bg-ivory-dark', isLoading = false, delay = 0 } = props;

        return (
            <motion.div
                initial={animate ? { opacity: 0, y: 10 } : undefined}
                animate={animate ? { opacity: 1, y: 0 } : undefined}
                transition={animate ? { delay } : undefined}
                className={clsx('p-6 rounded-xl border border-gold/10 flex items-center gap-5 shadow-sm', bgMap.stat, className)}
            >
                <div className={clsx('w-12 h-12 rounded-full flex items-center justify-center shrink-0', isLoading ? 'bg-slate-100 animate-pulse' : iconColor)}>
                    {!isLoading && isComponent(Icon) && <Icon size={20} />}
                </div>
                <div className="grow">
                    <p className="text-slate-500 text-xs font-bold mb-0.5 uppercase tracking-wide">{label}</p>
                    {isLoading ? (
                        <div className="h-8 w-16 bg-slate-100 rounded-lg animate-pulse mt-1" />
                    ) : (
                        <p className="text-2xl font-serif font-bold text-rosewood">{value}</p>
                    )}
                </div>
            </motion.div>
        );
    }

    if (variant === 'action') {
        const props = rest as Omit<ActionCardVariantProps, 'variant'>;
        const { title, description, icon: Icon, delay = 0 } = props;
        const MotionTag = onClick ? (motion.button as typeof motion.div) : motion.div;

        const content = (
            <>
                <div className="text-gold group-hover:scale-110 transition-transform duration-300">
                    {isComponent(Icon) && <Icon size={20} />}
                </div>
                <div>
                    <h4 className="text-rosewood font-bold text-sm">{title}</h4>
                    {description && <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{description}</p>}
                </div>
            </>
        );

        return (
            <MotionTag
                onClick={onClick}
                initial={animate ? { opacity: 0, scale: 0.95 } : undefined}
                animate={animate ? { opacity: 1, scale: 1 } : undefined}
                transition={animate ? { delay } : undefined}
                whileTap={onClick ? { scale: 0.98 } : undefined}
                className={clsx('flex flex-col items-start gap-3 p-6 border border-gold/20 rounded-xl shadow-sm text-left group hover:border-gold/40 transition-colors', bgMap.action, className)}
            >
                {content}
            </MotionTag>
        );
    }

    if (variant === 'pricing') {
        const props = rest as Omit<PricingCardVariantProps, 'variant'>;
        const {
            name, price, priceLabel, period, features, isPremium = false,
            headerIcon, subtitle, featuresLabel, actionArea, badge: badgeEl,
        } = props;

        return (
            <motion.div
                whileHover={{ y: -4 }}
                className={clsx(
                    'relative flex flex-col h-full rounded-xl shadow-sm hover:shadow-lg transition-all duration-500 overflow-hidden',
                    isPremium
                        ? 'bg-ivory border-t-4 border-gold/40 shadow-md'
                        : 'bg-white border border-gold/15',
                    className
                )}
            >
                {isPremium && badgeEl && <div className="absolute top-4 right-4 z-20">{badgeEl}</div>}
                <div className="relative flex flex-col flex-1 p-8 lg:p-9">
                    <div className="flex items-center gap-3.5 mb-6">
                        <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', isPremium ? 'bg-rosewood text-gold shadow-sm' : 'bg-gold/10 text-gold')}>
                            {headerIcon || (isPremium ? <Crown size={20} /> : <ShieldCheck size={20} />)}
                        </div>
                        <div>
                            <h4 className="font-serif text-xl font-black text-rosewood leading-tight">{name}</h4>
                            {subtitle && <p className="text-[9px] font-bold text-gold uppercase tracking-widest mt-0.5">{subtitle}</p>}
                        </div>
                    </div>
                    <div className="flex items-baseline gap-1.5 mb-6">
                        {priceLabel ? (
                            <span className="text-3xl font-serif font-black text-rosewood">{priceLabel}</span>
                        ) : (
                            <span className="text-3xl font-serif font-black text-rosewood">₹{price?.toLocaleString('en-IN')}</span>
                        )}
                        {period && <span className="text-xs font-semibold text-slate-400 ml-1">{period}</span>}
                    </div>
                    <div className="h-px bg-gold/10 w-full mb-7" />
                    <div className="flex-1">
                        {featuresLabel && <h5 className="text-[10px] font-black text-slate-400 mb-5 uppercase tracking-widest">{featuresLabel}</h5>}
                        <ul className="space-y-3.5">
                            {features?.map((feature, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <CheckCircle2
                                        size={16}
                                        className={clsx('mt-0.5 shrink-0', isPremium ? 'text-gold' : 'text-gold/40')}
                                    />
                                    <span className="text-sm text-slate-700 leading-relaxed font-medium">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    {actionArea && <div className="mt-8">{actionArea}</div>}
                </div>
            </motion.div>
        );
    }

    if (variant === 'content') {
        const props = rest as Omit<ContentCardVariantProps, 'variant'>;
        const { cardVariant = 'ivory', noPadding = false } = props;
        return (
            <div className={clsx('rounded-xl border overflow-hidden', contentBgMap[cardVariant], noPadding ? '' : 'p-6 md:p-8', className)}>
                {children}
            </div>
        );
    }

    const Tag = As || 'div';

    return (
        <Tag
            onClick={onClick}
            className={clsx('rounded-xl', border && 'border border-gold/20', hover && 'hover:border-gold/40 hover:shadow-lg transition-all', bgMap.base, className)}
        >
            {children}
        </Tag>
    );
};
