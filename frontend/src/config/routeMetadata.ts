export interface RouteMeta {
  ns: string;
  key: string;
}

type RouteMatch = Record<string, RouteMeta>;

const routes: RouteMatch = {
  '/':                            { ns: 'landing', key: 'meta' },
  '/maaligai':                   { ns: 'maaligai', key: 'home.meta' },
  '/maaligai/about':             { ns: 'maaligai', key: 'about.meta' },
  '/maaligai/facilities':        { ns: 'maaligai', key: 'facilities.meta' },
  '/maaligai/gallery':           { ns: 'maaligai', key: 'gallery.meta' },
  '/maaligai/packages':          { ns: 'maaligai', key: 'packages.meta' },
  '/maaligai/contact':           { ns: 'maaligai', key: 'contact.meta' },
  '/maaligai/hall-availability':  { ns: 'maaligai', key: 'packages.hallAvailability.meta' },
  '/manamaalai/login':           { ns: 'auth', key: 'login.meta' },
  '/manamaalai/signup':          { ns: 'signup', key: 'meta' },
  '/manamaalai/forgot-password': { ns: 'auth', key: 'forgot.meta' },
  '/manamaalai/dashboard':       { ns: 'dashboard', key: 'meta' },
  '/manamaalai/browse-profiles': { ns: 'browse', key: 'meta' },
  '/manamaalai/shortlist':       { ns: 'shortlist', key: 'meta' },
  '/manamaalai/my-profiles':     { ns: 'myprofiles', key: 'meta' },
  '/manamaalai/my-account':      { ns: 'myaccount', key: 'meta' },
  '/manamaalai/new-profile':     { ns: 'profile_new', key: 'meta' },
  '/manamaalai/plan-upgrade':    { ns: 'dashboard', key: 'meta' },
  '/admin/login':                { ns: 'adminLogin', key: 'meta' },
  '/admin/dashboard':            { ns: 'adminLayout', key: 'meta.dashboard' },
  '/admin/analytics':            { ns: 'analytics', key: 'meta' },
  '/admin/settings':             { ns: 'adminLayout', key: 'meta.settings' },
  '/admin/matrimony/verification':   { ns: 'adminMatrimony', key: 'meta.verification' },
  '/admin/matrimony/account':          { ns: 'adminMatrimony', key: 'meta.users' },
  '/admin/matrimony/profiles':       { ns: 'adminMatrimony', key: 'meta.profiles' },
  '/admin/matrimony/membership':     { ns: 'adminMatrimony', key: 'meta.membership' },
  '/admin/mandapam/packages':        { ns: 'adminMandapam', key: 'meta.packages' },
  '/admin/mandapam/availability':    { ns: 'adminMandapam', key: 'meta.availability' },
  '/admin/mandapam/bookings':        { ns: 'adminMandapam', key: 'meta.bookings' },
};

const wildcardRoutes: { prefix: string; meta: RouteMeta }[] = [
  { prefix: '/manamaalai/view-profile', meta: { ns: 'common', key: 'profileView.meta' } },
  { prefix: '/admin/matrimony/profiles', meta: { ns: 'adminLayout', key: 'meta.profile_details' } },
  { prefix: '/admin/matrimony/account', meta: { ns: 'adminLayout', key: 'meta.account_detail' } },
  { prefix: '/admin/mandapam/bookings', meta: { ns: 'adminLayout', key: 'meta.booking_detail' } },
];

export function matchRoute(pathname: string): RouteMeta {
  const exact = routes[pathname];
  if (exact) return exact;

  for (const wc of wildcardRoutes) {
    if (pathname.startsWith(wc.prefix + '/') || pathname === wc.prefix) {
      return wc.meta;
    }
  }

  return { ns: 'common', key: 'notFound.meta' };
}
