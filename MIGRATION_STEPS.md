# 🚀 MIGRATION QADAMLARI (O'zbek tilida)

## 1-QADAM: Asosiy fixlarni o'rnatish (MUHIM!)

Supabase Dashboard → SQL Editor ga o'ting va `SIMPLE_FIX.sql` faylini ishga tushiring:

```bash
# Yoki terminalda:
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/SIMPLE_FIX.sql
```

Bu quyidagilarni o'rnatadi:
- ✅ Payment race condition fix
- ✅ Atomic payment function
- ✅ Asosiy indexlar

## 2-QADAM: Indexlarni alohida qo'shish (Ixtiyoriy, lekin tavsiya etiladi)

`INDEXES_SEPARATELY.sql` faylini oching va har bir qatorni **ALOHIDA** ishga tushiring:

```sql
-- Birinchi qator:
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_region ON profiles(region);

-- Kutib turing (10-30 soniya)

-- Ikkinchi qator:
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_banned ON profiles(banned) WHERE banned = true;

-- Va hokazo...
```

**Muhim:** `CONCURRENTLY` ishlatganda har bir qatorni alohida ishga tushiring!

## 3-QADAM: Tekshirish

```sql
-- Indexlar yaratilganini tekshiring:
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- Payment function mavjudligini tekshiring:
SELECT proname FROM pg_proc WHERE proname = 'confirm_payment_atomic';
```

## 4-QADAM: Kodda test qiling

1. Payment flow test qiling
2. Dashboard tezligini tekshiring
3. Realtime subscriptions ishlayotganini tekshiring

## Muammolar bo'lsa:

### "constraint already exists" xatosi
```sql
-- Constraint ni o'chirib, qaytadan qo'shing:
ALTER TABLE payments DROP CONSTRAINT IF EXISTS unique_provider_ref;
ALTER TABLE payments ADD CONSTRAINT unique_provider_ref UNIQUE (provider_ref);
```

### "function already exists" xatosi
```sql
-- Function ni o'chirib, qaytadan yarating:
DROP FUNCTION IF EXISTS confirm_payment_atomic;
-- Keyin SIMPLE_FIX.sql dan function qismini qayta ishga tushiring
```

### Index yaratilmayapti
```sql
-- CONCURRENTLY ni olib tashlang va oddiy yarating:
CREATE INDEX IF NOT EXISTS idx_profiles_region ON profiles(region);
```

## Qo'shimcha ma'lumot:

- ✅ Barcha code fixlar allaqachon qo'llanilgan
- ✅ Faqat database migration qoldi
- ✅ SIMPLE_FIX.sql eng muhim fixlarni o'z ichiga oladi
- ⚠️ Indexlar ixtiyoriy, lekin performance uchun yaxshi

## Yordam kerak bo'lsa:

Telegram: @your_username
Email: support@randomcoffeehk.com
