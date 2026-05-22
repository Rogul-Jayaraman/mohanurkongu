import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useRevealAnimations = () => {
    const location = useLocation();

    useEffect(() => {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: "0px 0px -50px 0px"
        };

        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, observerOptions);

        const initSafeAnimations = () => {
            const elements = document.querySelectorAll('.reveal-frame');
            elements.forEach(el => {
                if (!el.classList.contains('is-visible')) {
                    if (!el.classList.contains('is-ready')) {
                        el.classList.add('is-ready');
                    }
                    revealObserver.observe(el);
                }
            });
        };

        const timer = setTimeout(() => {
            initSafeAnimations();
        }, 100);

        const pageObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length > 0) {
                    initSafeAnimations();
                }
            });
        });

        pageObserver.observe(document.body, { childList: true, subtree: true });

        return () => {
            clearTimeout(timer);
            revealObserver.disconnect();
            pageObserver.disconnect();
        };
    }, [location.pathname]);
};
