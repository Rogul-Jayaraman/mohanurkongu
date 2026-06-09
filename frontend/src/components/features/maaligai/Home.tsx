import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LazyBackground } from '@/components/ui/LazyBackground';
import LazyImage from '@/components/ui/shared/LazyImage';
import OrnamentalDivider from '@/components/ui/OrnamentalDivider';
import DiamondDivider from '@/components/ui/DiamondDivider';
import CornerFlourish from '@/components/ui/CornerFlourish';
import type { Variants } from 'framer-motion';
import heroImage from '@/assets/images/maaligai/home/hero.jpg';
import entrance from '@/assets/images/maaligai/home/about.jpg';
import { GalleryDisplayer } from './Gallery';

interface HomeHeroProps {}
interface WhyUsProps {}
interface TestimonialsProps {}
interface StatsProps {}
interface GalleryPreviewProps {}
interface CTAProps {}
interface BookingStepsProps {}
interface AboutSectionProps {}

export const HomeHero: React.FC<HomeHeroProps> = () => {
    const { t, i18n } = useTranslation('maaligai');
    const isTamil = i18n.language === 'ta';
    const navigate = useNavigate();

    const ls = (enClasses: string, taClasses: string) => isTamil ? taClasses : enClasses;
    const fontDecorative = 'font-decorative';
    const fontSerif = isTamil ? 'font-tamil-serif' : 'font-heading';
    const body = 'font-body';
    const weight = (en: string, ta: string) => isTamil ? ta : en;
    const tracking = isTamil ? 'tracking-normal' : 'tracking-widest';
    const h1 = 'text-3xl md:text-7xl';

    return (
        <section className="relative h-[85vh] md:h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 z-0 overflow-hidden">
                <LazyBackground
                  src={heroImage}
                  alt="Kongu Thirumana Malaigai Hall"
                  priority={true}
                  className="w-full h-full object-cover"
                  containerClassName="w-full h-full absolute inset-0"
                />
                <div className="absolute inset-0 bg-linear-to-b from-primary/30 via-black/50 to-ivory-tint/30"></div>
            </div>

            <div className="relative z-10 text-center px-4 sm:px-6 max-w-6xl flex flex-col items-center">
                <div className="reveal-frame">
                    <p className={`reveal-item ${fontDecorative} text-primary text-2xl md:text-5xl mb-4 drop-shadow-lg`}>
                        {t('home.hero.welcome')}
                    </p>
                </div>

                <div className="reveal-frame">
                    <h2 className={`reveal-item delay-100 ${fontSerif} ${h1} text-white ${weight('font-black', 'font-bold')} mb-6 ${ls('leading-tight', 'leading-[1.4]')} drop-shadow-2xl`}>
                        {t('home.hero.title')}
                    </h2>
                </div>

                <div className="reveal-frame w-full max-w-md">
                    <OrnamentalDivider
                        stretch
                        icon="spa"
                        iconColor="text-primary"
                        lineColor="text-primary"
                        iconSize="text-3xl md:text-5xl"
                        className="mb-8 w-full"
                    />
                </div>

                <div className="reveal-frame">
                    <p className={`reveal-item delay-300 text-white ${body} font-light mb-12 ${tracking} drop-shadow-md max-w-3xl ${ls('leading-relaxed', 'leading-[1.6]')}`}>
                        {t('home.hero.subtitle')}
                    </p>
                </div>

                <div className="reveal-frame">
                    <div className="reveal-item delay-400 flex flex-col sm:flex-row gap-6 justify-center w-full max-w-[300px] sm:max-w-none">
                        <button
                        onClick={() => navigate('/maaligai/hall-availability')}
                            className={`btn-shine bg-primary text-dark-gray px-10 md:px-14 py-4 md:py-5 rounded-lg ${weight('font-black', 'font-bold')} text-sm md:text-lg transition-all shadow-2xl active:scale-95`}
                        >
                            {t('home.hero.bookDate')}
                        </button>
                        <button
                            onClick={() => navigate('/maaligai/facilities')}
                            className={`btn-shine border-2 border-primary/50 text-white px-10 md:px-14 py-4 md:py-5 rounded-lg ${weight('font-black', 'font-bold')} text-sm md:text-lg transition-all backdrop-blur-md active:scale-95`}
                        >
                            {t('home.hero.viewGallery')}
                        </button>
                    </div>
                </div>
            </div>

            <div className="hidden md:block absolute bottom-10 lg:bottom-20 left-1/2 -translate-x-1/2 z-20 reveal-frame">
                <div className="reveal-item delay-500 cursor-pointer group" onClick={() => window.scrollTo({ top: window.innerHeight * 0.85, behavior: 'smooth' })}>
                    <span className="material-symbols-outlined text-3xl text-primary/80 group-hover:translate-y-2 transition-transform duration-500">expand_more</span>
                </div>
            </div>
        </section>
    );
};

export const WhyUs: React.FC<WhyUsProps> = () => {
    const { t, i18n } = useTranslation('maaligai');
    const isTamil = i18n.language === 'ta';

    const ls = (enClasses: string, taClasses: string) => isTamil ? taClasses : enClasses;
    const fontDecorative = 'font-decorative';
    const fontSerif = isTamil ? 'font-tamil-serif' : 'font-heading';
    const body = 'font-body';
    const h2 = 'text-3xl md:text-5xl';
    const h3 = 'text-xl md:text-2xl';
    const weight = (w: string) => w;

    const items = t('home.whyUs.items', { returnObjects: true }) as Array<{icon: string, title: string, desc: string}>;

    return (
        <section className="bg-ivory-tint section-spacing relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 lg:px-20 text-center reveal-frame">
                <div className="reveal-item">
                    <p className={`${fontDecorative} text-gold-accent text-4xl mb-4`}>{t('home.whyUs.script')}</p>
                    <h2 className={`${fontSerif} text-rosewood ${h2} ${weight('font-bold')} mb-16`}>{t('home.whyUs.heading')}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-y-16 gap-x-12">
                    {items.map((item: any, index: number) => (
                        <div key={index} className="flex flex-col items-center text-center px-4 reveal-item" style={{ transitionDelay: `${index * 100}ms` }}>
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border border-primary/10 transition-colors">
                                <span className="material-symbols-outlined text-gold-accent text-4xl">{item.icon}</span>
                            </div>
                            <h4 className={`${fontSerif} text-rosewood ${h3} ${weight('font-bold')} mb-3`}>{item.title}</h4>
                            <p className={`text-dark-gray/70 ${ls('leading-relaxed', 'leading-[1.6]')} ${body}`}>{item.desc}</p>
                        </div>
                    ))}
                </div>
                <DiamondDivider className="mt-16" />
            </div>
        </section>
    );
};

export const Testimonials: React.FC<TestimonialsProps> = () => {
    const { t, i18n } = useTranslation('maaligai');
    const isTamil = i18n.language === 'ta';

    const ls = (enClasses: string, taClasses: string) => isTamil ? taClasses : enClasses;
    const fontDecorative = 'font-decorative';
    const fontSerif = isTamil ? 'font-tamil-serif' : 'font-heading';
    const fontDisplay = isTamil ? 'font-tamil-body' : 'font-body';
    const h2 = 'text-3xl md:text-5xl';
    const italic = '';

    const items = t('home.testimonials.items', { returnObjects: true }) as Array<{quote: string, author: string, location: string}>;

    return (
        <section className="section-spacing bg-rosewood/5 relative overflow-hidden">
            <div className="absolute top-10 right-10 opacity-5 pointer-events-none">
                <span className="material-symbols-outlined text-[100px] text-rosewood">favorite</span>
            </div>

            <div className="reveal-frame text-center mb-16">
                <div className="reveal-item">
                    <p className={`${fontDecorative} text-gold-accent text-4xl mb-4`}>{t('home.testimonials.script')}</p>
                    <h2 className={`${fontSerif} text-rosewood ${h2} font-bold`}>{t('home.testimonials.heading')}</h2>
                    <div className="h-[2px] w-24 bg-primary mx-auto mt-4"></div>
                </div>
            </div>

            <div className="px-6 lg:px-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {items.map((item: any, idx: number) => (
                    <div key={idx} className="reveal-frame h-full">
                        <div className={`reveal-item h-full bg-white p-10 rounded-2xl shadow-xl border border-rosewood/5 relative hover:-translate-y-2 transition-all duration-300 group`} style={{ transitionDelay: `${idx * 150}ms` }}>
                            <span className="material-symbols-outlined text-rosewood/10 absolute top-4 left-4 text-7xl font-bold">format_quote</span>
                            <p className={`${fontSerif} ${italic} text-lg mb-8 ${ls('leading-relaxed', 'leading-[1.6]')} text-gray-700 relative z-10`}>
                                "{item.quote}"
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-rosewood text-2xl">person</span>
                                </div>
                                <div>
                                    <p className={`${fontDisplay} font-bold text-sm text-dark-gray`}>{item.author}</p>
                                    <p className={`${fontDisplay} text-xs text-gray-500`}>{item.location}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export const Stats: React.FC<StatsProps> = () => {
    const { t, i18n } = useTranslation('maaligai');
    const isTamil = i18n.language === 'ta';

    const ls = (enClasses: string, taClasses: string) => isTamil ? taClasses : enClasses;
    const h3 = 'text-2xl md:text-3xl';
    const label = isTamil ? 'tracking-normal' : 'tracking-widest uppercase';
    const fontDisplay = isTamil ? 'font-tamil-serif' : 'font-heading';
    const weight = (w: string) => w;

    const stats = [
        { icon: 'groups', value: '1000+', label: t('home.stats.guests') },
        { icon: 'directions_car', value: '500+', label: t('home.stats.parking') },
        { icon: 'restaurant', value: '300+', label: t('home.stats.dining') },
        { icon: 'bed', value: '7+', label: t('home.stats.rooms') },
        { icon: 'flatware', value: '3000+', label: t('home.stats.buffet') },
    ];

    return (
        <section className="px-4 md:px-6 lg:px-20 mt-12 mb-12 md:-mt-16 md:mb-0 relative z-20">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 lg:grid-cols-5 gap-4 md:gap-6">
                {stats.map((stat, idx) => {
                    const colSpan = idx === 4 ? 'sm:col-span-full' : '';
                    const mdSpan = 'md:col-span-2';
                    const mdStart = idx === 3 ? 'md:col-start-2' : idx === 4 ? 'md:col-start-4' : '';
                    const lgReset = idx === 3 || idx === 4 ? 'lg:col-span-1 lg:col-start-auto' : 'lg:col-span-1';
                    const gridClass = `reveal-frame ${colSpan} ${mdSpan} ${mdStart} ${lgReset}`.trim().replace(/\s+/g, ' ');
                    return (
                    <div key={idx} className={gridClass}>
                        <div className={`reveal-item h-full`} style={{ transitionDelay: `${idx * 100}ms` }}>
                            <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg md:shadow-2xl border-t-4 border-rose-beige flex flex-col items-center text-center transition-all hover:-translate-y-2 h-full">
                                <span className="material-symbols-outlined text-rosewood text-3xl md:text-4xl mb-3 md:mb-4">{stat.icon}</span>
                                <h3 className={`${fontDisplay} ${h3} ${weight('font-bold')} text-dark-gray`}>{stat.value}</h3>
                                <p className={`text-gray-500 font-bold mt-2 text-[10px] md:text-xs ${label}`}>
                                    {stat.label}
                                </p>
                            </div>
                        </div>
                    </div>
                    );
                })}
            </div>
        </section>
    );
};

const previewContainerVariants: Variants = {
    initial: { opacity: 0 },
    animate: {
        opacity: 1,
        transition: {
            staggerChildren: 0.04,
            delayChildren: 0.02
        }
    },
    exit: { opacity: 0 }
};

const previewItemVariants: Variants = {
    initial: {
        clipPath: 'inset(0% 100% 0% 0%)',
        x: 20,
        opacity: 0
    },
    animate: {
        clipPath: 'inset(0% 0% 0% 0%)',
        x: 0,
        opacity: 1,
        transition: {
            duration: 1.2,
            ease: [0.16, 1, 0.3, 1]
        }
    },
    exit: {
        clipPath: 'inset(0% 100% 0% 0%)',
        x: -20,
        opacity: 0,
        transition: {
            duration: 0.8,
            ease: [0.4, 0, 0.2, 1]
        }
    }
};

export const GalleryPreview: React.FC<GalleryPreviewProps> = () => {
    const { t, i18n } = useTranslation('maaligai');
    const isTamil = i18n.language === 'ta';
    const navigate = useNavigate();

    const fontSerif = isTamil ? 'font-tamil-serif' : 'font-heading';
    const h2 = 'text-3xl md:text-5xl';
    const tracking = isTamil ? 'tracking-normal' : 'tracking-widest uppercase';

    return (
        <section id="gallery" className="px-6 lg:px-20 section-spacing bg-background-light">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <div className="reveal-frame mb-4">
                        <h2 className={`reveal-item ${fontSerif} text-rosewood ${h2} font-bold mb-8`}>{t('home.gallery.heading')}</h2>
                        <div className="reveal-item w-24 h-1 bg-primary rounded-full mx-auto mt-4" style={{ transitionDelay: '100ms' }}></div>
                    </div>
                </div>

                <div className="reveal-frame">
                    <GalleryDisplayer
                        enableLightbox={false}
                        enableFilters={false}
                        showArchiveButton={false}
                        activeRoutes={['/maaligai']}
                        rotationInterval={8000}
                        containerVariants={previewContainerVariants}
                        itemVariants={previewItemVariants}
                        className="py-0"
                    />
                </div>

                <div className="flex justify-center mt-8 reveal-frame">
                    <button
                        onClick={() => navigate('/maaligai/gallery')}
                        className={`reveal-item btn-shine w-full sm:w-auto bg-primary text-dark-gray px-10 py-4 rounded-xl font-bold text-base transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${tracking}`}
                        style={{ transitionDelay: '400ms' }}
                    >
                        <span>{t('home.gallery.viewFull')}</span>
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </button>
                </div>
            </div>
        </section>
    );
};

export const HomeCTA: React.FC<CTAProps> = () => {
    const { t, i18n } = useTranslation('maaligai');
    const isTamil = i18n.language === 'ta';
    const navigate = useNavigate();
    const frameRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = frameRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.classList.add('is-visible');
                    observer.disconnect();
                }
            },
            { threshold: 0.2 }
        );
        el.classList.add('is-ready');
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const ls = (enClasses: string, taClasses: string) => isTamil ? taClasses : enClasses;
    const fontDecorative = 'font-decorative';
    const fontSerif = isTamil ? 'font-tamil-serif' : 'font-heading';
    const h1 = 'text-4xl md:text-6xl';

    return (
        <section className="section-spacing px-6 relative overflow-hidden bg-background-light">
            <CornerFlourish />

            <div ref={frameRef} className="reveal-frame max-w-4xl mx-auto text-center relative z-10 pt-8 pb-8">
                <div className="reveal-item">
                    <p className={`${fontDecorative} text-gold-accent text-4xl lg:text-5xl mb-4`}>{t('home.cta.sub')}</p>
                    <h2 className={`text-rosewood ${h1} ${fontSerif} font-bold mb-10 ${ls('leading-tight', 'leading-[1.4]')}`}>{t('home.cta.heading')}</h2>

                    <button
                        onClick={() => navigate('/maaligai/hall-availability')}
                        className={`btn-shine bg-rosewood text-white px-10 py-4 rounded-full font-bold hover:bg-dark-rosewood transition-all duration-300 shadow-xl active:scale-95 ${isTamil ? 'tracking-normal' : 'uppercase tracking-widest'} text-sm`}
                    >
                        {t('home.cta.btn')}
                    </button>
                </div>
            </div>
        </section>
    );
};

export const BookingSteps: React.FC<BookingStepsProps> = () => {
    const { t, i18n } = useTranslation('maaligai');
    const isTamil = i18n.language === 'ta';
    const navigate = useNavigate();

    const ls = (enClasses: string, taClasses: string) => isTamil ? taClasses : enClasses;
    const fontSerif = isTamil ? 'font-tamil-serif' : 'font-heading';
    const fontDisplay = isTamil ? 'font-tamil-body' : 'font-body';
    const h2 = 'text-3xl md:text-5xl';
    const h3 = 'text-xl md:text-2xl';
    const body = 'font-body';
    const label = isTamil ? 'tracking-normal' : 'tracking-widest uppercase';

    const items = t('home.steps.items', { returnObjects: true }) as Array<{num: string, icon: string, title: string, desc: string}>;

    return (
        <section className="relative section-spacing overflow-hidden bg-white">
            <div className="max-w-7xl mx-auto px-6 text-center mb-16 md:mb-20 relative z-10 reveal-frame">
                <div className="reveal-item">
                    <span className={`${fontDisplay} text-gold-accent mb-6 block font-bold opacity-80 text-xs ${label}`}>
                        {t('home.steps.label')}
                    </span>
                    <h2 className={`${fontSerif} text-rosewood ${h2} mb-10`}>
                        {t('home.steps.heading')}
                    </h2>
                    <div className="w-32 h-px bg-rose-beige mx-auto opacity-50"></div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 relative z-10">
                    {items.map((item: any, idx: number) => (
                        <div key={idx} className="reveal-frame h-full">
                            <div className={`reveal-item h-full`} style={{ transitionDelay: `${idx * 100}ms` }}>
                                <div className="bg-transparent border border-gold-accent relative overflow-hidden transition-all duration-500 hover:border-primary hover:-translate-y-2 p-10 md:p-12 flex flex-col items-center text-center h-full rounded-2xl group cursor-default">
                                    <span className={`${fontSerif} text-rosewood text-[12rem] md:text-[15rem] leading-none opacity-5 absolute -bottom-5 -right-2 md:-right-4 pointer-events-none z-0 font-bold transition-transform duration-700 group-hover:scale-110 group-hover:-translate-x-4`}>
                                        {item.num}
                                    </span>
                                    <div className="relative z-10 w-full flex flex-col items-center flex-1">
                                        <div className="bg-background-light border border-primary text-primary flex items-center justify-center transition-all duration-500 w-16 h-16 rounded-full mx-auto mb-8 shadow-sm group-hover:bg-primary/50 group-hover:text-dark-gray group-hover:scale-110">
                                            <span className="material-symbols-outlined text-3xl text-rosewood/70! group-hover:text-rosewood!">
                                                {item.icon}
                                            </span>
                                        </div>
                                        <h3 className={`${fontSerif} text-rosewood ${h3} mb-6 font-bold`}>
                                            {item.title}
                                        </h3>
                                        <p className={`${fontDisplay} ${body} ${ls('leading-relaxed', 'leading-[1.6]')} text-dark-gray opacity-90`}>
                                            {item.desc}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-16 md:mt-24 text-center relative z-10 reveal-frame">
                <div className="reveal-item" style={{ transitionDelay: '400ms' }}>
                    <button
                        onClick={() => navigate('/maaligai/hall-availability')}
                        className={`group relative px-12 md:px-16 py-5 md:py-6 overflow-hidden bg-transparent border border-rosewood text-rosewood ${fontDisplay} font-bold transition-all duration-500 hover:text-white rounded-sm ${isTamil ? 'tracking-normal' : 'tracking-widest uppercase'} text-xs md:text-sm`}
                    >
                        <span className="relative z-10">{t('home.steps.button')}</span>
                        <div className="absolute inset-0 bg-rosewood translate-x-[-101%] group-hover:translate-x-0 transition-transform duration-500 ease-out"></div>
                    </button>
                </div>
            </div>
        </section>
    );
};

export const HomeAboutSection: React.FC<AboutSectionProps> = () => {
    const { t, i18n } = useTranslation('maaligai');
    const isTamil = i18n.language === 'ta';
    const navigate = useNavigate();

    const ls = (enClasses: string, taClasses: string) => isTamil ? taClasses : enClasses;
    const fontDecorative = 'font-decorative';
    const fontSerif = isTamil ? 'font-tamil-serif' : 'font-heading';
    const body = 'font-body';
    const h2 = 'text-3xl md:text-5xl';
    const weight = (w: string) => w;

    return (
        <section id="about" className="px-6 lg:px-20 py-10 bg-background-light relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 max-w-7xl mx-auto relative z-10">
                <div className="flex-1 reveal-frame">
                    <div className="reveal-item space-y-6 text-center lg:text-left relative">
                        <p className={`${fontDecorative} text-rosewood text-4xl mb-4`}>{t('home.about.script')}</p>
                        <h2 className={`${fontSerif} text-rosewood ${h2} ${weight('font-bold')} mb-8 relative inline-block`}>
                            {t('home.about.heading')}
                        </h2>
                        <div className="w-20 h-1 bg-gold-accent rounded-full mx-auto lg:mx-0"></div>
                        <div className="space-y-4">
                            <p className={`text-gray-600 ${ls('leading-relaxed', 'leading-[1.6]')} ${body}`}>
                                {t('home.about.p1')}
                            </p>
                            <p className={`text-gray-600 ${ls('leading-relaxed', 'leading-[1.6]')} ${body}`}>
                                {t('home.about.p2')}
                            </p>
                        </div>
                        <div className="flex justify-center lg:justify-start mt-8">
                            <button
                                onClick={() => navigate('/maaligai/about')}
                                className="text-dark-gray font-bold border-b-2 border-gold-accent pb-1 hover:text-rosewood transition-colors group flex items-center gap-2"
                            >
                                {t('home.about.cta')}
                                <span className="material-symbols-outlined text-sm group-hover:translate-x-2 transition-transform duration-300">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 w-full mt-8 lg:mt-0 reveal-frame">
                    <div className="reveal-item relative p-4 sm:p-8" style={{ transitionDelay: '200ms' }}>
                        <div className="group relative">
                            <div className="absolute -top-4 -left-4 w-full h-full border-2 border-sage-green rounded-xl z-0 hidden sm:block"></div>
                            <LazyImage
                                src={entrance}
                                alt="Kongu Thirumana Malaigai Hall"
                                containerClassName="w-full h-[350px] md:h-[500px] rounded-xl relative z-10 shadow-2xl transition-transform duration-700 group-hover:scale-[1.02]"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
