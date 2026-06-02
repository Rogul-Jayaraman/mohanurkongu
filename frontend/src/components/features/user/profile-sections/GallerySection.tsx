import React from 'react';
import { Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { getImageUrl } from '@/utils/getImageUrl';
import { SectionCard3D, SectionHeaderRedesigned } from '@/components/features/matrimony/ProfileViewPrimitives';

interface GallerySectionProps {
  profile: any;
  isLoading: boolean;
}

const GallerySection: React.FC<GallerySectionProps> = ({ profile, isLoading }) => {
  const { i18n } = useTranslation(['common']);
  const isTamil = i18n.language === 'ta';
  const { t } = useTranslation(['profile_new']);

  const galleryImages = (profile?.gallery || []).filter((item: any) => item?.url);
  if (!isLoading && galleryImages.length === 0) return null;

  return (
    <SectionCard3D isLoading={isLoading}>
      <SectionHeaderRedesigned
        title={t('profile_new:sections.lifestyle_glimpses')}
        icon={<Camera size={16} />}
        gradient="bg-ivory-gold-gradient text-rosewood"
        isLoading={isLoading}
        isTamil={isTamil}
      />
      {(() => {
        if (isLoading) {
          return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 mt-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="aspect-4/5 rounded-2xl bg-gold/10 animate-pulse" />
              ))}
            </div>
          );
        }
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 mt-4">
            {galleryImages.map((item: any, i: number) => (
              <motion.div
                key={i}
                whileHover={{ rotateY: -2, scale: 1.02 }}
                className="perspective-1000 preserve-3d aspect-4/5 rounded-2xl overflow-hidden border border-gold/20 cursor-pointer shadow-sm hover:shadow-xl hover:shadow-gold/10 transition-shadow duration-300 group bg-white relative"
              >
                <img
                  src={getImageUrl(item.url) ?? ''}
                  alt={`${t('profile_new:gallery.alt')} ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                  <span className="material-symbols-outlined text-white text-2xl">zoom_in</span>
                </div>
              </motion.div>
            ))}
          </div>
        );
      })()}
    </SectionCard3D>
  );
};

export default GallerySection;
