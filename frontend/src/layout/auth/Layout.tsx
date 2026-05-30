import React from 'react';
import { useLocation } from 'react-router-dom';
import { AuthHeader as Header } from './Header';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollToTop } from '../../components/ui/layout/ScrollToTop';

export const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="h-screen flex flex-col bg-ivory overflow-x-hidden overflow-y-auto selection:bg-gold/30 selection:text-rosewood">
            <ScrollToTop />
            <Header />

            <main id="main-content" className="flex-1 flex flex-col items-center justify-center py-4 sm:py-5 lg:py-8 relative">
                <div className="absolute inset-0 kolam-watermark opacity-[0.03] pointer-events-none -z-10" />
                <div className="absolute top-0 right-0 ornament-corner rotate-90 scale-150 opacity-[0.05] pointer-events-none -z-10" />
                <div className="absolute bottom-0 left-0 ornament-corner -rotate-90 scale-150 opacity-[0.05] pointer-events-none -z-10" />

                <AnimatePresence mode="wait">
                    <motion.div
                        key={window.location.pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="w-full flex justify-center px-4"
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};
