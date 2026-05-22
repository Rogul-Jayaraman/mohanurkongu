import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { packages as enPackages } from '@/locales/en/maaligai/packages';
import { packages as taPackages } from '@/locales/ta/maaligai/packages';
import OrnamentalDivider from '@/components/ui/OrnamentalDivider';
import DiamondDivider from '@/components/ui/DiamondDivider';

interface PackagesHeroProps {}
interface PackagesCTAProps {}

export const PackagesHero: React.FC<PackagesHeroProps> = () => {
  const navigate = useNavigate();
    const { language: lang } = useLanguage();
    const isTamil = lang === 'ta';
    const t = isTamil ? taPackages : enPackages;
    const content = t;

    const ls = (enClasses: string, taClasses: string) => isTamil ? taClasses : enClasses;
    const fontSerif = isTamil ? 'font-tamil-serif' : 'font-heading';
    const h2 = isTamil ? 'text-xl md:text-2xl lg:text-3xl' : 'text-2xl md:text-4xl lg:text-5xl';
    const h3 = isTamil ? 'text-lg md:text-xl' : 'text-xl md:text-2xl';
    const body = isTamil ? 'font-tamil-body text-sm md:text-base' : 'font-body text-base md:text-lg';
    const weight = (en: string, ta: string = 'font-bold') => isTamil ? ta : en;
    const tracking = isTamil ? 'tracking-normal' : 'tracking-widest';

    return (
        <section className="section-spacing bg-ivory-tint">
            <div className="px-6 text-center mb-16 md:mb-24 relative z-10">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className={`${fontSerif} text-rosewood ${h2} ${weight('font-bold')} mb-4`}
                >
                    {content.heroTitle}
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className={`text-gray-600 max-w-2xl mx-auto ${body} mb-8 ${ls('leading-relaxed', 'leading-[1.6]')}`}
                >
                    {content.heroSubtitle}
                </motion.p>
                <div className="w-full max-w-sm mx-auto">
                    <OrnamentalDivider
                        stretch
                        icon="local_florist"
                        iconColor="text-gold-accent"
                        lineColor="text-gold-accent"
                        iconSize="text-xl md:text-2xl"
                        className="mb-8 w-full"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-6 lg:px-20">
                {content.packages.map((pkg: any, idx: number) => {
                    const isHighlighted = pkg.highlight;

                    return (
                        <motion.div
                            key={pkg.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            whileHover={{ y: -5 }}
                            className={`rounded-2xl p-10 flex flex-col h-full transition-shadow relative ${isHighlighted
                                ? "bg-white border-t-4 border-gold-accent shadow-xl lg:scale-105 z-10"
                                : "bg-ivory-tint border border-primary/30 shadow-sm hover:shadow-md"
                                }`}
                        >
                            {isHighlighted && (
                                <div className={`absolute -top-4 left-1/2 -translate-x-1/2 bg-gold-accent text-white ${ls('text-[10px]', 'text-[9px]')} ${weight('font-bold')} px-4 py-1 rounded-full uppercase ${tracking} text-nowrap whitespace-nowrap`}>
                                    {pkg.highlightText}
                                </div>
                            )}
                            <h3 className={`${fontSerif} ${h3} ${weight('font-bold')} text-rosewood mb-2`}>{pkg.title}</h3>
                            <p className={`text-gray-500 ${weight('font-medium')} mb-6 uppercase ${ls('text-xs', 'text-[11px]')} ${tracking}`}>{pkg.subtitle}</p>
                            <p className={`${fontSerif} text-xl ${weight('font-bold')} mb-8 text-rosewood`}>{pkg.price}</p>

                            <ul className="space-y-4 mb-10 grow text-rosewood">
                                {pkg.features.map((feature: string, fIdx: number) => (
                                    <li key={fIdx} className={`flex items-center gap-3 ${ls('text-sm', 'text-xs')}`}>
                                        <CheckCircle2 className="text-gold-accent w-5 h-5 shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => {
                                    navigate('/maaligai/contact/#inquiry', {
                                        state: {
                                            subject: `Price enquiry for ${pkg.title}`,
                                            date: '',
                                            packageName: pkg.title,
                                            packagePrice: pkg.price,
                                            messageType: 'package'
                                        }
                                    });
                                }}
                                className={`btn-shine w-full py-3 px-6 ${weight('font-bold')} rounded-lg transition-colors ${ls('text-sm', 'text-xs')} ${isHighlighted
                                ? "bg-gold-accent text-white hover:bg-gold-accent/90 shadow-md"
                                : "border border-gold-accent text-rosewood hover:bg-primary"
                                }`}>
                                {pkg.buttonText}
                            </button>
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
};

export const PackagesCTA: React.FC<PackagesCTAProps> = () => {
    const navigate = useNavigate();
    const { language: lang } = useLanguage();
    const isTamil = lang === 'ta';
    const t = isTamil ? taPackages : enPackages;
    const content = t;

    const ls = (enClasses: string, taClasses: string) => isTamil ? taClasses : enClasses;
    const fontSerif = isTamil ? 'font-tamil-serif' : 'font-heading';
    const h2 = isTamil ? 'text-xl md:text-2xl lg:text-3xl' : 'text-2xl md:text-4xl lg:text-5xl';
    const body = isTamil ? 'font-tamil-body text-sm md:text-base' : 'font-body text-base md:text-lg';
    const tracking = isTamil ? 'tracking-normal' : 'tracking-widest';

    return (
        <section className="section-spacing px-6 lg:px-20 relative overflow-hidden bg-ivory">
            <div className="max-w-4xl mx-auto text-center relative z-10">
                <DiamondDivider className="mb-12 -mt-12  md:-mt-20" />
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className={`${fontSerif} text-rosewood ${h2} font-bold mb-4 leading-tight`}
                >
                    {content.hallCtaTitle}
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.15 }}
                    className={`text-gray-600 ${body} max-w-2xl mx-auto mb-10 ${ls('leading-relaxed', 'leading-[1.6]')}`}
                >
                    {content.hallCtaSub}
                </motion.p>
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    onClick={() => navigate('/maaligai/hall-availability')}
                    className={`btn-shine bg-rosewood text-white px-12 py-4 rounded-full font-bold hover:bg-dark-rosewood transition-all duration-300 shadow-lg active:scale-95 ${ls('uppercase text-sm tracking-widest', 'text-xs md:text-sm tracking-normal')}`}
                >
                    {content.hallCtaBtn}
                </motion.button>
            </div>
        </section>
    );
};

export { AvailabilityCalendar, SharedCalendar } from './HallAvailability';
