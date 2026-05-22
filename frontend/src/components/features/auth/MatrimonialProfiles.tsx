import React, { useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ProfileShowcaseCard } from './ProfileShowcaseCard';
import { useTranslations } from '@/hooks/useTranslations';
import { useFeaturedProfiles } from '@/hooks/useFeaturedProfiles';

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

const interleave = (a: any[], b: any[]) => {
  const result: any[] = [];
  const maxLen = Math.max(a.length, b.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < a.length) result.push(a[i]);
    if (i < b.length) result.push(b[i]);
  }
  return result;
};

export const MatrimonialProfiles: React.FC = () => {
  const { t, language } = useTranslations(['auth']);
  const { brides, grooms } = useFeaturedProfiles();
  const isTamil = language === 'ta';

  const profiles = React.useMemo(() => interleave(brides, grooms), [brides, grooms]);

  const trackRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPaused = useRef(false);
  const isLocked = useRef(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);
  const [perView, setPerView] = useState(2);

  const computeDimensions = useCallback(() => {
    const w = measureRef.current?.clientWidth;
    if (!w || w <= 0) return;
    const pv = getCardsPerView(w);
    const cw = (w - (pv - 1) * GAP) / pv;
    setCardWidth(cw);
    setPerView(pv);
  }, []);

  useLayoutEffect(() => {
    computeDimensions();
    const ro = new ResizeObserver(computeDimensions);
    if (measureRef.current) ro.observe(measureRef.current);
    return () => ro.disconnect();
  }, [computeDimensions]);

  useEffect(() => {
    setCurrentIndex(0);
    isLocked.current = false;
  }, [profiles.length, cardWidth]);

  const maxIndex = Math.max(0, profiles.length - perView);

  useEffect(() => {
    if (currentIndex > maxIndex) setCurrentIndex(maxIndex);
  }, [currentIndex, maxIndex]);

  const scrollTo = useCallback((index: number) => {
    if (isLocked.current) return;
    let clamped = index;
    if (clamped > maxIndex) clamped = 0;
    if (clamped < 0) clamped = maxIndex;
    if (clamped === currentIndex) return;
    isLocked.current = true;
    setCurrentIndex(clamped);
    setTimeout(() => { isLocked.current = false; }, 400);
  }, [currentIndex, maxIndex]);

  useEffect(() => {
    if (profiles.length <= perView) return;
    const tick = () => {
      if (isPaused.current || isLocked.current) return;
      scrollTo(currentIndex + 1);
    };
    timerRef.current = setInterval(tick, AUTO_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, maxIndex, perView, profiles.length, scrollTo]);

  const pauseAutoplay = () => { isPaused.current = true; };
  const resumeAutoplay = () => { isPaused.current = false; };

  const handleDragStart = () => {
    pauseAutoplay();
  };

  const handleDragEnd = (_: any, info: any) => {
    const offset = info.offset.x;
    if (Math.abs(offset) > DRAG_THRESHOLD) {
      if (offset < 0) scrollTo(currentIndex + 1);
      else scrollTo(currentIndex - 1);
    }
    resumeAutoplay();
  };

  if (profiles.length === 0) return null;

  const step = cardWidth > 0 ? cardWidth + GAP : 0;

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

      <div
        onMouseEnter={pauseAutoplay}
        onMouseLeave={resumeAutoplay}
        className="touch-pan-y"
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
            transition={{
              type: 'tween',
              duration: 0.45,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            onAnimationComplete={() => { isLocked.current = false; }}
            drag="x"
            dragConstraints={{ left: -maxIndex * step, right: 0 }}
            dragElastic={0.05}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            whileTap={{ cursor: 'grabbing' }}
          >
            {profiles.map((profile: any) => (
              <div
                key={profile.id}
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
    </motion.section>
  );
};
