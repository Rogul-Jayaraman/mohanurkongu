# Internationalization (i18n)

Full English + Tamil support with automatic transliteration.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      I18N ARCHITECTURE                                 │
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │                LANGUAGE DETECTION                             │     │
│   │                                                              │     │
│   │   Browser Accept-Language ──┐                                │     │
│   │                             ├──▶ Detected Language           │     │
│   │   User preference cookie ───┘     │                          │     │
│   │                                   ▼                          │     │
│   │                    ┌──────────────────────────┐              │     │
│   │                    │ LanguageProvider context  │              │     │
│   │                    │ sets t() function         │              │     │
│   │                    └──────────────────────────┘              │     │
│   └──────────────────────────────────────────────────────────────┘     │
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │                 16 NAMESPACES                                 │     │
│   │                                                              │     │
│   │   en/                         ta/                            │     │
│   │   ├── common.json             ├── common.json               │     │
│   │   ├── auth.json               ├── auth.json                 │     │
│   │   ├── profile.json            ├── profile.json              │     │
│   │   ├── booking.json            ├── booking.json              │     │
│   │   ├── validation.json         ├── validation.json           │     │
│   │   ├── error.json              ├── error.json                │     │
│   │   ├── admin.json              ├── admin.json                │     │
│   │   └── ... (9 more)            └── ... (9 more)              │     │
│   └──────────────────────────────────────────────────────────────┘     │
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │                TRANSLITERATION SYSTEM                        │     │
│   │                                                              │     │
│   │   Tamil text can be written in:                              │     │
│   │   - Tamil script: குமார்                                    │     │
│   │   - Latin script (auto-detected): Kumar                     │     │
│   │                                                              │     │
│   │   When user types Latin, the lookup checks both:            │     │
│   │   - Exact Tamil match                                        │     │
│   │   - Phonetic transliteration to Tamil                        │     │
│   │                                                              │     │
│   │   Result: Search for "Kumar" also finds "குமார்" profiles   │     │
│   └──────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
```

## Usage

```typescript
// In any React component:
const { t } = useTranslation();

// Dot-notation key (namespace auto-detected from file)
t('auth:login.title')          // → "Login" or "உள்நுழை"
t('common:errors.notFound')    // → "Not found" or "கிடைக்கவில்லை"
t('validation:required', { field: 'Email' })
// → "Email is required" or "மின்னஞ்சல் தேவை"

// Numbers, dates
t('common:results', { count: 5 })
// → "5 results" or "5 முடிவுகள்"
```

## Adding a New Key

See [How to Add Translations](../04-development/04-05-HOW_TO_ADD_TRANSLATIONS.md) for the step-by-step guide.

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Key missing in ta/ | Falls back to en/ key |
| Key missing in both | Shows the key string (`auth:login.title`) |
| Language not detected | Defaults to Tamil |
| Transliteration ambiguity | Returns multiple candidates, user picks |
| Plural rules | English: simple s/es. Tamil: handled via separate key |
| RTL text | Not applicable (Tamil is LTR) |
