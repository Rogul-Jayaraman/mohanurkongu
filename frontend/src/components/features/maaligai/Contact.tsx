import React, { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import OrnamentalDivider from "@/components/ui/OrnamentalDivider";
import LazyImage from "@/components/ui/shared/LazyImage";
import videoBg from "@/assets/images/maaligai/contact/landing.mp4";
import videoPoster from "@/assets/images/maaligai/contact/heroFallback.jpg";
import location_image from "@/assets/images/maaligai/contact/KTM_Location.png";

interface ContactHeroProps {}
interface ContactInfoProps {}
interface InquiryFormProps {}
interface LocationMapProps {}

interface ContactCard {
  icon: string;
  title: string;
  detail: string;
  sub?: string;
}

export const ContactHero: React.FC<ContactHeroProps> = () => {
  const { t, i18n } = useTranslation("maaligai");
  const isTamil = i18n.language === "ta";
  const videoRef = useRef<HTMLVideoElement>(null);

  const ls = (enClasses: string, taClasses: string) =>
    isTamil ? taClasses : enClasses;
  const fontSerif = isTamil ? "font-tamil-serif" : "font-heading";
  const h1 = "text-3xl md:text-5xl lg:text-7xl";
  const weight = (en: string, ta: string = "font-bold") => (isTamil ? ta : en);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 1;
    }
  }, []);

  return (
    <section className="relative h-[85vh] flex items-center justify-center overflow-hidden bg-[#1a1810]">
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          poster={videoPoster}
          className="w-full h-full object-cover"
        >
          <source src={videoBg} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-linear-to-b from-black/10 via-black/50 to-black/30"></div>
      </div>
      <div className="relative z-10 text-center px-6 max-w-5xl flex flex-col items-center reveal-frame">
        <h2
          className={`reveal-item ${weight("font-black")} leading-tight ${fontSerif} ${h1} text-white`}
        >
          {t("contact.heroTitle")}
        </h2>

        <OrnamentalDivider
          stretch
          icon="filter_vintage"
          iconColor="text-primary"
          lineColor="text-primary"
          iconSize="text-4xl md:text-5xl"
          className="reveal-item delay-100 mb-8 w-full"
        />

        <p
          className={`reveal-item delay-200 mt-2 font-decorative text-primary text-2xl md:text-5xl ${weight("font-medium", "font-bold")}`}
        >
          {t("contact.heroSubtitle")}
        </p>
      </div>
  </section>
);
};

export const ContactInfo: React.FC<ContactInfoProps> = () => {
  const { t, i18n } = useTranslation("maaligai");
  const isTamil = i18n.language === "ta";

  const cards = t("contact.cards", { returnObjects: true }) as ContactCard[];

  const body = `${isTamil ? "font-tamil-body" : "font-body"} text-base md:text-lg`;
  const small = "text-sm md:text-base";
  const fontDisplay = isTamil ? "font-tamil-serif" : "font-heading";
  const weight = (en: string, ta: string = "font-bold") => (isTamil ? ta : en);
  const label = `${isTamil ? "" : "uppercase tracking-wider"} text-xs md:text-sm`;

  return (
    <section
      id="contact-info"
      className="px-6 lg:px-20 section-spacing bg-ivory-tint"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {cards.map((card: ContactCard, idx: number) => (
            <div key={idx} className="reveal-frame">
              <div
                className={`reveal-item h-full bg-white p-10 rounded-3xl shadow-sm border border-primary/20 flex flex-col items-center text-center safe-hover-lift`}
              >
                <div className="w-20 h-20 rounded-full bg-sage-tint flex items-center justify-center mb-8">
                  <span className="material-symbols-outlined text-rosewood text-3xl">
                    {card.icon}
                  </span>
                </div>
                <h3
                  className={`text-rosewood ${weight("font-black")} mb-4 ${fontDisplay} ${label}`}
                >
                  {card.title}
                </h3>
                <p
                  className={`text-dark-gray ${fontDisplay} wrap-break-word w-full mb-2 ${body} whitespace-pre-line`}
                >
                  {card.detail}
                </p>
                {card.sub && (
                  <p
                    className={`text-nav-gray ${fontDisplay} ${weight("font-medium")} ${small}`}
                  >
                    {card.sub}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
  </section>
);
};

export const InquiryForm: React.FC<InquiryFormProps> = () => {
  const { t, i18n } = useTranslation("maaligai");
  const isTamil = i18n.language === "ta";
  const formRef = React.useRef<HTMLDivElement>(null);

  const allCards = t("contact.cards", { returnObjects: true }) as ContactCard[];
  const cards = allCards.filter((_, i) => i < 2);

  React.useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#inquiry' || hash === '#/inquiry') {
      const timer = setTimeout(() => {
        document.getElementById('inquiry')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const body = `${isTamil ? "font-tamil-body" : "font-body"} text-base md:text-lg`;
  const fontSerif = isTamil ? "font-tamil-serif" : "font-heading";
  const fontDisplay = isTamil ? "font-tamil-body" : "font-body";
  const weight = (en: string, ta: string = "font-bold") => (isTamil ? ta : en);
  const label = `uppercase ${isTamil ? "" : "tracking-widest"} text-[10px] md:text-xs`;
  const h2 = "text-2xl md:text-4xl lg:text-5xl";
  const small = "text-sm md:text-base";

  const actions = [
    { icon: "call", href: "tel:+919080725466" },
    { icon: "chat", href: "https://wa.me/919080725466" },
  ];

  const actionKeys = ["contactNow", "contactWhatsApp"];

  return (
    <section ref={formRef} id="inquiry" className="px-6 lg:px-20 section-spacing bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 reveal-frame">
          <div className="reveal-item space-y-6 flex flex-col items-center">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white shadow-sm border border-primary/20 rounded-full">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className={`text-rosewood ${label} ${weight("font-black")}`}>
                {t("contact.inquirySupport")}
              </span>
            </div>
            <h2 className={`${weight("font-bold")} text-rosewood leading-tight ${fontSerif} ${h2}`}>
              {t("contact.inquiryTitle")}
            </h2>
            <div className="w-24 h-1.5 bg-primary rounded-full"></div>
            <p className={`text-dark-gray/70 leading-relaxed max-w-2xl ${fontDisplay} ${body}`}>
              {t("contact.inquiryP")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {cards.map((card: ContactCard, idx: number) => (
            <div key={idx} className="reveal-frame">
              <div className="reveal-item h-full bg-ivory-tint p-8 rounded-3xl shadow-sm border border-primary/20 flex flex-col items-center text-center safe-hover-lift">
                <div className="w-16 h-16 rounded-full bg-sage-tint flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-rosewood text-3xl">{card.icon}</span>
                </div>
                <h3 className={`text-rosewood ${weight("font-black")} mb-2 ${fontSerif} ${label}`}>{card.title}</h3>
                <p className={`text-dark-gray ${fontDisplay} text-base md:text-lg mb-1`}>{card.detail}</p>
                {card.sub && <p className={`text-nav-gray ${fontDisplay} ${weight("font-medium")} ${small} mb-6`}>{card.sub}</p>}
                <a
                  href={actions[idx].href}
                  target={actions[idx].href.startsWith("http") && !actions[idx].href.startsWith("tel") && !actions[idx].href.startsWith("mailto") ? "_blank" : undefined}
                  rel={actions[idx].href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-rosewood text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-dark-rosewood transition-all duration-300 shadow-md active:scale-95"
                >
                  {t(`contact.${actionKeys[idx]}`)}
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </a>
              </div>
            </div>
          ))}
        </div>


      </div>
    </section>
  );
};


export const LocationMap: React.FC<LocationMapProps> = () => {
  const { t, i18n } = useTranslation("maaligai");
  const isTamil = i18n.language === "ta";

  const h2 = "text-2xl md:text-4xl lg:text-5xl";
  const body = `${isTamil ? "font-tamil-body" : "font-body"} text-base md:text-lg`;
  const fontDisplay = isTamil ? "font-tamil-body" : "font-body";
  const fontSerif = isTamil ? "font-tamil-serif" : "font-heading";
  const weight = (en: string, ta: string = "font-bold") => (isTamil ? ta : en);
  const label = `uppercase ${isTamil ? "" : "tracking-[0.2em]"} text-[10px] md:text-xs`;

  return (
  <section className="px-6 lg:px-20 section-spacing bg-[#fdfcf8] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4"></div>
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-rosewood/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
          <div className="flex-1 text-center lg:text-left reveal-frame">
            <div className="reveal-item-left space-y-10 flex flex-col items-center lg:items-start">
              <div className="space-y-4">
                <h2
                  className={`${weight("font-black")} text-rosewood leading-[1.1] ${fontSerif} ${h2}`}
                >
                  {t("contact.locationTitle")}
                </h2>
              </div>

              <div className="space-y-8 w-full">
                <p
                  className={`text-dark-gray/80 leading-[20px] max-w-lg mx-auto lg:mx-0 whitespace-pre-line `}
                >
                  {t("contact.addressDetail")}
                </p>

                <div
                  className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 text-nav-gray ${fontDisplay} ${body}`}
                >
                  <div className="flex items-center justify-center lg:justify-start gap-5 p-4 rounded-2xl bg-white/50 border border-primary/10 shadow-xs hover:shadow-md transition-shadow duration-300">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-2xl">
                        near_me
                      </span>
                    </div>
                    <span className={`${weight("font-medium")} text-left`}>
                      {t("contact.district")}
                    </span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start gap-5 p-4 rounded-2xl bg-white/50 border border-primary/10 shadow-xs hover:shadow-md transition-shadow duration-300">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-2xl">
                        commute
                      </span>
                    </div>
                    <span className={`${weight("font-medium")} text-left`}>
                      {t("contact.highway")}
                    </span>
                  </div>
                </div>
              </div>

              <button
                className={`group relative overflow-hidden bg-rosewood text-white px-12 py-5 rounded-2xl ${weight("font-black")} flex items-center justify-center gap-4 shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-1 active:scale-95 ${fontDisplay} ${label} text-sm md:text-base`}
                onClick={() =>
                  window.open(
                    "https://www.google.com/maps/place/Kongu+Thirumana+Maaligai/@11.0932937,78.1492664,260m/data=!3m1!1e3!4m6!3m5!1s0x3baa32dc05b41ea3:0x9b5b6f198db49432!8m2!3d11.093154!4d78.1496284!16s%2Fg%2F11gg4494w3?entry=ttu&g_ep=EgoyMDI2MDUxMy4wIKXMDSoASAFQAw%3D%3D",
                    "_blank",
                  )
                }
              >
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <span className="material-symbols-outlined text-2xl">
                  directions
                </span>
                {t("contact.mapBtn")}
              </button>
            </div>
            </div>

          <div className="flex-1 w-full reveal-frame">
            <div className="reveal-item-right delay-300 relative group">
              <div className="absolute -inset-4 bg-primary/10 rounded-[22px] md:rounded-[40px] rotate-3 scale-105 group-hover:rotate-0 group-hover:scale-100 transition-all duration-700"></div>

              <div
                className="relative h-[350px] md:h-[550px] lg:h-[600px] w-full bg-white rounded-[20px] md:rounded-[38px] overflow-hidden shadow-2xl border-6 border-white cursor-pointer z-10"
                onClick={() =>
                  window.open(
                    "https://www.google.com/maps/place/Kongu+Thirumana+Maaligai/@11.0932937,78.1492664,260m/data=!3m1!1e3!4m6!3m5!1s0x3baa32dc05b41ea3:0x9b5b6f198db49432!8m2!3d11.093154!4d78.1496284!16s%2Fg%2F11gg4494w3?entry=ttu&g_ep=EgoyMDI2MDUxMy4wIKXMDSoASAFQAw%3D%3D",
                    "_blank",
                  )
                }
              >
                <LazyImage
                  alt="Location Map"
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-2000"
                  src={location_image}
                  containerClassName="w-full h-full"
                />

                <div className="absolute inset-0 bg-linear-to-t from-rosewood/40 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity duration-500"></div>
                <div className="absolute inset-0 bg-rosewood/5 group-hover:bg-transparent transition-colors duration-500"></div>

                <div className="absolute bottom-5 md:bottom-10 left-1/2 -translate-x-1/2 w-[90%] md:w-auto md:min-w-[340px] bg-white/95 backdrop-blur-md p-3 md:p-6 rounded-[16px] md:rounded-[24px] shadow-2xl border border-white/50 flex items-center gap-3 md:gap-5 transform group-hover:translate-y-[-10px] transition-transform duration-500 z-20">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/30 rounded-full animate-ping"></div>
                    <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-rosewood flex items-center justify-center relative z-10 shadow-xl border-2 md:border-4 border-white">
                      <span className="material-symbols-outlined text-white text-xl md:text-3xl">
                        location_on
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 text-left">
                    <h4
                      className={`text-rosewood ${weight("font-black")} text-sm md:text-lg leading-tight ${fontSerif}`}
                    >
                      {t("contact.venueName")}
                    </h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  </section>
);
};
