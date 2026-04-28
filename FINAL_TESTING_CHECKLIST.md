# ✅ FINAL TESTING CHECKLIST - Random Coffee HK

## 🎯 SERVERGA QO'YISHDAN OLDIN TEKSHIRISH

**Sana**: 2026-04-28  
**Status**: Testing in progress

---

## 1️⃣ AI TRANSLATION TESTING

### ✅ Tarjima funksiyasi
- [ ] **English → Chinese**: Profile edit da inglizcha yozib saqlash
  - `about`, `gives`, `wants` maydonlari
  - Database da `about_zh`, `gives_zh`, `wants_zh` ga saqlanishi
  - PeopleScreen da til o'zgartirganda ko'rinishi

- [ ] **Chinese → English**: Profile edit da xitoycha yozib saqlash
  - Database da `about`, `gives`, `wants` (EN) ga saqlanishi
  - Database da `about_zh`, `gives_zh`, `wants_zh` ga saqlanishi

- [ ] **Russian → English/Chinese**: Profile edit da ruscha yozib saqlash
  - Database da `about_ru`, `gives_ru`, `wants_ru` ga saqlanishi
  - Database da `about`, `gives`, `wants` (EN) ga saqlanishi

### ✅ Til bo'yicha ma'lumot ko'rinishi
- [ ] **PeopleScreen**: Til o'zgartirganda profil ma'lumotlari o'zgarishi
  - EN tili: `about`, `gives`, `wants`
  - ZH tili: `about_zh || about`, `gives_zh || gives`, `wants_zh || wants`
  - RU tili: `about_ru || about`, `gives_ru || gives`, `wants_ru || wants`

- [ ] **PersonProfileSheet**: Translate tugmasi ishlashi
  - Database dan tarjima olish (agar mavjud bo'lsa)
  - AI orqali tarjima qilish (agar database da yo'q bo'lsa)

- [ ] **MomentsScreen**: Til bo'yicha postlar ko'rinishi
  - EN tili: `text_en || text`
  - ZH tili: `text_zh || text_en || text`
  - RU tili: `text_ru || text_en || text`

### ✅ AI API ishlashi
- [ ] Groq API key mavjudligi
- [ ] OpenAI API key (fallback)
- [ ] Rate limiting yo'qligi (demo uchun OK)
- [ ] Error handling (AI fail bo'lsa fallback)

---

## 2️⃣ BOOST LOGIC TESTING

### ✅ Profile completeness check
- [ ] **To'liq profil**: Boost ishlashi kerak
  - Avatar mavjud
  - About to'ldirilgan
  - Gives to'ldirilgan
  - Wants to'ldirilgan

- [ ] **To'liq emas profil**: Boost ishlamasligi kerak
  - Avatar yo'q → Error toast
  - About bo'sh → Error toast
  - Gives bo'sh → Error toast
  - Wants bo'sh → Error toast
  - Toast matni: "Please complete your profile first (photo, about, gives, wants)"

### ✅ Matching logic
- [ ] **Mos odam topilsa**: Match yaratilishi
  - AI scoring ishlashi
  - Eng yuqori score li odam tanlanishi
  - Match database ga saqlanishi
  - Credit -1 bo'lishi
  - Success toast ko'rinishi

- [ ] **Mos odam topilmasa (filter bilan)**: Boshqa odam tavsiya qilish
  - Toast ko'rinishi: "No people match your filters"
  - "Would you like to meet someone new anyway?" so'rovi
  - "Yes, meet someone new!" tugmasi
  - Tugma bosilganda filter siz qidirish
  - Random odam bilan match yaratish

- [ ] **Mos odam topilmasa (filter siz)**: Error toast
  - Toast matni: "No new people to match with yet!"

### ✅ Edge cases
- [ ] Barcha odamlar bilan match qilingan
- [ ] Faqat to'liq emas profilli odamlar mavjud
- [ ] AI API fail bo'lsa fallback ishlashi
- [ ] Credit 0 bo'lganda "Buy Credits" modal ochilishi

---

## 3️⃣ SUPABASE DATA FETCHING

### ✅ Profile data
- [ ] `getProfile()` funksiyasi ishlashi
- [ ] Barcha ustunlar to'g'ri olinishi:
  - `about`, `gives`, `wants` (EN)
  - `about_zh`, `gives_zh`, `wants_zh` (ZH)
  - `about_ru`, `gives_ru`, `wants_ru` (RU)
  - `avatar_url`, `photos`
  - `coffee_credits`, `subscription_status`

### ✅ People data
- [ ] `getPeople()` funksiyasi ishlashi
- [ ] Til bo'yicha ma'lumotlar olinishi
- [ ] Blocked users filter qilinishi
- [ ] Banned users filter qilinishi

### ✅ Moments data
- [ ] `getMoments()` funksiyasi ishlashi
- [ ] Pinned postlar eng yuqorida ko'rinishi
- [ ] Til bo'yicha matnlar ko'rinishi
- [ ] Admin postlar "Official" badge bilan

### ✅ Realtime subscriptions
- [ ] Profile updates realtime ishlashi
- [ ] Match notifications realtime ishlashi
- [ ] Memory leak yo'qligi (stable channel names)

---

## 4️⃣ MULTI-LANGUAGE TESTING

### ✅ English (EN)
- [ ] Barcha UI elementlar inglizcha
- [ ] Profile data inglizcha ko'rinishi
- [ ] Moments inglizcha ko'rinishi
- [ ] Toast messages inglizcha

### ✅ Chinese (ZH)
- [ ] Barcha UI elementlar xitoycha
- [ ] Profile data xitoycha ko'rinishi (agar mavjud bo'lsa)
- [ ] Moments xitoycha ko'rinishi (agar mavjud bo'lsa)
- [ ] Toast messages xitoycha
- [ ] Pinned badge: "置顶"

### ✅ Russian (RU)
- [ ] Barcha UI elementlar ruscha
- [ ] Profile data ruscha ko'rinishi (agar mavjud bo'lsa)
- [ ] Moments ruscha ko'rinishi (agar mavjud bo'lsa)
- [ ] Toast messages ruscha
- [ ] Pinned badge: "Закреплено"

---

## 5️⃣ PIN TO TOP FEATURE

### ✅ Admin panel
- [ ] News yaratish
- [ ] "Pin to Top" tugmasi ishlashi
- [ ] Pinned counter to'g'ri ko'rinishi
- [ ] Unpin funksiyasi ishlashi

### ✅ Moments screen
- [ ] Pinned postlar eng yuqorida
- [ ] Pinned badge ko'rinishi (📌)
- [ ] 3 ta tilda badge to'g'ri ko'rinishi
- [ ] Saralash tartibi to'g'ri

---

## 6️⃣ PERFORMANCE TESTING

### ✅ Load times
- [ ] Dashboard < 500ms
- [ ] People screen < 2s
- [ ] Moments screen < 2s
- [ ] Profile edit < 1s

### ✅ Bundle size
- [ ] Total bundle < 900KB
- [ ] Code splitting ishlashi
- [ ] Lazy loading ishlashi

### ✅ Database queries
- [ ] Indexes ishlatilishi
- [ ] N+1 query yo'qligi
- [ ] Materialized views ishlashi

---

## 7️⃣ ERROR HANDLING

### ✅ Network errors
- [ ] Offline banner ko'rinishi
- [ ] Retry logic ishlashi
- [ ] User-friendly error messages

### ✅ API errors
- [ ] AI API fail → fallback
- [ ] Supabase error → toast
- [ ] Payment error → modal

### ✅ Validation errors
- [ ] Form validation
- [ ] Profile completeness check
- [ ] Credit check

---

## 8️⃣ SECURITY TESTING

### ✅ Authentication
- [ ] OTP login ishlashi
- [ ] Session management
- [ ] Auto-refresh token

### ✅ Authorization
- [ ] RLS policies ishlashi
- [ ] Admin check ishlashi
- [ ] Blocked users ko'rinmasligi

### ✅ Data protection
- [ ] XSS prevention
- [ ] SQL injection prevention
- [ ] CSRF protection

---

## 9️⃣ MOBILE TESTING

### ✅ Responsive design
- [ ] iPhone (375px)
- [ ] Android (360px)
- [ ] Tablet (768px)

### ✅ Touch interactions
- [ ] Swipe gestures
- [ ] Double tap (moments)
- [ ] Long press

### ✅ PWA
- [ ] Install prompt
- [ ] Offline mode
- [ ] Push notifications (agar mavjud bo'lsa)

---

## 🔟 BROWSER TESTING

### ✅ Desktop browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### ✅ Mobile browsers
- [ ] Chrome Mobile
- [ ] Safari iOS
- [ ] Samsung Internet

---

## 📊 TESTING RESULTS

### Critical Issues (Must fix before deploy)
- [ ] None found

### Medium Issues (Should fix)
- [ ] None found

### Minor Issues (Can fix later)
- [ ] None found

---

## ✅ DEPLOYMENT READINESS

### Pre-deployment checklist
- [ ] All tests passed
- [ ] No critical bugs
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Build successful
- [ ] Performance acceptable

### Post-deployment monitoring
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] User feedback collection
- [ ] Database metrics

---

## 📝 TESTING NOTES

### AI Translation
```javascript
// Test case 1: English → Chinese
Input: "I'm a software engineer looking for co-founders"
Expected: Database da `about_zh` ga xitoycha tarjima saqlanishi
Actual: [Test natijasi]

// Test case 2: Chinese → English
Input: "我是一名软件工程师，正在寻找联合创始人"
Expected: Database da `about` ga inglizcha tarjima saqlanishi
Actual: [Test natijasi]
```

### Boost Logic
```javascript
// Test case 1: Incomplete profile
Profile: { about: '', gives: '', wants: '', avatar: null }
Expected: Error toast "Please complete your profile first"
Actual: [Test natijasi]

// Test case 2: No matching candidates with filters
Filters: { regions: ['Tokyo'] }
Candidates: [] (no one in Tokyo)
Expected: Toast with "meet someone new anyway?" option
Actual: [Test natijasi]
```

### Pin to Top
```javascript
// Test case 1: Pin news post
Action: Admin pins a news post
Expected: Post appears at top of Moments with 📌 badge
Actual: [Test natijasi]

// Test case 2: Multiple pinned posts
Action: Admin pins 3 posts
Expected: All 3 at top, sorted by created_at
Actual: [Test natijasi]
```

---

## 🎯 FINAL VERDICT

**Ready for deployment**: ⬜ YES / ⬜ NO

**Reason**: [Sabab yozing]

**Next steps**: [Keyingi qadamlar]
