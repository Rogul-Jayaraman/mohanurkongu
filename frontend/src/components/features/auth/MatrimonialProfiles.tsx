import React, { useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ProfileShowcaseCard } from './ProfileShowcaseCard';
import { useTranslations } from '@/hooks/useTranslations';
import { fetchShowcaseProfiles } from '@/api/profile.api';
import type { ShowcaseProfile } from '@/types/profile';


const GAP = 12;
const BP_XS = 400;
const BP_SM = 640;
const BP_MD = 768;
const BP_LG = 1024;
const BP_XL = 1280;
const AUTO_INTERVAL = 4000;
const DRAG_THRESHOLD = 50;

const getCardsPerView = (w: number): number => {
  if (w >= BP_XL) return 5;
  if (w >= BP_LG) return 4;
  if (w >= BP_MD) return 3;
  if (w >= BP_SM) return 2;
  if (w >= BP_XS) return 1;
  return 1;
};

const interleave = (a: ShowcaseProfile[], b: ShowcaseProfile[]) => {
  const result: ShowcaseProfile[] = [];
  const maxLen = Math.max(a.length, b.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < a.length) result.push(a[i]);
    if (i < b.length) result.push(b[i]);
  }
  return result;
};

const SkeletonCard: React.FC = () => (
  <div className="w-full rounded-xl sm:rounded-2xl bg-white border border-gold/20 shadow-sm overflow-hidden">
    <div className="aspect-[3/4] sm:aspect-square bg-gold/5 animate-pulse" />
  </div>
);

export const MatrimonialProfiles: React.FC = () => {
  const { t, language } = useTranslations(['auth']);
  const isTamil = language === 'ta';

  const [brides, setBrides] = useState<ShowcaseProfile[]>([]);
  const [grooms, setGrooms] = useState<ShowcaseProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchShowcaseProfiles()
      .then((data) => {
        if (cancelled) return;
        setBrides(data.brides);
        setGrooms(data.grooms);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || 'Failed to load profiles');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const cleanup = fetchProfiles();
    return cleanup;
  }, [fetchProfiles]);

  const profiles = React.useMemo(() => interleave(brides, grooms), [brides, grooms]);

  const trackRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPaused = useRef(false);
  const isLocked = useRef(false);
  const shouldAnimate = useRef(true);
  const currentIndexRef = useRef(0);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);
  const [perView, setPerView] = useState(2);

  currentIndexRef.current = currentIndex;

  const computeDimensions = useCallback(() => {
    const w = measureRef.current?.clientWidth;
    if (!w || w <= 0) return;
    const pv = getCardsPerView(w);
    const cw = (w - (pv - 1) * GAP) / pv;
    setCardWidth(cw);
    setPerView(pv);
  }, []);

  useLayoutEffect(() => {
    if (loading || profiles.length === 0) return;
    computeDimensions();
    const ro = new ResizeObserver(computeDimensions);
    if (measureRef.current) ro.observe(measureRef.current);
    return () => ro.disconnect();
  }, [computeDimensions, loading, profiles.length]);

  useEffect(() => {
    setCurrentIndex(0);
    isLocked.current = false;
  }, [profiles.length, cardWidth]);

  const effectiveLength = profiles.length;
  const adjustedMaxIndex = effectiveLength;

  useEffect(() => {
    if (currentIndex > adjustedMaxIndex) setCurrentIndex(adjustedMaxIndex);
  }, [currentIndex, adjustedMaxIndex]);

  const scrollTo = useCallback((index: number) => {
    if (isLocked.current) return;
    let clamped = index;
    if (clamped > adjustedMaxIndex) clamped = 0;
    if (clamped < 0) clamped = adjustedMaxIndex;
    if (clamped === currentIndexRef.current) return;
    isLocked.current = true;
    shouldAnimate.current = true;
    setCurrentIndex(clamped);
  }, [adjustedMaxIndex]);

  const animationComplete = useCallback(() => {
    if (!shouldAnimate.current) {
      shouldAnimate.current = true;
      isLocked.current = false;
      return;
    }
    if (currentIndexRef.current >= effectiveLength) {
      shouldAnimate.current = false;
      setCurrentIndex(currentIndexRef.current - effectiveLength);
      return;
    }
    isLocked.current = false;
  }, [effectiveLength]);

  useEffect(() => {
    if (profiles.length <= perView) return;
    const tick = () => {
      if (isPaused.current || isLocked.current) return;
      scrollTo(currentIndexRef.current + 1);
    };
    timerRef.current = setInterval(tick, AUTO_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [perView, profiles.length, scrollTo]);

  const pauseAutoplay = () => { isPaused.current = true; };
  const resumeAutoplay = () => { isPaused.current = false; };

  const handleDragStart = () => {
    pauseAutoplay();
  };

  const handleDragEnd = (_: any, info: any) => {
    const offset = info.offset.x;
    if (Math.abs(offset) > DRAG_THRESHOLD) {
      if (offset < 0) scrollTo(currentIndexRef.current + 1);
      else scrollTo(currentIndexRef.current - 1);
    }
    resumeAutoplay();
  };

  const isIdle = !loading && profiles.length === 0 && !error;
  const isLoaded = !loading && profiles.length > 0;
  const showSkeleton = loading;

  const step = cardWidth > 0 ? cardWidth + GAP : 0;

  const displayProfiles = React.useMemo(
    () => [...profiles, ...profiles],
    [profiles],
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full px-4 sm:px-6 md:px-8 mx-auto max-w-[1400px]"
    >
      <div className="mb-4 sm:mb-6 flex flex-col items-center text-center px-2">
        <h3
          className={`text-lg sm:text-xl md:text-2xl font-serif font-bold text-rosewood leading-tight ${isTamil ? 'tracking-normal' : ''}`}
        >
          {t('login.showcase.title')}
        </h3>
        <p className="text-[11px] sm:text-xs italic text-rosewood/50 mt-1 max-w-xs sm:max-w-sm mx-auto">
          {t('login.showcase.subtitle')}
        </p>
      </div>

      {showSkeleton && (
        <div className="flex gap-3 overflow-hidden rounded-xl min-h-[200px] sm:min-h-[240px]">
          {Array.from({ length: perView || 2 }).map((_, i) => (
            <div key={i} className="flex-1 min-w-0">
              <SkeletonCard />
            </div>
          ))}
        </div>
      )}

      {isIdle && (
        <div className="flex flex-col items-center justify-center min-h-[160px] sm:min-h-[200px] rounded-xl border border-dashed border-gold/20 bg-white/30">
          <span className="material-symbols-outlined text-4xl text-gold/40 mb-2">auto_awesome</span>
          <p className="text-sm text-rosewood/40 font-medium">
            {isTamil ? 'விரைவில் சுயவிவரங்கள்' : 'Profiles coming soon'}
          </p>
          <p className="text-[10px] text-rosewood/30 mt-0.5">
            {isTamil ? 'புதிய சுயவிவரங்கள் சேர்க்கப்படும் போது இங்கே காண்பிக்கப்படும்' : 'New profiles will appear here as they are added'}
          </p>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center min-h-[160px] sm:min-h-[200px] rounded-xl border border-dashed border-red-200 bg-red-50/30">
          <span className="material-symbols-outlined text-4xl text-red-300 mb-2">cloud_off</span>
          <p className="text-sm text-red-400 font-medium">
            {isTamil ? 'சுயவிவரங்களை ஏற்றுவதில் பிழை' : 'Unable to load profiles'}
          </p>
          <button
            onClick={fetchProfiles}
            className="mt-2 text-[11px] text-gold/60 hover:text-gold underline underline-offset-2 cursor-pointer transition-colors"
          >
            {isTamil ? 'மீண்டும் முயற்சிக்கவும்' : 'Try again'}
          </button>
        </div>
      )}

      {isLoaded && (
        <div
          onMouseEnter={pauseAutoplay}
          onMouseLeave={resumeAutoplay}
          className="touch-pan-x"
        >
          <div
            ref={measureRef}
            className="overflow-hidden rounded-xl py-2"
          >
            <motion.div
              ref={trackRef}
              className="flex py-1 cursor-grab active:cursor-grabbing"
              style={{ gap: `${GAP}px` }}
              animate={{ x: -currentIndex * step }}
              transition={shouldAnimate.current
                ? { type: 'tween', duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }
                : { duration: 0 }
              }
              onAnimationComplete={animationComplete}
              drag="x"
              dragConstraints={{ left: -adjustedMaxIndex * step, right: 0 }}
              dragElastic={0.05}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              whileTap={{ cursor: 'grabbing' }}
            >
              {displayProfiles.map((profile, idx) => (
                <div
                  key={`${profile.id}-${idx}`}
                  style={{
                    width: cardWidth || '100%',
                    flex: '0 0 auto',
                    minWidth: 0,
                  }}
                >
                  <ProfileShowcaseCard profile={profile} isTamil={isTamil} />
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      )}
    </motion.section>
  );
};
