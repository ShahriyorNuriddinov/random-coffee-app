-- ═══════════════════════════════════════════════════════════════════════════
-- SEED: Add 2-4 photos to ALL test profiles
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Alex Chen
UPDATE public.profiles SET avatar_url = 'https://picsum.photos/seed/alex1/400/400',
photos = ARRAY['https://picsum.photos/seed/alex1/400/400','https://picsum.photos/seed/alex2/400/400','https://picsum.photos/seed/alex3/400/400','https://picsum.photos/seed/alex4/400/400']
WHERE id = '11111111-0000-0000-0000-000000000001';

-- 2. Mia Wong
UPDATE public.profiles SET avatar_url = 'https://picsum.photos/seed/mia1/400/400',
photos = ARRAY['https://picsum.photos/seed/mia1/400/400','https://picsum.photos/seed/mia2/400/400','https://picsum.photos/seed/mia3/400/400',NULL]
WHERE id = '11111111-0000-0000-0000-000000000002';

-- 3. David Li
UPDATE public.profiles SET avatar_url = 'https://picsum.photos/seed/david1/400/400',
photos = ARRAY['https://picsum.photos/seed/david1/400/400','https://picsum.photos/seed/david2/400/400','https://picsum.photos/seed/david3/400/400','https://picsum.photos/seed/david4/400/400']
WHERE id = '11111111-0000-0000-0000-000000000003';

-- 4. Sarah Kim
UPDATE public.profiles SET avatar_url = 'https://picsum.photos/seed/sarah1/400/400',
photos = ARRAY['https://picsum.photos/seed/sarah1/400/400','https://picsum.photos/seed/sarah2/400/400','https://picsum.photos/seed/sarah3/400/400',NULL]
WHERE id = '11111111-0000-0000-0000-000000000004';

-- 5. Kevin Zhang
UPDATE public.profiles SET avatar_url = 'https://picsum.photos/seed/kevin1/400/400',
photos = ARRAY['https://picsum.photos/seed/kevin1/400/400','https://picsum.photos/seed/kevin2/400/400','https://picsum.photos/seed/kevin3/400/400',NULL]
WHERE id = '11111111-0000-0000-0000-000000000005';

-- 6. Emma Lau
UPDATE public.profiles SET avatar_url = 'https://picsum.photos/seed/emma1/400/400',
photos = ARRAY['https://picsum.photos/seed/emma1/400/400','https://picsum.photos/seed/emma2/400/400','https://picsum.photos/seed/emma3/400/400','https://picsum.photos/seed/emma4/400/400']
WHERE id = '11111111-0000-0000-0000-000000000006';

-- 7. James Ho
UPDATE public.profiles SET avatar_url = 'https://picsum.photos/seed/james1/400/400',
photos = ARRAY['https://picsum.photos/seed/james1/400/400','https://picsum.photos/seed/james2/400/400','https://picsum.photos/seed/james3/400/400','https://picsum.photos/seed/james4/400/400']
WHERE id = '11111111-0000-0000-0000-000000000007';

-- 8. Lisa Chan
UPDATE public.profiles SET avatar_url = 'https://picsum.photos/seed/lisa1/400/400',
photos = ARRAY['https://picsum.photos/seed/lisa1/400/400','https://picsum.photos/seed/lisa2/400/400','https://picsum.photos/seed/lisa3/400/400',NULL]
WHERE id = '11111111-0000-0000-0000-000000000008';

-- 9. Tom Wu
UPDATE public.profiles SET avatar_url = 'https://picsum.photos/seed/tom1/400/400',
photos = ARRAY['https://picsum.photos/seed/tom1/400/400','https://picsum.photos/seed/tom2/400/400','https://picsum.photos/seed/tom3/400/400',NULL]
WHERE id = '11111111-0000-0000-0000-000000000009';

-- 10. Nina Ng
UPDATE public.profiles SET avatar_url = 'https://picsum.photos/seed/nina1/400/400',
photos = ARRAY['https://picsum.photos/seed/nina1/400/400','https://picsum.photos/seed/nina2/400/400','https://picsum.photos/seed/nina3/400/400','https://picsum.photos/seed/nina4/400/400']
WHERE id = '11111111-0000-0000-0000-000000000010';

-- 11. Ryan Cheung
UPDATE public.profiles SET avatar_url = 'https://picsum.photos/seed/ryan1/400/400',
photos = ARRAY['https://picsum.photos/seed/ryan1/400/400','https://picsum.photos/seed/ryan2/400/400','https://picsum.photos/seed/ryan3/400/400',NULL]
WHERE id = '11111111-0000-0000-0000-000000000011';

-- 12. Chloe Yip
UPDATE public.profiles SET avatar_url = 'https://picsum.photos/seed/chloe1/400/400',
photos = ARRAY['https://picsum.photos/seed/chloe1/400/400','https://picsum.photos/seed/chloe2/400/400','https://picsum.photos/seed/chloe3/400/400','https://picsum.photos/seed/chloe4/400/400']
WHERE id = '11111111-0000-0000-0000-000000000012';

-- 13. Michael Tan
UPDATE public.profiles SET avatar_url = 'https://picsum.photos/seed/michael1/400/400',
photos = ARRAY['https://picsum.photos/seed/michael1/400/400','https://picsum.photos/seed/michael2/400/400','https://picsum.photos/seed/michael3/400/400',NULL]
WHERE id = '11111111-0000-0000-0000-000000000013';

-- 14. Amy Fong
UPDATE public.profiles SET avatar_url = 'https://picsum.photos/seed/amy1/400/400',
photos = ARRAY['https://picsum.photos/seed/amy1/400/400','https://picsum.photos/seed/amy2/400/400','https://picsum.photos/seed/amy3/400/400','https://picsum.photos/seed/amy4/400/400']
WHERE id = '11111111-0000-0000-0000-000000000014';

-- 15. Ben Leung
UPDATE public.profiles SET avatar_url = 'https://picsum.photos/seed/ben1/400/400',
photos = ARRAY['https://picsum.photos/seed/ben1/400/400','https://picsum.photos/seed/ben2/400/400','https://picsum.photos/seed/ben3/400/400',NULL]
WHERE id = '11111111-0000-0000-0000-000000000015';

-- 16. Jason Park
UPDATE public.profiles SET avatar_url = 'https://picsum.photos/seed/jason1/400/400',
photos = ARRAY['https://picsum.photos/seed/jason1/400/400','https://picsum.photos/seed/jason2/400/400','https://picsum.photos/seed/jason3/400/400',NULL]
WHERE id = '22222222-0000-0000-0000-000000000001';

-- 17. Grace Liu
UPDATE public.profiles SET avatar_url = 'https://picsum.photos/seed/grace1/400/400',
photos = ARRAY['https://picsum.photos/seed/grace1/400/400','https://picsum.photos/seed/grace2/400/400','https://picsum.photos/seed/grace3/400/400','https://picsum.photos/seed/grace4/400/400']
WHERE id = '22222222-0000-0000-0000-000000000002';

-- 18. Victor Chan
UPDATE public.profiles SET avatar_url = 'https://picsum.photos/seed/victor1/400/400',
photos = ARRAY['https://picsum.photos/seed/victor1/400/400','https://picsum.photos/seed/victor2/400/400','https://picsum.photos/seed/victor3/400/400',NULL]
WHERE id = '22222222-0000-0000-0000-000000000003';

-- 19. Lily Zhao
UPDATE public.profiles SET avatar_url = 'https://picsum.photos/seed/lily1/400/400',
photos = ARRAY['https://picsum.photos/seed/lily1/400/400','https://picsum.photos/seed/lily2/400/400','https://picsum.photos/seed/lily3/400/400','https://picsum.photos/seed/lily4/400/400']
WHERE id = '22222222-0000-0000-0000-000000000004';

-- 20. Chris Ng
UPDATE public.profiles SET avatar_url = 'https://picsum.photos/seed/chris1/400/400',
photos = ARRAY['https://picsum.photos/seed/chris1/400/400','https://picsum.photos/seed/chris2/400/400','https://picsum.photos/seed/chris3/400/400',NULL]
WHERE id = '22222222-0000-0000-0000-000000000005';

-- 21. Sophie Lam
UPDATE public.profiles SET avatar_url = 'https://picsum.photos/seed/sophie1/400/400',
photos = ARRAY['https://picsum.photos/seed/sophie1/400/400','https://picsum.photos/seed/sophie2/400/400','https://picsum.photos/seed/sophie3/400/400','https://picsum.photos/seed/sophie4/400/400']
WHERE id = '22222222-0000-0000-0000-000000000006';

-- 22. Daniel Kwok
UPDATE public.profiles SET avatar_url = 'https://picsum.photos/seed/daniel1/400/400',
photos = ARRAY['https://picsum.photos/seed/daniel1/400/400','https://picsum.photos/seed/daniel2/400/400','https://picsum.photos/seed/daniel3/400/400','https://picsum.photos/seed/daniel4/400/400']
WHERE id = '22222222-0000-0000-0000-000000000007';

-- 23. Priya Sharma
UPDATE public.profiles SET avatar_url = 'https://picsum.photos/seed/priya1/400/400',
photos = ARRAY['https://picsum.photos/seed/priya1/400/400','https://picsum.photos/seed/priya2/400/400','https://picsum.photos/seed/priya3/400/400',NULL]
WHERE id = '22222222-0000-0000-0000-000000000008';

-- 24. Eric Yuen
UPDATE public.profiles SET avatar_url = 'https://picsum.photos/seed/eric1/400/400',
photos = ARRAY['https://picsum.photos/seed/eric1/400/400','https://picsum.photos/seed/eric2/400/400','https://picsum.photos/seed/eric3/400/400','https://picsum.photos/seed/eric4/400/400']
WHERE id = '22222222-0000-0000-0000-000000000009';

-- 25. Helen Tsang
UPDATE public.profiles SET avatar_url = 'https://picsum.photos/seed/helen1/400/400',
photos = ARRAY['https://picsum.photos/seed/helen1/400/400','https://picsum.photos/seed/helen2/400/400','https://picsum.photos/seed/helen3/400/400',NULL]
WHERE id = '22222222-0000-0000-0000-000000000010';

-- 26. Marcus Wong
UPDATE public.profiles SET avatar_url = 'https://picsum.photos/seed/marcus1/400/400',
photos = ARRAY['https://picsum.photos/seed/marcus1/400/400','https://picsum.photos/seed/marcus2/400/400','https://picsum.photos/seed/marcus3/400/400','https://picsum.photos/seed/marcus4/400/400']
WHERE id = '22222222-0000-0000-0000-000000000011';

-- 27. Tina Ho
UPDATE public.profiles SET avatar_url = 'https://picsum.photos/seed/tina1/400/400',
photos = ARRAY['https://picsum.photos/seed/tina1/400/400','https://picsum.photos/seed/tina2/400/400','https://picsum.photos/seed/tina3/400/400',NULL]
WHERE id = '22222222-0000-0000-0000-000000000012';

-- Verify
SELECT name, avatar_url IS NOT NULL as has_avatar, array_length(photos, 1) as photo_count
FROM public.profiles
WHERE id LIKE '11111111%' OR id LIKE '22222222%'
ORDER BY name;
