import React from 'react';
import { Card } from './Card';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon | React.ReactNode;
    color?: string;
    delay?: number;
    className?: string;
    isLoading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = (props) => {
    const { label, value, icon, color = 'text-gold bg-ivory-dark', delay = 0, className = '', isLoading = false } = props;
    return (
        <Card
            variant="stat"
            label={label}
            value={value}
            icon={icon}
            iconColor={color}
            delay={delay}
            isLoading={isLoading}
            className={className}
            animate
        />
    );
};
