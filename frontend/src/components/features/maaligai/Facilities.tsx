import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LazyBackground } from '@/components/ui/LazyBackground';
import LazyImage from '@/components/ui/shared/LazyImage';
import OrnamentalDivider from '@/components/ui/OrnamentalDivider';
import CornerFlourish from '@/components/ui/CornerFlourish';
import heroImage from '@/assets/images/maaligai/facilities/hero.jpg';
import mandapam from '@/assets/images/maaligai/facilities/mandapam.png';
import parkingImg from '@/assets/images/maaligai/facilities/parking.png';

interface FacilitiesHeroProps {}
interface FacilitiesCTAProps {}
interface MainHallProps {}
interface DiningHallProps {}
interface ParkingProps {}
interface FacilitiesListProps {}

export const FacilitiesHero: React.FC<FacilitiesHeroProps> = () => {
    const { t, i18n } = useTranslation('maaligai');
    const isTamil = i18n.language === 'ta';
    
    const ls = (enClasses: string, taClasses: string) => isTamil ? taClasses : enClasses;
    const fontDecorative = 'font-decorative';
    const fontSerif = isTamil ? 'font-tamil-serif' : 'font-heading';
    const fontDisplay = isTamil ? 'font-tamil-serif' : 'font-heading';
    const weight = (w: string) => w;
    const tracking = isTamil ? 'tracking-normal' : 'tracking-widest';
    const h1 = isTamil ? 'text-3xl md:text-5xl lg:text-6xl' : 'text-5xl md:text-7xl lg:text-8xl';

    return (
        <section className="relative h-[85vh] flex items-center justify-center overflow-hidden bg-[#1a1810]">
            <div className="absolute inset-0 z-0">
                <LazyBackground
                  src={heroImage}
                  alt="Facilities Hero"
                  className="w-full h-full object-cover"
                  containerClassName="w-full h-full"
                />
                <div className="absolute inset-0 bg-linear-to-b from-black/20 via-black/40 to-black/80"></div>
                <div className="absolute inset-0 kolam-pattern opacity-10"></div>
            </div>
            <div className="relative z-10 text-center px-6 max-w-5xl flex flex-col items-center reveal-frame">
                <p className={`reveal-item ${fontDecorative} text-primary ${ls('text-3xl md:text-6xl', 'text-xl md:text-3xl')} mb-6 ${weight('font-medium')}`}>{t('facilities.heroScript')}</p>
                <h2 className={`reveal-item delay-100 ${fontSerif} ${h1} text-white ${weight('font-black')} mb-8 ${ls('leading-tight', 'leading-[1.4]')}`}>{t('facilities.heroTitle')}</h2>
                <OrnamentalDivider
                    stretch
                    icon="local_florist"
                    iconColor="text-primary"
                    lineColor="text-primary"
                    iconSize="text-4xl"
                    className="reveal-item delay-200 mb-8 w-full"
                />
                <p className={`reveal-item delay-300 text-white ${weight('font-light')} ${fontDisplay} ${ls('text-lg md:text-2xl', 'text-sm md:text-lg')} ${tracking}`}>{t('facilities.heroSubtitle')}</p>
            </div>
        </section>
    );
};

export const MainHall: React.FC<MainHallProps> = () => {
    const { t, i18n } = useTranslation('maaligai');
    const isTamil = i18n.language === 'ta';
    
    const ls = (enClasses: string, taClasses: string) => isTamil ? taClasses : enClasses;
    const fontDecorative = 'font-decorative';
    const fontSerif = isTamil ? 'font-tamil-serif' : 'font-heading';
    const body = isTamil ? 'font-tamil-body text-sm md:text-[15px]' : 'font-body text-base md:text-lg';
    const h3 = isTamil ? 'text-3xl md:text-4xl' : 'text-4xl md:text-5xl';
    const weight = (w: string) => w;

    const hallFeatures = t('facilities.hallFeatures', { returnObjects: true }) as any[];

    return (
        <section className="px-6 lg:px-24 section-spacing bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 md:gap-24">
                <div className="flex-1 w-full reveal-frame">
                    <div className="reveal-item-left relative">
                        <div className="absolute -top-4 -left-4 w-full h-full border-2 border-sage-green rounded-2xl z-0"></div>
                        <LazyImage
                            alt={t('facilities.hallTitle')}
                            className="w-full h-[400px] md:h-[650px] object-cover rounded-2xl relative z-10 shadow-2xl"
                            src={mandapam}
                            containerClassName="w-full h-[400px] md:h-[650px] rounded-2xl relative z-10 shadow-2xl"
                        />
                    </div>
                </div>
                <div className="flex-1 space-y-10 text-center lg:text-left reveal-frame">
                    <div className="reveal-item-right delay-200 space-y-8">
                        <span className={`${fontDecorative} text-rosewood ${ls('text-4xl', 'text-2xl')} block mb-4`}>{t('facilities.hallLabel')}</span>
                        <h3 className={`${fontSerif} ${h3} ${weight('font-bold')} ${ls('leading-tight', 'leading-[1.4]')} text-rosewood mb-8`}>{t('facilities.hallTitle')}</h3>
                        <p className={`text-gray-600 ${ls('leading-relaxed', 'leading-[1.6]')} ${body}`}>{t('facilities.hallP1')}</p>
                        <ul className="space-y-8 text-left">
                            {hallFeatures.map((feat: { icon: string; title: string; desc: string }, i: number) => (
                                <li key={i} className="flex items-start gap-6 group">
                                    <span className="material-symbols-outlined text-rosewood text-3xl md:text-4xl transition-transform duration-500 group-hover:scale-110">{feat.icon}</span>
                                    <div>
                                        <h4 className={`${weight('font-bold')} ${ls('text-lg md:text-xl', 'text-base md:text-lg')} text-dark-gray mb-1`}>{feat.title}</h4>
                                        <p className={`text-gray-500 ${body} ${ls('leading-relaxed', 'leading-[1.6]')}`}>{feat.desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
};

export const DiningHall: React.FC<DiningHallProps> = () => {
    const { t, i18n } = useTranslation('maaligai');
    const isTamil = i18n.language === 'ta';
    
    const ls = (enClasses: string, taClasses: string) => isTamil ? taClasses : enClasses;
    const fontDecorative = 'font-decorative';
    const fontSerif = isTamil ? 'font-tamil-serif' : 'font-heading';
    const body = isTamil ? 'font-tamil-body text-sm md:text-[15px]' : 'font-body text-base md:text-lg';
    const h3 = isTamil ? 'text-3xl md:text-4xl' : 'text-4xl md:text-5xl';
    const weight = (w: string) => w;

    const diningGrid = t('facilities.diningGrid', { returnObjects: true }) as any[];

    return (
        <section className="px-6 lg:px-24 section-spacing bg-sage-green/10">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row-reverse items-center gap-16 md:gap-24">
                <div className="flex-1 w-full reveal-frame">
                    <div className="reveal-item-right relative">
                        <div className="absolute -top-4 -left-4 w-full h-full border-2 border-sage-green rounded-2xl z-0"></div>
                        <LazyImage
                            alt={t('facilities.diningTitle')}
                            className="w-full h-[400px] md:h-[650px] object-cover rounded-2xl relative z-10 shadow-2xl"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC37Q5iRAl1WzVU2S78ZKjciWGPp8u7RwQXkXPYw1FL5s7-al2lpv5z29o6uvLGbF1DIr9EnB22NqgTbgTgizhN3UjfBhR_HMShP7mp7Xw0Ol9Rsx3ZTj6Z5oMPbN3KCBWLQMvFweUAYs3i6O9lrxXk2e34HD7e8An-Ubwm6Db9l5qHB72cKMJqJbRd2ZwZbyQQZUAX0zdgRAMlFj2Q4WS6-rK102PW0DWjc1PxByV-a2TN5dybqcePrLxCQC5efWnSKDRQ2JUZJVk"
                            containerClassName="w-full h-[400px] md:h-[650px] rounded-2xl relative z-10 shadow-2xl"
                        />
                    </div>
                </div>
                <div className="flex-1 space-y-10 text-center lg:text-left reveal-frame">
                    <div className="reveal-item-left delay-200 space-y-8">
                        <span className={`${fontDecorative} text-rosewood ${ls('text-4xl', 'text-2xl')} block mb-4`}>{t('facilities.diningLabel')}</span>
                        <h3 className={`${fontSerif} ${h3} ${weight('font-bold')} ${ls('leading-tight', 'leading-[1.4]')} text-rosewood mb-8`}>{t('facilities.diningTitle')}</h3>
                        <p className={`text-gray-600 ${ls('leading-relaxed', 'leading-[1.6]')} ${body}`}>{t('facilities.diningP1')}</p>
                        <div className="grid grid-cols-1 gap-5 text-left">
                            {diningGrid.map((item: { icon: string; text: string }, i: number) => (
                                <div key={i} className="flex items-center gap-6 bg-white p-6 rounded-2xl shadow-sm border border-sage-green/20">
                                    <span className="material-symbols-outlined text-rosewood text-2xl md:text-3xl">{item.icon}</span>
                                    <span className={`text-dark-gray ${weight('font-semibold')} ${ls('text-base md:text-lg', 'text-sm md:text-base')}`}>{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export const Parking: React.FC<ParkingProps> = () => {
    const { t, i18n } = useTranslation('maaligai');
    const isTamil = i18n.language === 'ta';
    
    const ls = (enClasses: string, taClasses: string) => isTamil ? taClasses : enClasses;
    const fontDecorative = 'font-decorative';
    const fontSerif = isTamil ? 'font-tamil-serif' : 'font-heading';
    const body = isTamil ? 'font-tamil-body text-sm md:text-[15px]' : 'font-body text-base md:text-lg';
    const h3 = isTamil ? 'text-3xl md:text-4xl' : 'text-4xl md:text-5xl';
    const weight = (w: string) => w;

    const parkingGrid = t('facilities.parkingGrid', { returnObjects: true }) as any[];

    return (
        <section className="px-6 lg:px-24 section-spacing bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 md:gap-24">
                <div className="flex-1 w-full reveal-frame">
                    <div className="reveal-item-left relative">
                        <div className="absolute -top-4 -left-4 w-full h-full border-2 border-sage-green rounded-2xl z-0"></div>
                        <LazyImage
                            alt={t('facilities.parkingTitle')}
                            className="w-full h-[350px] md:h-[600px] object-cover rounded-2xl relative z-10 shadow-2xl"
                            src={parkingImg}
                            containerClassName="w-full h-[350px] md:h-[600px] rounded-2xl relative z-10 shadow-2xl"
                        />
                    </div>
                </div>
                <div className="flex-1 space-y-10 text-center lg:text-left reveal-frame">
                    <div className="reveal-item-right delay-200 space-y-8">
                        <span className={`${fontDecorative} text-rosewood ${ls('text-4xl', 'text-2xl')} block mb-4`}>{t('facilities.parkingLabel')}</span>
                        <h3 className={`${fontSerif} ${h3} ${weight('font-bold')} ${ls('leading-tight', 'leading-[1.4]')} text-rosewood mb-8`}>{t('facilities.parkingTitle')}</h3>
                        <p className={`text-gray-600 ${ls('leading-relaxed', 'leading-[1.6]')} ${body}`}>{t('facilities.parkingP1')}</p>
                        <div className="grid grid-cols-1 gap-5 text-left">
                            {parkingGrid.map((item: { icon: string; text: string }, i: number) => (
                                <div key={i} className="flex items-center gap-6 bg-sage-green/20 p-6 rounded-2xl shadow-sm border border-sage-green/20">
                                    <span className="material-symbols-outlined text-rosewood text-2xl md:text-3xl">{item.icon}</span>
                                    <span className={`text-dark-gray ${weight('font-semibold')} ${ls('text-base md:text-lg', 'text-sm md:text-base')}`}>{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export const FacilitiesList: React.FC<FacilitiesListProps> = () => {
    const { t, i18n } = useTranslation('maaligai');
    const isTamil = i18n.language === 'ta';

    const ls = (enClasses: string, taClasses: string) => isTamil ? taClasses : enClasses;
    const fontDecorative = 'font-decorative';
    const fontSerif = isTamil ? 'font-tamil-serif' : 'font-heading';
    const h2 = isTamil ? 'text-2xl md:text-3xl lg:text-4xl' : 'text-3xl md:text-5xl';
    const weight = (w: string) => w;

    const glanceItems = t('facilities.glanceItems', { returnObjects: true }) as any[];

    const [isMobile, setIsMobile] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const touchXRef = useRef(0);

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 639px)');
        setIsMobile(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    const goNext = useCallback(() => {
        setActiveIndex((prev) => (prev + 1) % glanceItems.length);
    }, [glanceItems.length]);

    const goPrev = useCallback(() => {
        setActiveIndex((prev) => (prev - 1 + glanceItems.length) % glanceItems.length);
    }, [glanceItems.length]);

    const startAutoSlide = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(goNext, 3000);
    }, [goNext]);

    const stopAutoSlide = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (isMobile) startAutoSlide();
        else stopAutoSlide();
        return stopAutoSlide;
    }, [isMobile, startAutoSlide, stopAutoSlide]);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchXRef.current = e.touches[0].clientX;
        stopAutoSlide();
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        const diff = touchXRef.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) goNext();
            else goPrev();
        }
        setTimeout(startAutoSlide, 5000);
    };

    const card = (item: { icon: string; label: string }, idx: number) => (
        <div
            key={idx}
            className="group flex flex-col items-center justify-center p-8 bg-white border border-gold-accent/10 rounded-2xl shadow-sm h-48 shrink-0 w-full"
        >
            <span className="material-symbols-outlined text-rosewood text-4xl mb-4">{item.icon}</span>
            <h3 className={`${fontSerif} ${weight('font-bold')} text-dark-gray ${ls('text-lg', 'text-base')}`}>{item.label}</h3>
        </div>
    );

    return (
        <section className="bg-ivory-tint section-spacing relative">
            <CornerFlourish />

            <div className="max-w-7xl mx-auto px-6 lg:px-20 py-16 lg:py-0 text-center reveal-frame pt-8 pb-8 relative z-10">
                <p className={`${fontDecorative} text-gold-accent ${ls('text-4xl', 'text-2xl')} mb-4 reveal-item`}>{t('facilities.glanceLabel')}</p>
                <h2 className={`text-rosewood ${h2} ${fontSerif} ${weight('font-bold')} mb-16 reveal-item delay-100`}>{t('facilities.glanceTitle')}</h2>

                {isMobile ? (
                    <div
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        onMouseEnter={stopAutoSlide}
                        onMouseLeave={startAutoSlide}
                        className="flex flex-col items-center gap-6"
                    >
                        <div className="relative w-full overflow-hidden">
                            <div
                                className="flex transition-transform duration-500 ease-in-out"
                                style={{ transform: `translateX(-${activeIndex * 100}%)` }}
                            >
                                {glanceItems.map((item: { icon: string; label: string }, idx: number) => (
                                    <div key={idx} className="min-w-0 w-full shrink-0">
                                        {card(item, idx)}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {glanceItems.map((_: any, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => { setActiveIndex(idx); stopAutoSlide(); setTimeout(startAutoSlide, 5000); }}
                                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === activeIndex ? 'bg-rosewood w-3' : 'bg-rosewood/30'}`}
                                    aria-label={`Go to slide ${idx + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
                        {glanceItems.map((item: { icon: string; label: string }, idx: number) => {
                            const delayClass = `delay-${(idx % 5 + 1) * 100}`;
                            return (
                                <div key={idx} className={`reveal-item ${delayClass}`}>
                                    {card(item, idx)}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
};

export const FacilitiesCTA: React.FC<FacilitiesCTAProps> = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation('maaligai');
    const isTamil = i18n.language === 'ta';
    
    const fontSerif = isTamil ? 'font-tamil-serif' : 'font-heading';
    const fontDisplay = isTamil ? 'font-tamil-serif' : 'font-heading';
    const h2 = isTamil ? 'text-2xl md:text-3xl lg:text-4xl' : 'text-3xl md:text-5xl';
    const weight = (w: string) => w;
    const label = 'uppercase tracking-widest';

    return (
        <section className="bg-rosewood section-spacing text-center px-6 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 flex items-center justify-center pointer-events-none">
                <span className="material-symbols-outlined text-[300px] text-primary">temple_hindu</span>
            </div>

            <CornerFlourish color='text-ivory-tint' />

            <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center reveal-frame">
                <div className="reveal-item">
                    <h2 className={`text-white ${weight('font-bold')} mb-12 leading-tight ${fontSerif} ${h2}`}>{t('facilities.ctaText')}</h2>
                    <button
                        onClick={() => navigate('/maaligai/gallery')}
                        className={`btn-shine group relative px-12 py-6 bg-primary text-dark-gray ${weight('font-black')} shadow-2xl active:scale-95 rounded-sm transition-all ${fontDisplay} ${label} text-lg`}
                    >
                        {t('facilities.ctaBtn')}
                    </button>
                </div>
            </div>
        </section>
    );
};
