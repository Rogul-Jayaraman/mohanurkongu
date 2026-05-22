import React from 'react';
import { useTranslation } from 'react-i18next';
import { LazyBackground } from '@/components/ui/LazyBackground';
import LazyImage from '@/components/ui/shared/LazyImage';
import hero from '@/assets/images/maaligai/about/hero.jpg';
import aboutImg from '@/assets/images/maaligai/about/about.jpg';

interface AboutHeroProps {}
interface HeritageStoryProps {}

export const AboutHero: React.FC<AboutHeroProps> = () => {
    const { t, i18n } = useTranslation('maaligai');
    const isTamil = i18n.language === 'ta';

    const ls = (en: string, ta: string) => isTamil ? ta : en;
    const fontDecorative = 'font-decorative';
    const fontSerif = isTamil ? 'font-tamil-serif' : 'font-heading';
    const h1 = isTamil ? 'text-3xl md:text-4xl' : 'text-5xl md:text-7xl';

    return (
        <section className="relative h-[70vh] md:h-[85vh] flex items-center justify-center overflow-hidden bg-background-light">
            <div className="absolute inset-0 z-0">
                <LazyBackground
                  src={hero}
                  alt="About Hero"
                  priority={true}
                  className="w-full h-full object-cover"
                  containerClassName="w-full h-full"
                />
                <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/30 to-black/60"></div>
                <div className="absolute inset-0 kolam-pattern opacity-10"></div>
             </div>

            <div className="relative z-10 text-center px-4 flex flex-col items-center">
                <div className="reveal-frame is-ready">
                    <h1 className={`reveal-item font-bold mb-4 drop-shadow-2xl ${fontSerif} ${h1} text-white`}>
                        {t('about.heroTitle')}
                    </h1>
                </div>

                <div className="reveal-frame is-ready w-full max-w-lg">
                    <div className="reveal-item delay-100 flex items-center justify-center gap-6 my-4">
                        <div className="h-px flex-1 bg-linear-to-r from-transparent via-gold-500/50 to-gold-500"></div>
                        <div className="flex items-center gap-2 text-gold-500">
                            <span className="material-symbols-outlined text-4xl">grass</span>
                        </div>
                        <div className="h-px flex-1 bg-linear-to-l from-transparent via-gold-500/50 to-gold-500"></div>
                    </div>
                </div>

                <div className="reveal-frame is-ready">
                    <p className={`reveal-item delay-200 mt-2 drop-shadow-lg ${fontDecorative} text-gold-500 ${ls('text-3xl md:text-5xl', 'text-xl md:text-2xl')} font-medium`}>
                        {t('about.heroSubtitle')}
                    </p>
                </div>
            </div>

            <div className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 z-20 reveal-frame is-ready">
                <div
                    className="reveal-item delay-500 flex flex-col items-center group cursor-pointer"
                    onClick={() => window.scrollTo({ top: window.innerHeight * 0.9, behavior: 'smooth' })}
                >
                    <span className="material-symbols-outlined text-gold-500 text-4xl leading-none animate-bounce">keyboard_double_arrow_down</span>
                    <div className="w-[2px] h-12 bg-linear-to-b from-gold-500 to-transparent mt-1"></div>
                    <span className={`font-heading font-bold mt-2 text-xs uppercase tracking-widest text-gold-500/80`}>
                        {t('about.scrollDown') || 'Scroll to Explore'}
                    </span>
                </div>
            </div>
        </section>
    );
};

export const HeritageStory: React.FC<HeritageStoryProps> = () => {
    const { t, i18n } = useTranslation('maaligai');
    const isTamil = i18n.language === 'ta';

    const ls = (en: string, ta: string) => isTamil ? ta : en;
    const fontDecorative = 'font-decorative';
    const fontSerif = isTamil ? 'font-tamil-serif' : 'font-heading';
    const h2 = isTamil ? 'text-3xl md:text-4xl' : 'text-4xl md:text-5xl';

    return (
        <section className="px-6 lg:px-20 section-spacing bg-ivory">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
                <div className="flex-1 w-full reveal-frame is-ready">
                    <div className="reveal-item relative">
                        <div className="absolute -top-4 -left-4 w-full h-full border-2 border-gold-500/30 rounded-2xl z-0"></div>
                        <LazyImage
                            alt="Hall Heritage"
                            className="w-full h-[400px] md:h-[500px] object-cover rounded-2xl relative z-10 shadow-2xl"
                            src={aboutImg}
                            containerClassName="w-full h-[400px] md:h-[500px] rounded-2xl relative z-10 shadow-2xl"
                        />
                    </div>
                </div>
                <div className="flex-1 space-y-6 reveal-frame is-ready">
                    <div className="reveal-item delay-200">
                        <span className={`text-rosewood font-bold block mb-2 uppercase tracking-widest text-xs`}>
                            {t('about.heritageLabel')}
                        </span>
                        <h2 className={`font-bold text-rosewood leading-tight mb-8 ${fontSerif} ${h2}`}>
                            {t('about.heritageTitle')}
                        </h2>
                        <div className="w-24 h-1 bg-gold-500 rounded-full mb-8"></div>
                        <p className={`text-nav-gray leading-relaxed mb-4 text-base md:text-lg`}>
                            {t('about.heritageP1')}
                        </p>
                        <p className={`text-nav-gray leading-relaxed mb-4 text-base md:text-lg`}>
                            {t('about.heritageP2')}
                        </p>
                        <p className={`text-rosewood mt-6 ${fontDecorative} ${ls('text-4xl', 'text-2xl')} font-medium`}>
                            {t('about.heritageQuote')}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};
