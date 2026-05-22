import React from 'react';
import { useLocation } from 'react-router-dom';
import { ContactHero, InquiryForm, LocationMap } from '@/components/features/maaligai/Contact';

const MaaligaiContact: React.FC = () => {
    const location = useLocation();

    React.useEffect(() => {
        if (location.hash) {
            const element = document.getElementById(location.hash.substring(1));
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [location]);

    return (
        <div className="bg-background-light overflow-hidden">
            <ContactHero />
            <InquiryForm />
            <LocationMap />
        </div>
    );
};

export default MaaligaiContact;
