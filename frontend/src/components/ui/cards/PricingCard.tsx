import React from 'react';
import { Card } from './Card';

interface PricingCardProps {
    id: string;
    name: string;
    price: number;
    priceLabel?: string;
    period?: string;
    features: string[];
    isPremium?: boolean;
    headerIcon?: React.ReactNode;
    subtitle?: string;
    featuresLabel?: string;
    actionArea?: React.ReactNode;
    badge?: React.ReactNode;
    className?: string;
}

export const PricingCard: React.FC<PricingCardProps> = (props) => {
    const {
        name, price, priceLabel, period, features, isPremium = false,
        headerIcon, subtitle, featuresLabel, actionArea, badge, className = ''
    } = props;

    return (
        <Card
            variant="pricing"
            name={name}
            price={price}
            priceLabel={priceLabel}
            period={period}
            features={features}
            isPremium={isPremium}
            headerIcon={headerIcon}
            subtitle={subtitle}
            featuresLabel={featuresLabel}
            actionArea={actionArea}
            badge={badge}
            className={className}
        />
    );
};
