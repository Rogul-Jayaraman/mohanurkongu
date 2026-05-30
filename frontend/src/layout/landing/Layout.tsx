import React from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { SubNav } from './SubNav';
import { ScrollToTop } from '@/components/ui/layout/ScrollToTop';
import ScrollToTopButton from '@/components/ui/ScrollToTopButton';

export const LandingTemplate: React.FC<{hero: React.ReactNode; sections: React.ReactNode[]}> = ({hero, sections}) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-ivory text-dark-brown font-body selection:bg-gold-500 selection:text-rosewood">
      <ScrollToTop dependencies={[location.pathname]} />
      <Header />
      <SubNav />
      <main id="main-content">
        {hero}
        {sections.map((s, i) => (<React.Fragment key={i}>{s}</React.Fragment>))}
      </main>
      <Footer />
      <ScrollToTopButton />
    </div>
  );
};

export default LandingTemplate;
