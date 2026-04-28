# Russian Language Translation Fix

## Problem
When users select Russian language, profile data (about, gives, wants) is displayed in English instead of Russian because:
1. The `targetLang` variable was only checking for Chinese (`zh`), defaulting to English for all other languages
2. Database columns for Russian translations (`about_ru`, `gives_ru`, `wants_ru`) may not exist yet

## Solution Applied

### 1. Fixed PersonProfileSheet Component
**File:** `src/components/people/PersonProfileSheet.jsx`

Changed:
```javascript
const targetLang = i18n.language === 'zh' ? 'zh' : 'en'
```

To:
```javascript
const targetLang = i18n.language === 'zh' ? 'zh' : i18n.language === 'ru' ? 'ru' : 'en'
```

Also updated the translation logic to check for Russian translations in the database:
- Added check for `person.about_ru`, `person.gives_ru`, `person.wants_ru`
- Updated display logic to show Russian translations when available

### 2. Created Database Migration
**File:** `supabase/migrations/ADD_RUSSIAN_TRANSLATIONS.sql`

This migration adds three new columns to the `profiles` table:
- `about_ru` (TEXT) - Russian translation of "About Me"
- `gives_ru` (TEXT) - Russian translation of "Can Give"
- `wants_ru` (TEXT) - Russian translation of "Wants to Get"

### 3. Existing Support Confirmed
The following files already have Russian language support:
- ✅ `src/screens/PeopleScreen.jsx` - displays Russian translations from DB
- ✅ `src/components/meetings/MatchCard.jsx` - handles Russian language for AI explanations
- ✅ `src/screens/ProfileEditScreen.jsx` - saves Russian translations when profile is updated
- ✅ `src/lib/aiUtils.js` - AI translation functions support Russian
- ✅ `src/i18n.js` - complete Russian translations for UI
- ✅ `src/lib/supabaseClient.js` - already queries `about_ru`, `gives_ru`, `wants_ru` columns

## How to Apply the Fix

### Step 1: Run the Database Migration
Execute the migration file in your Supabase SQL editor:

```bash
# Option 1: Using Supabase CLI
supabase db push

# Option 2: Manually in Supabase Dashboard
# 1. Go to Supabase Dashboard → SQL Editor
# 2. Copy contents of supabase/migrations/ADD_RUSSIAN_TRANSLATIONS.sql
# 3. Paste and run
```

### Step 2: Deploy Code Changes
The code changes are already applied to:
- `src/components/people/PersonProfileSheet.jsx`

Deploy these changes to your production environment.

### Step 3: Verify the Fix

1. **Change language to Russian:**
   - Open the app
   - Go to Profile → Language
   - Select "Русский"

2. **Check profile display:**
   - Go to People tab
   - Open any user profile
   - Verify that profile data is displayed in Russian (if translations exist)
   - Click "🌐 Translate" button to trigger AI translation if DB translations don't exist

3. **Check AI translation:**
   - If a profile doesn't have Russian translations in the database
   - The AI will automatically translate it to Russian when you view it
   - The translation will be cached in sessionStorage for performance

## How It Works

### Translation Priority
When a Russian-speaking user views a profile:

1. **First:** Check if `about_ru`, `gives_ru`, `wants_ru` exist in database → use them
2. **Second:** If not, check sessionStorage cache → use cached AI translation
3. **Third:** If not cached, trigger AI translation → cache result
4. **Fallback:** Show original English text

### When Translations Are Created
Russian translations are automatically created when:
- A user updates their profile (ProfileEditScreen detects language and translates)
- A user clicks the "🌐 Translate" button (AI translates on-demand)

## Testing Checklist

- [ ] Database migration runs successfully
- [ ] Russian language selection works in UI
- [ ] Profile data displays in Russian when translations exist
- [ ] AI translation works when clicking "🌐 Translate" button
- [ ] Meeting cards show Russian explanations
- [ ] People list shows Russian translations
- [ ] No console errors related to missing columns

## Notes

- **Performance:** AI translations are cached in sessionStorage to avoid repeated API calls
- **Fallback:** If AI translation fails, original English text is shown
- **Existing Data:** Existing profiles will need to be updated or translated on-demand
- **Future:** Consider batch translating existing profiles in the background

## Related Files Modified

1. `src/components/people/PersonProfileSheet.jsx` - Fixed targetLang detection
2. `supabase/migrations/ADD_RUSSIAN_TRANSLATIONS.sql` - Added DB columns

## Related Files (Already Supporting Russian)

1. `src/screens/PeopleScreen.jsx`
2. `src/components/meetings/MatchCard.jsx`
3. `src/screens/ProfileEditScreen.jsx`
4. `src/lib/aiUtils.js`
5. `src/i18n.js`
6. `src/lib/supabaseClient.js`
