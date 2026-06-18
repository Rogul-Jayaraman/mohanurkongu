# How to Add Translations

Add a new i18n key across both languages.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ADD TRANSLATION — 5 STEPS                           │
│                                                                         │
│   1. Add key to en/{namespace}.json    English translation             │
│   2. Add key to ta/{namespace}.json    Tamil translation               │
│   3. Use in component                  t('namespace:key')              │
│   4. Verify in browser                 Switch language, check display  │
│   5. (Optional) Add parameterized      t('key', { count, name })      │
│                                                                         │
│   ┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐                           │
│   │ en/  │──▶│ ta/  │──▶│ Use  │──▶│Check │                           │
│   └──────┘   └──────┘   └──────┘   └──────┘                           │
└─────────────────────────────────────────────────────────────────────────┘
```

## Step 1: Add English Key

```json
// frontend/src/i18n/en/profile.json
{
  "stats": {
    "title": "Profile Stats",
    "shortlistCount": "Shortlisted {{count}} times",
    "viewCount": "Viewed {{count}} times",
    "daysBack": "Last {{days}} days"
  }
}
```

## Step 2: Add Tamil Key

```json
// frontend/src/i18n/ta/profile.json
{
  "stats": {
    "title": "சுயவிவர புள்ளிவிவரங்கள்",
    "shortlistCount": "{{count}} முறை சிறிய பட்டியலிடப்பட்டது",
    "viewCount": "{{count}} முறை பார்க்கப்பட்டது",
    "daysBack": "கடந்த {{days}} நாட்கள்"
  }
}
```

## Step 3: Use in Component

```typescript
import { useTranslation } from 'react-i18next';

function ProfileStats({ stats }: Props) {
  const { t } = useTranslation();

  return (
    <div>
      <h2>{t('profile:stats.title')}</h2>
      <p>{t('profile:stats.shortlistCount', { count: stats.shortlistCount })}</p>
      <p>{t('profile:stats.viewCount', { count: stats.viewCount })}</p>
      <p>{t('profile:stats.daysBack', { days: stats.period })}</p>
    </div>
  );
}
```

## Step 4: Verify

1. Set browser to English → check component renders "Shortlisted 5 times"
2. Set browser to Tamil → check component renders "5 முறை சிறிய பட்டியலிடப்பட்டது"
3. If key is missing in Tamil → English fallback should show

## Step 5: Namespace Registration

If adding a new namespace file:
```typescript
// frontend/src/i18n/config.ts
import profileEn from './en/profile.json';
import profileTa from './ta/profile.json';

// Add to resources object
resources: {
  en: { profile: profileEn },
  ta: { profile: profileTa },
}
```

## Rules

| Rule | Why |
|------|-----|
| Always use dot notation | `auth:login.title` not `auth_login_title` |
| Always add to BOTH languages | Missing key shows key string (ugly) |
| Parameterize dynamic values | `{{count}}`, `{{name}}` not string concatenation |
| Namespace matches feature area | `auth`, `profile`, `booking`, `common` |
| One JSON file per namespace | Clear separation, easy to find |
