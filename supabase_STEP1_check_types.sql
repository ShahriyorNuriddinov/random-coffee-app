-- QADAM 1: Ustunlar tipini tekshirish
-- Bu faqat SELECT — hech narsani o'zgartirmaydi
-- Natijani ko'rib, qaysi jadvalda UUID bor ekanini bilamiz

SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('likes','matches','moments','moment_likes','meeting_feedback','profiles','payments','blocked_users','reports')
  AND column_name IN ('id','user_id','from_user_id','to_user_id','user1_id','user2_id','blocker_id','blocked_id','reporter_id','reported_id','match_id')
ORDER BY table_name, column_name;
