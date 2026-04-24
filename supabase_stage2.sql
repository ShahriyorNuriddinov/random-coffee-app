-- ─── STAGE 2: Likes, Matches, Moments ───────────────────────────────────────

-- 1. Update profiles table: add tags, looking_for, status
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS looking_for TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- 2. Likes table
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

-- 3. Matches table
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- 4. Moments (posts) table
CREATE TABLE IF NOT EXISTS moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  image_url TEXT,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Moment likes table
CREATE TABLE IF NOT EXISTS moment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  moment_id UUID NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, moment_id)
);

-- 6. RLS Policies
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE moment_likes ENABLE ROW LEVEL SECURITY;

-- Likes: users can insert their own likes, read all
CREATE POLICY "likes_insert" ON likes FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "likes_select" ON likes FOR SELECT USING (true);

-- Matches: users can read their own matches
CREATE POLICY "matches_select" ON matches FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "matches_insert" ON matches FOR INSERT WITH CHECK (true);

-- Moments: anyone can read, only owner can insert/delete
CREATE POLICY "moments_select" ON moments FOR SELECT USING (true);
CREATE POLICY "moments_insert" ON moments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "moments_delete" ON moments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "moments_update" ON moments FOR UPDATE USING (true);

-- Moment likes
CREATE POLICY "moment_likes_select" ON moment_likes FOR SELECT USING (true);
CREATE POLICY "moment_likes_insert" ON moment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "moment_likes_delete" ON moment_likes FOR DELETE USING (auth.uid() = user_id);

-- 7. Function: create match when mutual like exists
CREATE OR REPLACE FUNCTION check_and_create_match()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if reverse like exists
  IF EXISTS (
    SELECT 1 FROM likes
    WHERE from_user_id = NEW.to_user_id AND to_user_id = NEW.from_user_id
  ) THEN
    -- Insert match (ordered IDs to avoid duplicates)
    INSERT INTO matches (user1_id, user2_id)
    VALUES (
      LEAST(NEW.from_user_id, NEW.to_user_id),
      GREATEST(NEW.from_user_id, NEW.to_user_id)
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_like_insert
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION check_and_create_match();
