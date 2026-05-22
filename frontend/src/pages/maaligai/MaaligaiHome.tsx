import React, { useEffect } from 'react';
import { HomeHero, WhyUs, Testimonials, Stats, GalleryPreview, HomeCTA, BookingSteps, HomeAboutSection } from '@/components/features/maaligai/Home';
import OrnamentalDivider from '@/components/ui/OrnamentalDivider';

const MaaligaiHome: React.FC = () => {
    useEffect(() => {
        const observerOptions = {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        const revealFrames = document.querySelectorAll('.reveal-frame');
        revealFrames.forEach(frame => {
            frame.classList.add('is-ready');
            observer.observe(frame);
        });

        return () => observer.disconnect();
    }, []);

    return (
        <main className="min-h-screen bg-background-light selection:bg-rosewood selection:text-white overflow-x-hidden">
            <HomeHero />

            <div className="relative z-10">
                <Stats />
               <div className='py-4 md:py-8'></div>
                <OrnamentalDivider />

                <HomeAboutSection />

                <WhyUs />

                <BookingSteps />

                <GalleryPreview />

                <Testimonials />

                <HomeCTA />
            </div>
        </main>
    );
};

export default MaaligaiHome;
