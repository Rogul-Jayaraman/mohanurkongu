import { commonEn } from './en/common';
import { commonTa } from './ta/common';
import { authEn } from './en/auth/auth';
import { authTa } from './ta/auth/auth';
import { signupEn } from './en/auth/signup';
import { signupTa } from './ta/auth/signup';
import { adminLoginEn } from './en/auth/adminLogin';
import { adminLoginTa } from './ta/auth/adminLogin';
import { adminLayoutEn } from './en/admin/layout';
import { adminLayoutTa } from './ta/admin/layout';
import { adminMandapamEn } from './en/admin/mandapam';
import { adminMandapamTa } from './ta/admin/mandapam';
import { adminMatrimonyEn } from './en/admin/matrimony';
import { adminMatrimonyTa } from './ta/admin/matrimony';
import { analyticsEn } from './en/admin/analytics';
import { analyticsTa } from './ta/admin/analytics';
import { dashboardEn } from './en/user/dashboard';
import { dashboardTa } from './ta/user/dashboard';
import { browseEn } from './en/user/browse';
import { browseTa } from './ta/user/browse';
import { shortlistEn } from './en/user/shortlist';
import { shortlistTa } from './ta/user/shortlist';
import { myProfilesEn } from './en/user/myprofiles';
import { myProfilesTa } from './ta/user/myprofiles';
import { myAccountEn } from './en/user/myaccount';
import { myAccountTa } from './ta/user/myaccount';
import { profileNewEn } from './en/user/profile_new';
import { profileNewTa } from './ta/user/profile_new';
import { errorsEn } from './en/errors';
import { errorsTa } from './ta/errors';
import { landingEn } from './en/landing';
import { landingTa } from './ta/landing';
import { maaligaiEn } from './en/maaligai';
import { maaligaiTa } from './ta/maaligai';

export const resources = {
  en: {
    common: commonEn,
    auth: authEn,
    landing: landingEn,
    maaligai: maaligaiEn,
    signup: signupEn,
    adminLogin: adminLoginEn,
    adminLayout: adminLayoutEn,
    adminMandapam: adminMandapamEn,
    adminMatrimony: adminMatrimonyEn,
    analytics: analyticsEn,
    dashboard: dashboardEn,
    browse: browseEn,
    shortlist: shortlistEn,
    myprofiles: myProfilesEn,
    myaccount: myAccountEn,
    profile_new: profileNewEn,
    errors: errorsEn,
  },
  ta: {
    common: commonTa,
    auth: authTa,
    landing: landingTa,
    maaligai: maaligaiTa,
    signup: signupTa,
    adminLogin: adminLoginTa,
    adminLayout: adminLayoutTa,
    adminMandapam: adminMandapamTa,
    adminMatrimony: adminMatrimonyTa,
    analytics: analyticsTa,
    dashboard: dashboardTa,
    browse: browseTa,
    shortlist: shortlistTa,
    myprofiles: myProfilesTa,
    myaccount: myAccountTa,
    profile_new: profileNewTa,
    errors: errorsTa,
  },
};
