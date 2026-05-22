import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";
import SectionHeader from "@/components/ui/shared/SectionHeader";
import { copyToClipboard } from "@/utils/clipboard";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";

export const Payment: React.FC = () => {
  const { language: lang } = useLanguage();
  const { t } = useTranslation("landing");

  const handleCopy = async (text: string, label: string) => {
    const success = await copyToClipboard(text, label);
    if (success) {
      alert(t("payment.copyFeedback").replace("{{label}}", label));
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
      },
    },
  };

  return (
    <section
      id="payment"
      className="relative px-6 lg:px-20 py-16 bg-ivory overflow-hidden snap-start"
    >
      <motion.div
        className="max-w-7xl mx-auto relative z-10"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >


        <div className="space-y-8">
          <motion.div variants={itemVariants}>
            <ContactBanner
              title={t("payment.contactAfterTitle")}
              subtitle={t("payment.contactAfterSub")}
              onCopy={handleCopy}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <AddressBanner
              title={t("payment.addressLabel")}
              subtitle={t("payment.addressSubtitle")}
              address={t("footer.address")}
              onCopy={handleCopy}
            />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

const bannerBase =
  "relative overflow-hidden bg-linear-to-br from-white via-ivory to-white shadow-lg shadow-gold/5 border border-gold/10 rounded-xl p-8 md:p-10";

const BannerDecorations: React.FC = () => (
  <>
    <div className="absolute inset-0 bg-[url('/assets/images/kolam-gold.png')] opacity-[0.03] scale-125 pointer-events-none" />
    <div className="absolute right-0 top-0 w-1/3 h-full bg-linear-to-l from-gold/10 to-transparent pointer-events-none" />
  </>
);

const ContactBanner: React.FC<{
  title: string;
  subtitle: string;
  onCopy: (text: string, label: string) => void;
}> = ({ title, subtitle, onCopy }) => (
  <div className={bannerBase}>
    <BannerDecorations />
    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
      <div className="text-center md:text-left">
        <h3 className="text-lg md:text-xl font-heading font-bold text-rosewood mb-2">
          {title}
        </h3>
        <p className="text-rosewood/50 text-xs md:text-sm font-body">
          {subtitle}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-8">
        <div
          onClick={() => onCopy("+91 90807 25466", "Phone")}
          className="group cursor-pointer flex flex-col items-center sm:items-end"
        >
          <div className="flex items-center gap-2 text-rosewood group-hover:text-gold transition-colors">
            <span className="text-lg font-medium font-body tracking-tighter">
              +91 90807 25466
            </span>
            <span className="material-symbols-outlined text-base md:text-lg opacity-40 group-hover:opacity-100 transition-opacity">
              content_copy
            </span>
          </div>
        </div>

        <div className="hidden sm:block w-px h-10 bg-gold/20" />

        <div className="flex items-center gap-4">
          <a
            href="tel:+919080725466"
            className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-ivory/10 hover:bg-rosewood/5 text-rosewood flex items-center justify-center transition-all border border-gold/10 shadow-lg group"
          >
            <span className="material-symbols-outlined text-xl md:text-2xl group-hover:scale-110 transition-transform">
              call
            </span>
          </a>
          <a
            href="https://wa.me/919080725466"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-ivory/10 hover:bg-rosewood/5 text-rosewood flex items-center justify-center transition-all shadow-lg group"
            title="WhatsApp"
          >
            <WhatsAppIcon
              sx={{ fontSize: { xs: 24, md: 28 } }}
              className="group-hover:scale-110 transition-transform"
            />
          </a>
        </div>
      </div>
    </div>
  </div>
);

const AddressBanner: React.FC<{
  title: string;
  subtitle: string;
  address: string;
  onCopy: (text: string, label: string) => void;
}> = ({ title, subtitle, address, onCopy }) => (
  <div className={bannerBase}>
    <BannerDecorations />
    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
      <div className="text-center md:text-left">
        <h3 className="text-lg md:text-xl font-heading font-bold text-rosewood mb-2">
          {title}
        </h3>
        <p className="text-rosewood/50 text-xs md:text-sm font-body">
          {subtitle}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-8">
        <p className="text-rosewood text-xs md:text-[12px] leading-[20px] font-body whitespace-pre-line">
          {address}
        </p>
        <div className="hidden sm:block w-px h-10 bg-gold/20" />
        <div className="flex items-center gap-4">
          <a
            href="https://www.google.com/maps/place/Kongu+Thirumana+Maaligai/@11.0932937,78.1492664,260m/data=!3m1!1e3!4m6!3m5!1s0x3baa32dc05b41ea3:0x9b5b6f198db49432!8m2!3d11.093154!4d78.1496284!16s%2Fg%2F11gg4494w3?entry=ttu&amp;g_ep=EgoyMDI2MDUxMy4wIKXMDSoASAFQAw%3D%3D"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-ivory/10 hover:bg-rosewood/5 text-rosewood flex items-center justify-center transition-all border border-gold/10 shadow-lg group"
            title="Open in Maps"
          >
            <span className="material-symbols-outlined text-xl md:text-2xl group-hover:scale-110 transition-transform">
              pin_drop
            </span>
          </a>
        </div>
      </div>
    </div>
  </div>
);

export default Payment;
