import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { ProtectedRoute } from './components/features/auth/ProtectedRoute';
import { PublicRoute } from './components/features/auth/PublicRoute';
import { MetadataManager } from '@/components/ui/layout/MetadataManager';
import PageLoader from '@/components/ui/feedback/PageLoader';

// Landing & Maaligai Pages
const LandingPage = React.lazy(() => import('@/pages/landing/LandingPage'));
const MaaligaiLayout = React.lazy(() => import('@/layout/maaligai/MaaligaiLayout'));
const MaaligaiHome = React.lazy(() => import('@/pages/maaligai/MaaligaiHome'));
const MaaligaiAbout = React.lazy(() => import('@/pages/maaligai/MaaligaiAbout'));
const MaaligaiFacilities = React.lazy(() => import('@/pages/maaligai/MaaligaiFacilities'));
const MaaligaiContact = React.lazy(() => import('@/pages/maaligai/MaaligaiContact'));
const GalleryPage = React.lazy(() => import('@/pages/maaligai/Gallery'));
const PackagesPage = React.lazy(() => import('@/pages/maaligai/Packages'));
const MaaligaiHallAvailability = React.lazy(() => import('@/pages/maaligai/MaaligaiHallAvailability'));

// Layout & Pages
const UserLayout = React.lazy(() => import('@/layout/user/Layout'));
const Dashboard = React.lazy(() => import('@/pages/user/Dashboard'));
const BrowseProfiles = React.lazy(() => import('@/pages/user/BrowseProfiles'));
const ShortlistedProfiles = React.lazy(() => import('@/pages/user/Shortlist'));
const MyProfiles = React.lazy(() => import('@/pages/user/MyProfiles'));
const NewProfile = React.lazy(() => import('@/pages/user/NewProfile'));
const NewBooking = React.lazy(() => import('@/pages/user/NewBooking'));
const ProfileView = React.lazy(() => import('@/pages/user/ProfileView'));

const AdminLayout = React.lazy(() => import('@/layout/admin/Layout'));
const AdminDashboard = React.lazy(() => import('@/pages/admin/Dashboard'));
const Analytics = React.lazy(() => import('@/pages/admin/Analytics'));
const MyAccount = React.lazy(() => import('@/pages/user/MyAccount'));

const SystemSettings = React.lazy(() => import('@/pages/admin/Settings'));
const NotFound = React.lazy(() => import('@/pages/common/NotFound'));
const ComingSoonPage = React.lazy(() => import('@/pages/common/ComingSoonPage'));
const PlanUpgrade = React.lazy(() => import('@/pages/user/PlanUpgrade'));

// Matrimony Admin Pages
const ProfileVerification = React.lazy(() => import('@/pages/admin/matrimony/Verification'));
const UserAccounts = React.lazy(() => import('@/pages/admin/matrimony/Users'));
const Profiles = React.lazy(() => import('@/pages/admin/matrimony/Profiles'));
const ProfileDetails = React.lazy(() => import('@/pages/admin/matrimony/ProfileDetails'));
const MembershipManagement = React.lazy(() => import('@/pages/admin/matrimony/MembershipManagement'));
const AccountDetail = React.lazy(() => import('@/pages/admin/matrimony/AccountDetail'));

// Mandapam Admin Pages
const HallAvailability = React.lazy(() => import('@/pages/admin/mandapam/Availability'));
const Packages = React.lazy(() => import('@/pages/admin/mandapam/Packages'));
const Bookings = React.lazy(() => import('@/pages/admin/mandapam/Bookings'));
const BookingDetail = React.lazy(() => import('@/pages/admin/mandapam/BookingDetail'));

import { AuthProvider } from './hooks/useAuth';
import { LanguageProvider } from './context/LanguageContext';
import { CapsLockProvider } from './context/CapsLockContext';
const Login = React.lazy(() => import('@/pages/auth/Login'));
const AdminLogin = React.lazy(() => import('@/pages/auth/AdminLogin'));
const Signup = React.lazy(() => import('@/pages/auth/Signup'));
const ForgotPassword = React.lazy(() => import('@/pages/auth/ForgotPassword'));

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
              { path: "manamaalai/new-booking", element: <NewBooking /> },
              { path: "manamaalai/view-profile/:id", element: <ProfileView /> },
              { path: "manamaalai/plan-upgrade", element: <PlanUpgrade /> },
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
              { path: "admin/matrimony/account", element: <UserAccounts /> },
              { path: "admin/matrimony/account/:id", element: <AccountDetail /> },
              { path: "admin/matrimony/profiles", element: <Profiles /> },
              { path: "admin/matrimony/profiles/:id", element: <ProfileDetails /> },
              { path: "admin/matrimony/membership", element: <MembershipManagement /> },
              { path: "admin/mandapam/packages", element: <Packages /> },
              { path: "admin/mandapam/availability", element: <HallAvailability /> },
              { path: "admin/mandapam/bookings", element: <Bookings /> },
              { path: "admin/mandapam/bookings/:id", element: <BookingDetail /> },
              { path: "admin/mandapam/new-booking", element: <NewBooking /> },
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
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <RouterProvider router={router} />
            </Suspense>
          </ErrorBoundary>
        </AuthProvider>
        </CapsLockProvider>
      </LanguageProvider>
  );
}

export default App;
