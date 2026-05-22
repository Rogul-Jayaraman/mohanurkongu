import React, { useState, useEffect } from 'react';

/**
 * ScrollToTopButton component
 * A floating button in the bottom right that scrolls the page to the top.
 * Includes a circular progress indicator (loader) that fills as the user scrolls.
 */
const ScrollToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = () => {
    // Calculate scroll progress percentage
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (totalHeight > 0) {
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    }
    
    // Show button after scrolling down 300px
    if (window.scrollY > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // SVG Circle calculation
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (scrollProgress / 100) * circumference;

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-6 right-6 md:bottom-8 md:right-8 z-100 p-0 rounded-full bg-ivory backdrop-blur-md shadow-[0_8px_25px_rgba(139,29,61,0.15)] border border-rosewood/10 transition-all duration-500 transform hover:scale-110 active:scale-95 group ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12 pointer-events-none'
      }`}
      aria-label="Scroll to top"
    >
      <style>
        {`
          @keyframes icon-jump-up {
            0%, 100% { transform: translateY(0); }
            30% { transform: translateY(3px); }
            60% { transform: translateY(-3px); }
            80% { transform: translateY(1px); }
          }
          .group:hover .animate-icon-bounce {
            animation: icon-jump-up 0.8s cubic-bezier(0.36, 0, 0.66, -0.56) infinite;
          }
        `}
      </style>
      <div className="relative w-9 h-9 md:w-11 md:h-11 flex items-center justify-center">
        {/* SVG Circle Loader */}
        <svg className="absolute inset-0 w-full h-full -rotate-90 p-0.5" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="transparent"
            stroke="#FCF9F2" // ivory
            strokeWidth="5"
            className="opacity-40"
          />
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="transparent"
            stroke="#8B1D3D" // rosewood
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-150 ease-out"
          />
        </svg>
        
        {/* Icon */}
        <div className="relative z-10 flex items-center justify-center h-full w-full">
          <span className="material-symbols-outlined text-rosewood text-base md:text-xl animate-icon-bounce">
            keyboard_double_arrow_up
          </span>
        </div>
      </div>
    </button>
  );
};

export default ScrollToTopButton;
