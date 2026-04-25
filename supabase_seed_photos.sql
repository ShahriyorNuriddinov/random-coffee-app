-- ═══════════════════════════════════════════════════════════════════════════
-- SEED: Add photos to existing test profiles
-- Run in Supabase SQL Editor
-- Uses picsum.photos for random real photos
-- ═══════════════════════════════════════════════════════════════════════════

-- Alex Chen (11111111-...01) — 4 photos
UPDATE public.profiles SET
    avatar_url = 'https://picsum.photos/seed/alex1/400/400',
    photos = ARRAY[
        'https://picsum.photos/seed/alex1/400/400',
        'https://picsum.photos/seed/alex2/400/400',
        'https://picsum.photos/seed/alex3/400/400',
        'https://picsum.photos/seed/alex4/400/400'
    ]
WHERE id = '11111111-0000-0000-0000-000000000001';

-- Mia Wong (11111111-...02) — 3 photos
UPDATE public.profiles SET
    avatar_url = 'https://picsum.photos/seed/mia1/400/400',
    photos = ARRAY[
        'https://picsum.photos/seed/mia1/400/400',
        'https://picsum.photos/seed/mia2/400/400',
        'https://picsum.photos/seed/mia3/400/400',
        NULL
    ]
WHERE id = '11111111-0000-0000-0000-000000000002';

-- David Li (11111111-...03) — 4 photos
UPDATE public.profiles SET
    avatar_url = 'https://picsum.photos/seed/david1/400/400',
    photos = ARRAY[
        'https://picsum.photos/seed/david1/400/400',
        'https://picsum.photos/seed/david2/400/400',
        'https://picsum.photos/seed/david3/400/400',
        'https://picsum.photos/seed/david4/400/400'
    ]
WHERE id = '11111111-0000-0000-0000-000000000003';

-- Sarah Kim (11111111-...04) — 2 photos
UPDATE public.profiles SET
    avatar_url = 'https://picsum.photos/seed/sarah1/400/400',
    photos = ARRAY[
        'https://picsum.photos/seed/sarah1/400/400',
        'https://picsum.photos/seed/sarah2/400/400',
        NULL,
        NULL
    ]
WHERE id = '11111111-0000-0000-0000-000000000004';

-- James Ho (11111111-...07) — 4 photos
UPDATE public.profiles SET
    avatar_url = 'https://picsum.photos/seed/james1/400/400',
    photos = ARRAY[
        'https://picsum.photos/seed/james1/400/400',
        'https://picsum.photos/seed/james2/400/400',
        'https://picsum.photos/seed/james3/400/400',
        'https://picsum.photos/seed/james4/400/400'
    ]
WHERE id = '11111111-0000-0000-0000-000000000007';

-- Lisa Chan (11111111-...08) — 3 photos
UPDATE public.profiles SET
    avatar_url = 'https://picsum.photos/seed/lisa1/400/400',
    photos = ARRAY[
        'https://picsum.photos/seed/lisa1/400/400',
        'https://picsum.photos/seed/lisa2/400/400',
        'https://picsum.photos/seed/lisa3/400/400',
        NULL
    ]
WHERE id = '11111111-0000-0000-0000-000000000008';

-- Daniel Kwok (22222222-...07) — 4 photos
UPDATE public.profiles SET
    avatar_url = 'https://picsum.photos/seed/daniel1/400/400',
    photos = ARRAY[
        'https://picsum.photos/seed/daniel1/400/400',
        'https://picsum.photos/seed/daniel2/400/400',
        'https://picsum.photos/seed/daniel3/400/400',
        'https://picsum.photos/seed/daniel4/400/400'
    ]
WHERE id = '22222222-0000-0000-0000-000000000007';

-- Sophie Lam (22222222-...06) — 3 photos
UPDATE public.profiles SET
    avatar_url = 'https://picsum.photos/seed/sophie1/400/400',
    photos = ARRAY[
        'https://picsum.photos/seed/sophie1/400/400',
        'https://picsum.photos/seed/sophie2/400/400',
        'https://picsum.photos/seed/sophie3/400/400',
        NULL
    ]
WHERE id = '22222222-0000-0000-0000-000000000006';

-- Grace Liu (22222222-...02) — 4 photos
UPDATE public.profiles SET
    avatar_url = 'https://picsum.photos/seed/grace1/400/400',
    photos = ARRAY[
        'https://picsum.photos/seed/grace1/400/400',
        'https://picsum.photos/seed/grace2/400/400',
        'https://picsum.photos/seed/grace3/400/400',
        'https://picsum.photos/seed/grace4/400/400'
    ]
WHERE id = '22222222-0000-0000-0000-000000000002';

-- Verify
SELECT id, name, avatar_url, array_length(photos, 1) as photo_count
FROM public.profiles
WHERE photos IS NOT NULL
ORDER BY name;
