import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources as translations } from "./locales";

// Use proper namespaces to prevent layout breakage and allow cleaner structure.
const resources = {
  en: {
    common: translations.en.common,
    auth: translations.en.auth,
    landing: translations.en.landing,
    maaligai: translations.en.maaligai,
    dashboard: translations.en.dashboard,
    errors: translations.en.errors,
    myprofiles: translations.en.myprofiles,
    profile_new: translations.en.profile_new,
    browse: translations.en.browse,
    shortlist: translations.en.shortlist,
    adminLogin: translations.en.adminLogin,
    adminLayout: translations.en.adminLayout,
    adminMandapam: translations.en.adminMandapam,
    adminMatrimony: translations.en.adminMatrimony,
    signup: translations.en.signup,
    calendar: translations.en.adminMandapam.calendar,
    analytics: translations.en.analytics,
    myaccount: translations.en.myaccount,
  },
  ta: {
    common: translations.ta.common,
    auth: translations.ta.auth,
    landing: translations.ta.landing,
    maaligai: translations.ta.maaligai,
    dashboard: translations.ta.dashboard,
    errors: translations.ta.errors,
    myprofiles: translations.ta.myprofiles,
    profile_new: translations.ta.profile_new,
    browse: translations.ta.browse,
    shortlist: translations.ta.shortlist,
    adminLogin: translations.ta.adminLogin,
    adminLayout: translations.ta.adminLayout,
    adminMandapam: translations.ta.adminMandapam,
    adminMatrimony: translations.ta.adminMatrimony,
    signup: translations.ta.signup,
    calendar: translations.ta.adminMandapam.calendar,
    analytics: translations.ta.analytics,
    myaccount: translations.ta.myaccount,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem("language") || "en",
    fallbackLng: "en",
    defaultNS: "common",
    ns: ["common", "auth", "signup", "dashboard", "errors", "myprofiles", "profile_new", "browse", "shortlist", "adminLogin", "adminLayout", "adminMatrimony", "adminMandapam", "analytics", "myaccount", "landing", "maaligai"],
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
