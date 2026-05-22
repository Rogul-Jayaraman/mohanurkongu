import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet, useLocation } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { ScrollToTop } from "../../components/ui/layout/ScrollToTop";

export const AdminLayout: React.FC = () => {
  const { t } = useLanguage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes("/admin/dashboard")) return "adminLayout.nav.dashboard";
    if (path.includes("/admin/analytics")) return "adminLayout.nav.analytics";

    if (path.includes("/admin/matrimony/verification"))
      return "adminLayout.nav.profileVerification";
    if (path.includes("/admin/matrimony/users"))
      return "adminLayout.nav.userAccounts";
    if (path.includes("/admin/matrimony/profiles/")) return "adminLayout.nav.profile_details";
    if (path.includes("/admin/matrimony/profiles")) return "adminLayout.nav.profiles";
    if (path.includes("/admin/matrimony/membership")) return "adminLayout.nav.plans";
    if (path.includes("/admin/mandapam/packages")) return "adminLayout.nav.packages";
    if (path.includes("/admin/mandapam/availability"))
      return "adminLayout.nav.hallAvailability";
    if (path.includes("/admin/mandapam/bookings")) return "adminLayout.nav.bookings";
    if (path.includes("/admin/settings")) return "adminLayout.nav.settings";
    return "adminLayout.header.adminPanel";
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="flex-1 min-w-0 xl:ml-72 bg-white h-dvh overflow-hidden transition-all flex flex-col">
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          title={getPageTitle()}
        />

        <ScrollToTop dependencies={[location.pathname]} />

        <div className="main-content-scroll flex-1 overflow-x-hidden overflow-y-auto flex flex-col min-h-0">
          <div className="flex-1 flex flex-col min-h-0 relative">
            <div className="kolam-watermark absolute inset-0 opacity-[0.05] pointer-events-none" />

            <div className="relative z-10 flex-1 p-4 lg:p-8">
              <Outlet key={location.pathname} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
