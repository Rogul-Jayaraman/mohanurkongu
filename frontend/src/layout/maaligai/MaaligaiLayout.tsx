import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from './Header';
import Footer from './Footer';
import { useRevealAnimations } from "@/hooks/useRevealAnimations";
import { ScrollToTop } from "@/components/ui/layout/ScrollToTop";
import ScrollToTopButton from "@/components/ui/ScrollToTopButton";

export const MaaligaiLayout: React.FC = () => {
  const location = useLocation();
  useRevealAnimations();

  return (
    <div className="min-h-screen bg-ivory text-dark-brown font-body selection:bg-gold-500 selection:text-rosewood">
      <ScrollToTop dependencies={[location.pathname]} />
      <Header />

      <main id="main-content" className="overflow-x-hidden pt-[64px] md:pt-[80px]">
        <Outlet />
      </main>

      <Footer />
      <ScrollToTopButton />
    </div>
  );
};

export default MaaligaiLayout;
