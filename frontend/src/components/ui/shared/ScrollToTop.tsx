import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Global utility component that resets scroll position to the top
 * whenever the navigation route changes.
 * 
 * We use behavior: 'instant' to override any CSS scroll-smooth settings
 * during page transitions, ensuring a professional, immediate reset.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant' as any
      });
    };

    // Immediate reset
    scrollToTop();

    // Secondary reset to catch cases where layout shifts or browser 'smart' restoration
    // happens slightly after the route change event.
    const timer = setTimeout(scrollToTop, 0);
    const timer2 = setTimeout(scrollToTop, 50);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [pathname]);

  return null;
};

export default ScrollToTop;
