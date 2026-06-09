import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type PanInfo, type Variants } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { gallery as enGallery } from '@/locales/en/maaligai/gallery';
import { gallery as taGallery } from '@/locales/ta/maaligai/gallery';
import { useGallery } from '@/hooks/useGallery';
import { Category, type GalleryItem as GalleryItemType } from '@/types/gallery';
import { LazyBackground } from '@/components/ui/LazyBackground';
import heroImage from '@/assets/images/hero.jpg';
import { useLazyImage } from '@/hooks/useLazyImage';

interface GalleryHeroProps {}
interface GalleryGridProps {}
interface GalleryCTAProps {}
interface MemoriesProps {}
interface GalleryDisplayerProps {
    enableLightbox?: boolean;
    enableFilters?: boolean;
    showArchiveButton?: boolean;
    activeRoutes?: string[];
    rotationInterval?: number;
    containerVariants?: Variants;
    itemVariants?: Variants;
    className?: string;
    gallery?: any;
    isTamil?: boolean;
    fontSerif?: string;
    ls?: (enClasses: string, taClasses: string) => string;
    mobileSpans?: string;
    isMobile?: boolean;
    loadedImages?: Set<string>;
    handleImageLoad?: (id: string) => void;
    setSelectedImage?: (item: GalleryItemType) => void;
    lang?: 'en' | 'ta' | string;
}
interface CategoryFiltersProps {
    activeCategory: Category;
    setActiveCategory: (category: Category) => void;
    lang: 'en' | 'ta' | string;
}
interface ArchiveExplorerProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    filteredPool: GalleryItemType[];
    setSelectedImage: (item: GalleryItemType) => void;
    lang: 'en' | 'ta';
}
interface GalleryItemProps {
    item: GalleryItemType;
    areaName: string;
    mobileSpans: string;
    isMobile: boolean;
    itemVariants: Variants;
    loadedImages: Set<string>;
    handleImageLoad: (id: string) => void;
    setSelectedImage?: (item: GalleryItemType) => void;
    lang: 'en' | 'ta' | string;
}
interface ImageViewerLightboxProps {
    selectedImage: GalleryItemType | null;
    setSelectedImage: (item: GalleryItemType | null) => void;
    filteredPool: GalleryItemType[];
    currentIndex: number;
    handlePrev: () => void;
    handleNext: () => void;
    isMobile: boolean;
}

export const GalleryHero: React.FC<GalleryHeroProps> = () => {
    const { language: lang } = useLanguage();
    const isTamil = lang === 'ta';
    const t = isTamil ? taGallery : enGallery;

    const fontSerif = isTamil ? 'font-body' : 'font-heading';
    const ls = (enClasses: string, taClasses: string) => isTamil ? taClasses : enClasses;

    return (
        <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 z-0">
                <LazyBackground
                  src={heroImage}
                  alt="Gallery Hero"
                  priority={true}
                  className="w-full h-full object-cover"
                  containerClassName="w-full h-full"
                />
                <div className="absolute inset-0 bg-black/60"></div>
            </div>

            <div className="relative z-10 text-center px-6 max-w-4xl reveal-frame">
                <div className="reveal-item">
                    <h2 className={`${fontSerif} ${isTamil ? 'font-bold' : 'font-black'} mb-6 ${ls('leading-none', 'leading-[1.2]')} drop-shadow-2xl ${isTamil ? 'text-white/90' : 'text-white'} text-6xl md:text-9xl`}>
                        {t.heroTitle}
                    </h2>
                    <VineDivider icon="spa" />
                    <p className={`drop-shadow-lg text-primary ${isTamil ? 'font-body' : 'font-heading font-light tracking-[0.4em] uppercase'} text-lg md:text-2xl`}>
                        {t.heroSubtitle}
                    </p>
                </div>
            </div>

            <div
                className="hidden md:flex absolute bottom-10 left-1/2 -translate-x-1/2 text-primary flex-col items-center gap-2 animate-bounce cursor-pointer"
                onClick={() => window.scrollTo({ top: window.innerHeight * 0.6, behavior: 'smooth' })}
            >
                <span className="material-symbols-outlined text-4xl leading-none opacity-80">keyboard_double_arrow_down</span>
            </div>
        </section>
    );
};

const VineDivider = ({ icon }: { icon: string }) => (
    <div className="flex items-center justify-center gap-6 text-primary my-6">
        <svg className="w-24 md:w-32 h-6 stroke-current fill-none stroke-[1.5]" viewBox="0 0 100 20">
            <path d="M0,10 Q25,0 50,10 Q75,20 100,10 M20,5 Q25,10 30,5 M70,15 Q75,10 80,15" />
        </svg>
        <span className="material-symbols-outlined text-primary text-3xl">{icon}</span>
        <svg className="w-24 md:w-32 h-6 stroke-current fill-none stroke-[1.5] transform scale-x-[-1]" viewBox="0 0 100 20">
            <path d="M0,10 Q25,0 50,10 Q75,20 100,10 M20,5 Q25,10 30,5 M70,15 Q75,10 80,15" />
        </svg>
    </div>
);

export const GalleryGrid: React.FC<GalleryGridProps> = () => {
    const { language: lang } = useLanguage();
    const isTamil = lang === 'ta';

    const fontSerif = isTamil ? 'font-body' : 'font-heading';
    const fontDecorative = 'font-decorative';
    const ls = (enClasses: string, taClasses: string) => isTamil ? taClasses : enClasses;

    return (
        <section className="section-spacing px-4 md:px-6 max-w-[1400px] mx-auto min-h-screen">
            <div className="flex flex-col items-center gap-8 mb-12 md:mb-16">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <span className={`text-gold-accent block mb-4 ${fontDecorative} text-4xl`}>
                        {isTamil ? 'எங்கள் அழகிய தருணங்கள்' : 'Our Beautiful Moments'}
                    </span>
                    <h2 className={`text-rosewood tracking-tight mb-8 ${fontSerif} font-bold text-3xl md:text-5xl`}>
                        {isTamil ? 'ஒவ்வொரு உணர்வையும் பதிவு செய்தல்' : 'Capturing Every Emotion'}
                    </h2>
                </motion.div>
            </div>

            <GalleryDisplayer
                enableLightbox={true}
                enableFilters={true}
                showArchiveButton={true}
                activeRoutes={['/maaligai/gallery']}
            />
        </section>
    );
};

export const GalleryCTA: React.FC<GalleryCTAProps> = () => {
    const navigate = useNavigate();
    const { language: lang } = useLanguage();
    const isTamil = lang === 'ta';
    const t = isTamil ? taGallery : enGallery;

    const body = isTamil ? 'font-body' : 'font-body';
    const heading = isTamil ? 'font-tamil-serif' : 'font-heading';

    const h1Size = 'text-4xl sm:text-5xl md:text-6xl';
    const leading = isTamil ? 'leading-relaxed' : 'leading-tight';

    return (
        <section className="bg-rosewood section-spacing px-6 lg:px-20 text-center relative overflow-hidden reveal-frame">
            <div className="reveal-item">

                <div className="relative z-10 max-w-4xl mx-auto space-y-12 flex flex-col items-center">
                    <h2 className={`${heading} font-bold ${leading} ${h1Size} text-primary max-w-3xl mx-auto`}>
                        {t.ctaTitle}
                    </h2>

                    <button
                        onClick={() => navigate('/maaligai/packages')}
                        className={`group relative px-16 py-6 transition-all overflow-visible shadow-2xl active:scale-95 ${body} font-semibold uppercase tracking-[0.3em] text-primary`}
                    >
                        <span className="absolute inset-0 border border-gold/30 group-hover:border-primary transition-all rounded-sm"></span>
                        <span className="absolute -top-3 -left-3 w-8 h-8 border-t-2 border-l-2 border-primary opacity-60 group-hover:opacity-100 transition-all"></span>
                        <span className="absolute -bottom-3 -right-3 w-8 h-8 border-b-2 border-r-2 border-primary opacity-60 group-hover:opacity-100 transition-all"></span>
                        <div className="relative z-10 flex items-center gap-2">
                            {t.ctaBtn}
                        </div>
                    </button>
                </div>
            </div>
        </section>
    );
};

export const Memories: React.FC<MemoriesProps> = () => {
    const { language: lang } = useLanguage();
    const isTamil = lang === 'ta';
    const t = isTamil ? taGallery : enGallery;

    const ls = (enClasses: string, taClasses: string) => isTamil ? taClasses : enClasses;

    const body = isTamil ? 'font-body' : 'font-body';

    const decorative = 'font-decorative';

    const italic = '';

    return (
        <section className="px-6 lg:px-20 section-spacing bg-background-light">
            <div className="text-center max-w-3xl mx-auto relative p-12 md:p-20 bg-white/60 backdrop-blur-xl rounded-[3rem] border border-primary/20 shadow-xl reveal-frame z-10">
                <div className="reveal-item">
                    <div className="absolute top-[-34px] left-[-34px] w-12 h-12 border-t-2 border-l-2 border-primary/40 rounded-tl-3xl"></div>
                    <div className="absolute top-[-34px] right-[-34px] w-12 h-12 border-t-2 border-r-2 border-primary/40 rounded-tr-3xl"></div>
                    <div className="absolute bottom-[-44px] left-[-34px] w-12 h-12 border-b-2 border-l-2 border-primary/40 rounded-bl-3xl"></div>
                    <div className="absolute bottom-[-44px] right-[-34px] w-12 h-12 border-b-2 border-r-2 border-primary/40 rounded-br-3xl"></div>

                    <p className={`text-rosewood mb-4 ${decorative} text-4xl ${italic}`}>
                        {t.memoriesTitle}
                    </p>

                    <div className="flex items-center justify-center gap-4 text-primary opacity-60 mb-8">
                        <svg className="w-24 h-5 stroke-current fill-none stroke-[1.5]" viewBox="0 0 100 20">
                            <path d="M0,10 Q25,0 50,10 Q75,20 100,10" />
                        </svg>
                        <span className="material-symbols-outlined text-2xl">local_florist</span>
                        <svg className="w-24 h-5 stroke-current fill-none stroke-[1.5] transform scale-x-[-1]" viewBox="0 0 100 20">
                            <path d="M0,10 Q25,0 50,10 Q75,20 100,10" />
                        </svg>
                    </div>

                    <p className={`text-gray-500 px-4 md:px-0 ${body} ${ls('leading-relaxed', 'leading-[1.6]')} ${italic}`}>
                        {t.memoriesP}
                    </p>
                </div>
            </div>
        </section>
    );
};

const defaultContainerVariants: Variants = {
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

const defaultItemVariants: Variants = {
    initial: {
        clipPath: 'inset(0% 100% 0% 0%)',
        x: 20,
        opacity: 0,
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
        clipPath: 'inset(0% 0% 0% 100%)',
        x: -20,
        opacity: 0,
        transition: {
            duration: 0.8,
            ease: [0.4, 0, 0.25, 1]
        }
    }
};

export const GalleryDisplayer: React.FC<GalleryDisplayerProps> = ({
    enableLightbox = true,
    enableFilters = true,
    showArchiveButton = true,
    activeRoutes,
    rotationInterval = 5000,
    containerVariants = defaultContainerVariants,
    itemVariants = defaultItemVariants,
    className = ""
}) => {
    const { language: lang } = useLanguage();
    const isTamil = lang === 'ta';

    const {
        activeCategory,
        setActiveCategory,
        gridIndex,
        currentGrid,
        displayMapping,
        uniqueAreas,
        isMobile,
        isSmallScreen,
        isExplorerOpen,
        setIsExplorerOpen,
        selectedImage,
        setSelectedImage,
        filteredPool,
        currentIndex,
        handleNext,
        handlePrev,
        loadedImages,
        handleImageLoad,
    } = useGallery(activeRoutes, rotationInterval);

    const [isFirstLoad, setIsFirstLoad] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsFirstLoad(false), 100);
        return () => clearTimeout(timer);
    }, []);

    const gridStyles = useMemo(() => {
        if (isSmallScreen) {
            return {
                gridTemplateColumns: '1fr',
                gridAutoRows: 'minmax(280px, auto)',
                gap: '12px'
            };
        }
        if (isMobile) {
            return {
                gridTemplateColumns: 'repeat(2, 1fr)',
                gridAutoRows: 'minmax(180px, auto)',
            };
        }
        return {
            gridTemplateColumns: `repeat(${currentGrid.columns}, 1fr)`,
            gridTemplateAreas: currentGrid.areas.map((a: string) => `"${a}"`).join(' ')
        };
    }, [isMobile, isSmallScreen, currentGrid]);

    return (
        <section className={`relative overflow-hidden selection:bg-rosewood selection:text-white ${className}`}>

            {enableFilters && (
                <div className="flex flex-col items-center gap-8 mb-12 md:mb-16">
                    <CategoryFilters
                        activeCategory={activeCategory}
                        setActiveCategory={setActiveCategory}
                        lang={lang}
                    />
                </div>
            )}

            <div className="gallery-viewport">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`grid-${gridIndex}-${activeCategory}`}
                        variants={containerVariants}
                        initial={isFirstLoad ? false : "initial"}
                        animate="animate"
                        exit="exit"
                        className={`gallery-matrix ${!isMobile ? currentGrid.id : ''}`}
                        style={gridStyles}
                        layout
                        transition={{ layout: { type: "spring", stiffness: 140, damping: 26, mass: 1 } }}
                    >
                        {uniqueAreas.map((areaName: string, idx: number) => {
                            const item = displayMapping[areaName];
                            if (!item) {
                                return null;
                            }

                            const mobileSpans = isSmallScreen ? 'col-span-1' : (isMobile ? (
                                (idx % 5 === 0) ? 'col-span-2 row-span-2' :
                                    (idx % 3 === 0) ? 'col-span-1 row-span-2' :
                                        'col-span-1'
                            ) : '');

                            return (
                                <GalleryCard
                                    key={`${item.id}-${areaName}`}
                                    item={item}
                                    areaName={areaName}
                                    mobileSpans={mobileSpans}
                                    isMobile={isMobile}
                                    itemVariants={itemVariants}
                                    loadedImages={loadedImages}
                                    handleImageLoad={handleImageLoad}
                                    setSelectedImage={enableLightbox ? setSelectedImage : undefined}
                                    lang={lang}
                                />
                            );
                        })}
                    </motion.div>
                </AnimatePresence>
            </div>

            {showArchiveButton && (
                <>
                    <div className="mt-16 flex justify-center pb-12">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsExplorerOpen(true)}
                            className={`group flex items-center gap-4 px-12 py-5 border border-rosewood/20 rounded-full text-[11px] font-bold text-rosewood hover:bg-rosewood hover:text-white transition-all duration-500 shadow-xl bg-ivory-tint/80 backdrop-blur-xl ${isTamil ? 'font-body' : 'font-heading'}`}
                        >
                            <span>{lang === 'en' ? 'Explore Full Collection' : 'முழு தொகுப்பை காண்க'}</span>
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </motion.button>
                    </div>

                    <AnimatePresence>
                        {isExplorerOpen && (
                            <ArchiveExplorer
                                isOpen={isExplorerOpen}
                                setIsOpen={setIsExplorerOpen}
                                filteredPool={filteredPool}
                                setSelectedImage={setSelectedImage}
                                lang={lang}
                            />
                        )}
                    </AnimatePresence>
                </>
            )}

            {enableLightbox && (
                <ImageViewerLightbox
                    selectedImage={selectedImage}
                    setSelectedImage={setSelectedImage}
                    filteredPool={filteredPool}
                    currentIndex={currentIndex}
                    handlePrev={handlePrev}
                    handleNext={handleNext}
                    isMobile={isMobile}
                />
            )}
        </section>
    );
};

export const GalleryCard: React.FC<GalleryItemProps> = ({
    item,
    areaName,
    mobileSpans,
    isMobile,
    itemVariants,
    loadedImages,
    handleImageLoad,
    setSelectedImage,
    lang
}) => {
    const isTamil = lang === 'ta';
    const fontDisplay = isTamil ? 'font-body' : 'font-heading';

    const { ref, source } = useLazyImage({
        src: item.url,
        rootMargin: '200px',
        threshold: 0.1
    });

    const imageLoaded = loadedImages.has(item.id);
    const isInteractive = !!setSelectedImage;

    const handleClick = () => {
        if (imageLoaded && setSelectedImage) {
            setSelectedImage(item);
        }
    };

    return (
        <motion.div
            ref={ref}
            key={`${item.id}-${areaName}`}
            variants={itemVariants}
            layout
            className={`img-wrapper group ${imageLoaded && isInteractive ? 'cursor-pointer' : 'cursor-default'} ${mobileSpans}`}
            style={{ gridArea: !isMobile ? areaName : undefined }}
            onClick={handleClick}
        >
            {!imageLoaded && (
                <div className="absolute inset-0 bg-linear-to-br from-gold-accent/20 via-soft-gold/10 to-gold-accent/20 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 border-4 border-gold-accent border-t-transparent rounded-full animate-spin"></div>
                        <span className={`text-gold-accent text-xs ${fontDisplay} ${isTamil ? 'font-bold' : 'font-bold uppercase tracking-[0.4em]'}`}>
                            {isTamil ? 'ஏற்றுகிறது' : 'Loading'}
                        </span>
                    </div>
                </div>
            )}

            {source && (
                <motion.img
                    src={source}
                    alt=""
                    onLoad={() => handleImageLoad(item.id)}
                    className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                />
            )}

            {imageLoaded && isInteractive && (
                <div className="absolute inset-0 bg-dark-rosewood/10 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
                    <div className="relative flex items-center justify-center">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            whileHover={{ scale: 1.15 }}
                            className="relative w-12 h-12 md:w-16 md:h-16 rounded-full bg-rose-beige/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white shadow-2xl z-10"
                        >
                            <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </motion.div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export const CategoryFilters: React.FC<CategoryFiltersProps> = ({
    activeCategory,
    setActiveCategory,
    lang
}) => {
    const isTamil = lang === 'ta';
    const fontDisplay = isTamil ? 'font-body' : 'font-heading';

    const categories = [
        Category.ALL,
        Category.WEDDINGS,
        Category.RECEPTIONS,
        Category.STAGE_DECORATION,
        Category.DINING_AREA,
        Category.VENUE_EXTERIOR
    ];

    const getCategoryName = (category: string) => {
        const t = isTamil ? taGallery : enGallery;
        const index = categories.indexOf(category as Category);
        if (index !== -1 && t.filters[index]) {
            return t.filters[index];
        }
        return category;
    };

    return (
        <div className="flex flex-wrap justify-center gap-2 md:gap-3 relative z-20">
            {categories.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                    <motion.button
                        key={cat}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            setActiveCategory(cat as Category);
                        }}
                        className={`px-4 md:px-8 py-2 md:py-2.5 rounded-full text-[9px] md:text-[11px] ${fontDisplay} ${isTamil ? 'font-bold' : 'font-bold uppercase tracking-[0.4em]'} transition-all duration-500 whitespace-nowrap ${isActive
                            ? 'bg-rosewood text-white shadow-xl'
                            : 'bg-ivory-tint text-rosewood border border-primary hover:border-gold-accent shadow-sm'
                            }`}
                    >
                        {getCategoryName(cat)}
                    </motion.button>
                );
            })}
        </div>
    );
};

export const ArchiveExplorer: React.FC<ArchiveExplorerProps> = ({
    isOpen,
    setIsOpen,
    filteredPool,
    setSelectedImage,
    lang
}) => {
    const isTamil = lang === 'ta';
    const fontDisplay = isTamil ? 'font-body' : 'font-heading';
    const fontSerif = isTamil ? 'font-body' : 'font-heading';
    const h3 = 'text-xl md:text-2xl';

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="fixed inset-0 z-400 bg-background-light flex flex-col overflow-hidden"
        >
            <div className="flex-none bg-ivory-tint/90 backdrop-blur-2xl border-b border-primary px-8 py-8 flex items-center justify-between shadow-sm">
                <div className="flex flex-col">
                    <span className={`text-logo-dark/40 ${fontDisplay} text-[10px] ${isTamil ? 'font-bold' : 'font-extrabold uppercase tracking-[0.4em]'}`}>
                        {isTamil ? 'தனிப்பட்ட தொகுப்பு' : 'PRIVATE ARCHIVE'}
                    </span>
                    <h3 className={`${fontSerif} ${h3} text-rosewood mt-1`}>
                        {isTamil ? 'சிறப்பின் காட்சிகள்' : 'Glimpses of Grandeur'}
                    </h3>
                </div>
                <motion.button
                    whileHover={{ scale: 1.1, rotate: 90, backgroundColor: "var(--color-rosewood)", color: "var(--color-background-light)" }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(false)}
                    className="w-14 h-14 flex items-center justify-center text-rosewood border border-primary rounded-full transition-all bg-background-light/40 backdrop-blur-md shadow-lg"
                >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto archive-scroll px-8 py-16">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-w-[1800px] mx-auto">
                    {filteredPool.map((item, idx) => (
                        <motion.div
                            key={`archive-${item.id}`}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.02, ease: [0.12,0,0.39,0.44] }}
                            className="aspect-3/4 rounded-2xl overflow-hidden cursor-pointer group shadow-lg relative"
                            onClick={() => setSelectedImage(item)}
                        >
                            <img
                                src={item.url}
                                alt=""
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 bg-primary/10"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-dark-rosewood/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end p-6">
                                <p className={`text-white ${fontDisplay} text-[10px] ${isTamil ? 'font-bold' : 'font-bold uppercase tracking-[0.4em]'} opacity-80`}>{item.category}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export const ImageViewerLightbox: React.FC<ImageViewerLightboxProps> = ({
    selectedImage,
    setSelectedImage,
    filteredPool,
    currentIndex,
    handlePrev,
    handleNext,
    isMobile
}) => {
    const { language: lang } = useLanguage();
    const isTamil = lang === 'ta';
    const fontDisplay = isTamil ? 'font-body' : 'font-heading';

    const handleDragEnd = (_: unknown, info: PanInfo) => {
        const swipeThreshold = 50;
        const dismissThreshold = 100;
        if (Math.abs(info.offset.y) > dismissThreshold) {
            setSelectedImage(null);
        } else if (info.offset.x > swipeThreshold) {
            handlePrev();
        } else if (info.offset.x < -swipeThreshold) {
            handleNext();
        }
    };

    return (
        <AnimatePresence mode="wait">
            {selectedImage && (
                <motion.div
                    key="lightbox-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-1000 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center overflow-hidden"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="absolute top-0 right-0 p-6 md:p-10 z-1010 pointer-events-none">
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 90, backgroundColor: "var(--color-rose-beige)", color: "white" }}
                            whileTap={{ scale: 0.9 }}
                            className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center text-primary bg-white/5 backdrop-blur-3xl border border-primary/30 transition-all pointer-events-auto rounded-full shadow-2xl"
                            onClick={() => setSelectedImage(null)}
                        >
                            <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </motion.button>
                    </div>

                    <div className="w-full h-full flex flex-col items-center justify-center p-4 md:p-10" onClick={(e) => e.stopPropagation()}>
                        <div className="relative w-full h-[55vh] md:h-[65vh] flex items-center justify-center overflow-hidden">
                            <AnimatePresence mode="popLayout">
                                <motion.div
                                    key={selectedImage.id}
                                    drag="x"
                                    dragConstraints={{ left: 0, right: 0 }}
                                    dragElastic={0.6}
                                    onDragEnd={handleDragEnd}
                                    initial={{ opacity: 0, x: 300 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -300 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing"
                                >
                                    <img
                                        src={selectedImage.url}
                                        alt=""
                                        loading="eager"
                                        className="max-w-full max-h-full object-contain rounded-xl shadow-[0_45px_100px_-20px_rgba(0,0,0,0.6)] select-none pointer-events-none border-2 border-primary/40 bg-primary/5"
                                    />
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <div className="fixed inset-0 pointer-events-none hidden md:flex items-center justify-between px-6 md:px-12">
                            <motion.button
                                whileHover={{ scale: 1.1, backgroundColor: "var(--color-gold-accent)", color: "white" }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                                className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/5 backdrop-blur-3xl border border-primary/30 flex items-center justify-center text-primary shadow-2xl transition-all duration-300 pointer-events-auto"
                            >
                                <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 19l-7-7 7-7" />
                                </svg>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.1, backgroundColor: "var(--color-gold-accent)", color: "white" }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                                className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/5 backdrop-blur-3xl border border-primary/30 flex items-center justify-center text-primary shadow-2xl transition-all duration-300 pointer-events-auto"
                            >
                                <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5l7 7-7 7" />
                                </svg>
                            </motion.button>
                        </div>

                        <div className="mt-12 md:mt-16 flex flex-col items-center pointer-events-auto z-1005 w-full px-6">
                            {isMobile ? (
                                <div className="flex items-center justify-between w-full max-w-[320px] gap-4">
                                    <motion.button
                                        whileTap={{ scale: 0.85 }}
                                        onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                                        className="w-14 h-14 rounded-full bg-white/5 backdrop-blur-3xl border border-primary/20 flex items-center justify-center text-primary"
                                    >
                                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </motion.button>

                                    <div className="flex flex-col items-center">
                                        <div className={`flex items-center text-primary ${fontDisplay} ${isTamil ? 'font-bold' : 'font-extrabold uppercase tracking-[0.4em]'} text-[18px] h-8 overflow-hidden`}>
                                            <div className="relative h-full flex items-center justify-center min-w-[30px]">
                                                <AnimatePresence mode="popLayout" initial={false}>
                                                    <motion.span
                                                        key={currentIndex}
                                                        initial={{ y: 30, opacity: 0 }}
                                                        animate={{ y: 0, opacity: 1 }}
                                                        exit={{ y: -30, opacity: 0 }}
                                                        className="block"
                                                    >
                                                        {String(currentIndex + 1).padStart(2, '0')}
                                                    </motion.span>
                                                </AnimatePresence>
                                            </div>
                                            <span className="mx-2 text-primary/20">-</span>
                                            <span className="text-primary/40">{String(filteredPool.length).padStart(2, '0')}</span>
                                        </div>
                                        <span className={`mt-2 text-gold-accent ${fontDisplay} text-[10px] font-bold uppercase tracking-[0.4em] opacity-80 text-center`}>
                                            {selectedImage.category}
                                        </span>
                                    </div>

                                    <motion.button
                                        whileTap={{ scale: 0.85 }}
                                        onClick={(e) => { e.stopPropagation(); handleNext(); }}
                                        className="w-14 h-14 rounded-full bg-white/5 backdrop-blur-3xl border border-primary/20 flex items-center justify-center text-primary"
                                    >
                                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </motion.button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center min-w-[140px] md:min-w-[200px]">
                                    <div className={`flex items-center text-primary ${fontDisplay} ${isTamil ? 'font-bold' : 'font-extrabold uppercase tracking-[0.4em]'} text-[16px] md:text-[22px] h-10 overflow-hidden`}>
                                        <div className="relative h-full flex items-center justify-center min-w-[40px]">
                                            <AnimatePresence mode="popLayout" initial={false}>
                                                <motion.span
                                                    key={currentIndex}
                                                    initial={{ y: 40, opacity: 0 }}
                                                    animate={{ y: 0, opacity: 1 }}
                                                    exit={{ y: -40, opacity: 0 }}
                                                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                                    className="text-primary block"
                                                >
                                                    {String(currentIndex + 1).padStart(2, '0')}
                                                </motion.span>
                                            </AnimatePresence>
                                        </div>
                                        <span className="mx-4 text-primary/20 font-thin">-</span>
                                        <span className="text-primary/40">
                                            {String(filteredPool.length).padStart(2, '0')}
                                        </span>
                                    </div>
                                    <span className={`mt-4 text-gold-accent ${fontDisplay} text-[10px] md:text-[13px] font-bold uppercase tracking-[0.4em] text-center block whitespace-nowrap opacity-80`}>
                                        {selectedImage.category}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
