import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { ProtectedRoute } from './components/features/auth/ProtectedRoute';
import { PublicRoute } from './components/features/auth/PublicRoute';
import { MetadataManager } from '@/components/ui/layout/MetadataManager';

// Landing & Maaligai Pages
import LandingPage from '@/pages/landing/LandingPage';
import MaaligaiLayout from '@/layout/maaligai/MaaligaiLayout';
import MaaligaiHome from '@/pages/maaligai/MaaligaiHome';
import MaaligaiAbout from '@/pages/maaligai/MaaligaiAbout';
import MaaligaiFacilities from '@/pages/maaligai/MaaligaiFacilities';
import MaaligaiContact from '@/pages/maaligai/MaaligaiContact';
import GalleryPage from '@/pages/maaligai/Gallery';
import PackagesPage from '@/pages/maaligai/Packages';
import MaaligaiHallAvailability from '@/pages/maaligai/MaaligaiHallAvailability';

// Layout & Pages
import UserLayout from '@/layout/user/Layout';
import Dashboard from '@/pages/user/Dashboard';
import BrowseProfiles from '@/pages/user/BrowseProfiles';
import ShortlistedProfiles from '@/pages/user/Shortlist';
import MyProfiles from '@/pages/user/MyProfiles';
import NewProfile from '@/pages/user/NewProfile';
import ProfileView from '@/pages/user/ProfileView';

import AdminLayout from '@/layout/admin/Layout';
import AdminDashboard from '@/pages/admin/Dashboard';
import Analytics from '@/pages/admin/Analytics';
import MyAccount from '@/pages/user/MyAccount';

import SystemSettings from '@/pages/admin/Settings';
import NotFound from '@/pages/common/NotFound';
import ComingSoonPage from '@/pages/common/ComingSoonPage';

// Matrimony Admin Pages
import ProfileVerification from '@/pages/admin/matrimony/Verification';
import UserAccounts from '@/pages/admin/matrimony/Users';
import Profiles from '@/pages/admin/matrimony/Profiles';
import ProfileDetails from '@/pages/admin/matrimony/ProfileDetails';
import MembershipManagement from '@/pages/admin/matrimony/MembershipManagement';

// Mandapam Admin Pages
import HallAvailability from '@/pages/admin/mandapam/Availability';
import Packages from '@/pages/admin/mandapam/Packages';
import Bookings from '@/pages/admin/mandapam/Bookings';

import { AuthProvider } from './hooks/useAuth';
import { LanguageProvider } from './context/LanguageContext';
import { CapsLockProvider } from './context/CapsLockContext';
import Login from '@/pages/auth/Login';
import AdminLogin from '@/pages/auth/AdminLogin';
import Signup from '@/pages/auth/Signup';
import ForgotPassword from '@/pages/auth/ForgotPassword';

import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { Toaster } from 'sonner';

const RootLayout = () => (
  <>
    <MetadataManager />
    <Outlet />
  </>
);

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <LandingPage />,
      },
      {
        path: "maaligai",
        element: <MaaligaiLayout />,
        children: [
          { index: true, element: <MaaligaiHome /> },
          { path: "about", element: <MaaligaiAbout /> },
          { path: "facilities", element: <MaaligaiFacilities /> },
          { path: "contact", element: <MaaligaiContact /> },
          { path: "gallery", element: <GalleryPage /> },
          { path: "packages", element: <PackagesPage /> },
          { path: "hall-availability", element: <MaaligaiHallAvailability /> },
        ],
      },
      {
        element: <PublicRoute />,
        children: [
          { path: "/manamaalai/login", element: <Login /> },
          { path: "/manamaalai/signup", element: <Signup /> },
          { path: "/manamaalai/forgot-password", element: <ForgotPassword /> },
        ],
      },
      {
        element: <ProtectedRoute allowedRole="USER" />,
        children: [
          {
            element: <UserLayout />,
            children: [
              { path: "manamaalai", element: <Navigate to="/manamaalai/dashboard" replace /> },
              { path: "manamaalai/dashboard", element: <Dashboard /> },
              { path: "manamaalai/browse-profiles", element: <BrowseProfiles /> },
              { path: "manamaalai/shortlist", element: <ShortlistedProfiles /> },
              { path: "manamaalai/my-profiles", element: <MyProfiles /> },
              { path: "manamaalai/my-account", element: <MyAccount /> },
              { path: "manamaalai/new-profile", element: <NewProfile /> },
              { path: "manamaalai/view-profile/:id", element: <ProfileView /> },
              { path: "manamaalai/plan-upgrade", element: <ComingSoonPage /> },
            ],
          },
        ],
      },
      {
        element: <PublicRoute />,
        children: [
          { path: "/admin/login", element: <AdminLogin /> },
        ],
      },
      {
        element: <ProtectedRoute allowedRole="ADMIN" />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { path: "admin", element: <Navigate to="/admin/dashboard" replace /> },
              { path: "admin/dashboard", element: <AdminDashboard /> },
              { path: "admin/analytics", element: <Analytics /> },
              { path: "admin/matrimony/verification", element: <ProfileVerification /> },
              { path: "admin/matrimony/users", element: <UserAccounts /> },
              { path: "admin/matrimony/profiles", element: <Profiles /> },
              { path: "admin/matrimony/profiles/:id", element: <ProfileDetails /> },
              { path: "admin/matrimony/membership", element: <MembershipManagement /> },
              { path: "admin/mandapam/packages", element: <Packages /> },
              { path: "admin/mandapam/availability", element: <HallAvailability /> },
              { path: "admin/mandapam/bookings", element: <Bookings /> },
              { path: "admin/settings", element: <SystemSettings /> },
            ],
          },
        ],
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
]);

function App() {
  return (
    <LanguageProvider>
        <CapsLockProvider>
        <AuthProvider>
          <Toaster
            position="top-right"
            expand={false}
            closeButton
            duration={3000}
            richColors
          />
          <ErrorBoundary><RouterProvider router={router} /></ErrorBoundary>
        </AuthProvider>
        </CapsLockProvider>
      </LanguageProvider>
  );
}

export default App;
