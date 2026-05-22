# Auth Provider Integration Guide

## How to Add a New Auth Provider

Adding a new authentication method requires work in **4 places** total (2 backend, 2 frontend). No changes needed to routes, controllers, middleware, or existing components.

---

## Step-by-Step: Google OAuth

### 1. Backend: Create Provider Strategy

```typescript
// backend/src/services/auth/providers/google.ts

import { OAuth2Client } from 'google-auth-library';
import { AuthProvider, AuthProviderType, AuthPortal, AuthResult } from './types';
import * as authService from '../auth';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class GoogleAuthProvider implements AuthProvider {
  readonly type = AuthProviderType.GOOGLE;

  async authenticate(credentials: { idToken: string }, portal: AuthPortal): Promise<AuthResult> {
    // 1. Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credentials.idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload()!;
    const { sub: googleId, email, given_name, family_name } = payload;

    if (!email) {
      throw new Error('Google account must have an email');
    }

    // 2. Determine which table to use based on portal
    const table = portal === AuthPortal.ADMIN ? 'admin' : 'user';
    const findFn = portal === AuthPortal.ADMIN
      ? authService.findAdminByEmail
      : authService.findUserByEmail;

    // 3. Look up existing user by provider+id or by email
    let account = await findFn(email);

    if (account) {
      // Existing account -- check if already linked to Google
      if (account.authProvider !== AuthProviderType.GOOGLE) {
        // Email exists with a different provider -- could link or reject
        throw new Error('Email already registered with a different provider');
      }
      return {
        userId: account.id,
        providerType: AuthProviderType.GOOGLE,
        providerUserId: googleId,
        email,
        isNewUser: false,
        portal,
        profile: { firstNameEn: account.firstNameEn, lastNameEn: account.lastNameEn },
      };
    }

    // 4. Create new user (first-time Google login)
    const createFn = portal === AuthPortal.ADMIN
      ? (d: any) => authService.createAdmin(d)
      : (d: any) => authService.createUser(d);

    const customId = await authService.generateCustomId();
    const newUser = await createFn({
      customId: portal === AuthPortal.USER ? customId : undefined,
      email,
      firstNameEn: given_name || email.split('@')[0],
      lastNameEn: family_name || '',
      firstNameTa: '',
      lastNameTa: '',
      phone: '',
      password: null,          // No password for OAuth users
      authProvider: AuthProviderType.GOOGLE,
      providerId: googleId,
    });

    return {
      userId: newUser.id,
      providerType: AuthProviderType.GOOGLE,
      providerUserId: googleId,
      email,
      isNewUser: true,
      portal,
      profile: { firstNameEn: newUser.firstNameEn, lastNameEn: newUser.lastNameEn },
    };
  }
}
```

### 2. Backend: Register Provider

```typescript
// backend/src/services/auth/providers/index.ts

import { GoogleAuthProvider } from './google';

// Register in the factory
authProviderFactory.register(new GoogleAuthProvider());
```

### 3. Frontend: Create Button Component

```typescript
// frontend/src/auth/components/GoogleLoginButton.tsx

import { useGoogleLogin } from '@react-oauth/google';
import type { ProviderButtonProps } from '../providers/types';

export const GoogleLoginButton: React.FC<ProviderButtonProps> = ({ onSuccess, onError }) => {
  const login = useGoogleLogin({
    flow: 'implicit',                      // Returns access_token
    onSuccess: async (tokenResponse) => {
      // Exchange access_token for a backend JWT
      try {
        const { data } = await api.post('/auth/authenticate', {
          provider: 'GOOGLE',
          portal: 'USER',
          credentials: { accessToken: tokenResponse.access_token },
        });
        onSuccess(data.token, data.user);
      } catch (err) {
        onError(err);
      }
    },
    onError: (err) => onError(err),
  });

  return (
    <button onClick={() => login()} className="google-login-btn">
      <img src="/icons/google.svg" alt="Google" />
      <span>Continue with Google</span>
    </button>
  );
};
```

**Alternative (ID token flow with Google Identity Services):**
```typescript
import { CredentialResponse, GoogleLogin } from '@react-oauth/google';

<GoogleLogin
  onSuccess={async (credentialResponse: CredentialResponse) => {
    const { data } = await api.post('/auth/authenticate', {
      provider: 'GOOGLE',
      portal: 'USER',
      credentials: { idToken: credentialResponse.credential },
    });
    onSuccess(data.token, data.user);
  }}
  onError={() => onError('Google login failed')}
/>
```

**Install required package:**
```bash
npm install @react-oauth/google
```

**Wrap app with provider:**
```typescript
// frontend/src/App.tsx or main.tsx
import { GoogleOAuthProvider } from '@react-oauth/google';

<GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
  <App />
</GoogleOAuthProvider>
```

### 4. Frontend: Register in Config

```typescript
// frontend/src/auth/providers/registry.ts

import { GoogleLoginButton } from '../components/GoogleLoginButton';

export const authProviderConfigs: AuthProviderConfig[] = [
  { id: 'PASSWORD', name: 'Email',  icon: 'mail',     component: PasswordLoginForm },
  { id: 'GOOGLE',   name: 'Google', icon: '/icons/google.svg', component: GoogleLoginButton },
  { id: 'PHONE',    name: 'Phone',  icon: 'phone',    component: PhoneLoginForm },
];
```

---

## Step-by-Step: Fix Phone OTP (SMS Delivery)

Currently phone OTPs are only logged to console. Here's how to integrate an SMS provider.

### Option A: Twilio

**1. Install Twilio SDK:**
```bash
npm install twilio
```

**2. Create SMS service:**

```typescript
// backend/src/services/sms.ts

import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendSMS = async (phone: string, message: string): Promise<void> => {
  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
    console.log(`[SMS] Sent to ${phone}`);
  } catch (error: any) {
    console.error(`[SMS] Failed to send to ${phone}:`, error.message);
    throw error;
  }
};
```

**3. Create Phone Auth Provider:**

```typescript
// backend/src/services/auth/providers/phone.ts

import { sendSMS } from '../../sms';
import { AuthProvider, AuthProviderType, AuthPortal, AuthResult } from './types';
import * as authService from '../auth';

export class PhoneAuthProvider implements AuthProvider {
  readonly type = AuthProviderType.PHONE;

  async authenticate(credentials: { phone: string; otp: string }, portal: AuthPortal): Promise<AuthResult> {
    // Verify OTP against Verification table
    const verification = await authService.findVerification(credentials.phone, 'PHONE');
    if (!verification || verification.otp !== credentials.otp || verification.expiresAt < new Date()) {
      throw new Error('Invalid or expired OTP');
    }

    // Mark as VERIFIED
    const expiry = new Date(Date.now() + 10 * 60 * 1000);
    await authService.upsertVerification(credentials.phone, 'PHONE', 'VERIFIED', expiry);

    // Check if user already exists
    const user = await authService.findUserByIdentifier(credentials.phone);
    if (user) {
      return {
        userId: user.id,
        providerType: AuthProviderType.PHONE,
        phone: credentials.phone,
        isNewUser: false,
        portal,
        profile: { firstNameEn: user.firstNameEn, lastNameEn: user.lastNameEn },
      };
    }

    // First-time phone user: return isNewUser=true, let registration flow complete
    return {
      userId: '',
      providerType: AuthProviderType.PHONE,
      phone: credentials.phone,
      isNewUser: true,
      portal,
      profile: {},
    };
  }

  // Called during registration to send the SMS
  async sendOtp(phone: string): Promise<void> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 3 * 60 * 1000);

    // Cooldown check
    const existing = await authService.findVerification(phone, 'PHONE');
    if (existing && existing.createdAt > new Date(Date.now() - 60 * 1000)) {
      throw new Error('Please wait 1 minute before requesting a new OTP');
    }

    await authService.upsertVerification(phone, 'PHONE', otp, expiry);
    await sendSMS(phone, `Your Mohanur Kongu verification code is: ${otp}`);
  }
}
```

**4. Update `sendRegistrationOtp` controller to use the provider:**

```typescript
// In controllers/auth.ts

if (type === 'PHONE') {
  const phoneProvider = authProviderFactory.get(AuthProviderType.PHONE) as PhoneAuthProvider;
  await phoneProvider.sendOtp(identifier);
}
```

### Option B: MSG91

```typescript
// backend/src/services/sms.ts

import axios from 'axios';

export const sendSMS = async (phone: string, message: string): Promise<void> => {
  try {
    await axios.get('https://api.msg91.com/api/v5/flow/', {
      params: {
        authkey: process.env.MSG91_AUTH_KEY,
        mobiles: phone.replace('+', ''),
        message,
        sender: process.env.MSG91_SENDER_ID,
        route: '4', // Transactional route
      },
    });
    console.log(`[SMS] Sent to ${phone}`);
  } catch (error: any) {
    console.error(`[SMS] Failed to send to ${phone}:`, error.message);
    throw error;
  }
};
```

### Environment variables to add:

```env
# Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# OR MSG91
MSG91_AUTH_KEY=your_auth_key
MSG91_SENDER_ID=MKMAT

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

---

## Provider Integration Checklist

Use this checklist when adding any new auth provider:

### Backend

- [ ] Create `providers/<name>.ts` implementing `AuthProvider` interface
- [ ] Implement `authenticate(credentials, portal)` method
- [ ] Handle provider-specific credential verification (token verification, OTP check, etc.)
- [ ] Implement account lookup: `findByProviderId` or `findByEmail`
- [ ] Implement account creation for first-time users (isNewUser=true)
- [ ] Handle `password: null` for OAuth-only users
- [ ] Set `authProvider` and `providerId` on new records
- [ ] Register in `providers/index.ts` factory
- [ ] Add any new env vars to `.env.example`

### Frontend

- [ ] Create `<ProviderName>LoginButton.tsx` component
- [ ] Handle provider SDK initialization (if needed)
- [ ] Implement success callback: call `POST /auth/authenticate` with provider-specific credentials
- [ ] Implement error handling
- [ ] Add entry to `providers/registry.ts`
- [ ] Add any new env vars to `.env.example`

### Prisma

- [ ] Run migration to add `authProvider` and `providerId` fields
- [ ] Make `password` nullable
- [ ] Add `@@unique([authProvider, providerId])` constraint

### Testing

- [ ] Test successful authentication flow
- [ ] Test first-time user creation
- [ ] Test returning user login
- [ ] Test error states: invalid credentials, expired tokens, network failures
- [ ] Test portal routing (USER vs ADMIN)
