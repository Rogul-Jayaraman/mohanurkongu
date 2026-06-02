import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../context/LanguageContext";
import { ScrollToTop } from "../../components/ui/layout/ScrollToTop";

export const UserLayout: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [headerContent, setHeaderContent] = useState<React.ReactNode>(null);
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes("/dashboard")) return "nav.dashboard";
    if (path.includes("/browse-profiles")) return "nav.browse_profiles";
    if (path.includes("/shortlist")) return "nav.shortlist";
    if (path.includes("/my-profiles")) return "nav.my_profiles";
    if (path.includes("/my-account")) return "nav.myAccount";
    if (path.includes("/new-profile")) return "nav.new_profile";
    if (path.includes("/view-profile/")) return "nav.profile_detail";
    if (path.includes("/plan-upgrade")) return "dashboard:upgrade";
    return "tagline";
  };

  const isFullWidthPage = location.pathname.includes("/new-profile") || location.pathname.includes("/new-booking") || location.pathname.includes("/my-account");

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="flex-1 w-full xl:ml-72 bg-white h-dvh overflow-hidden transition-all flex flex-col">
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          title={getPageTitle()}
          headerContent={headerContent}
        />

        <ScrollToTop dependencies={[location.pathname]} />

        <div id="main-content" className="main-content-scroll flex-1 overflow-x-hidden overflow-y-auto flex flex-col min-h-0">
          <div className="flex-1 flex flex-col min-h-0 relative">
            <div className="kolam-watermark absolute inset-0 opacity-[0.05] pointer-events-none" />

            <div
              className={`relative z-10 flex-1 ${isFullWidthPage ? "p-0" : "p-4 lg:p-8"}`}
            >
              <Outlet context={{ setIsSidebarOpen, setHeaderContent }} key={location.pathname} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserLayout;
