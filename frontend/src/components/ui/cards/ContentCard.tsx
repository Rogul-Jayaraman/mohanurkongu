import React from 'react';
import { Card } from './Card';

interface ContentCardProps {
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
    variant?: 'white' | 'ivory' | 'glass';
}

export const ContentCard: React.FC<ContentCardProps> = ({ children, className = '', noPadding = false, variant = 'ivory' }) => {
    return (
        <Card variant="content" cardVariant={variant} noPadding={noPadding} className={className}>
            {children}
        </Card>
    );
};
