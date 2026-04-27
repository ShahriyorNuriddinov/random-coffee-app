-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- Run this AFTER 002_performance_indexes.sql
-- ============================================================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE moment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own matches" ON matches;
DROP POLICY IF EXISTS "Users can update own matches" ON matches;
DROP POLICY IF EXISTS "Users can view own likes" ON likes;
DROP POLICY IF EXISTS "Users can insert own likes" ON likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON likes;
DROP POLICY IF EXISTS "Approved moments are viewable by everyone" ON moments;
DROP POLICY IF EXISTS "Users can insert own moments" ON moments;
DROP POLICY IF EXISTS "Users can update own moments" ON moments;
DROP POLICY IF EXISTS "Users can delete own moments" ON moments;
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Admin can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON profiles;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" 
    ON profiles FOR SELECT 
    USING (deleted_at IS NULL AND banned = false);

CREATE POLICY "Users can update own profile" 
    ON profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Matches policies
CREATE POLICY "Users can view own matches" 
    ON matches FOR SELECT 
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update own matches" 
    ON matches FOR UPDATE 
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Likes policies
CREATE POLICY "Users can view own likes" 
    ON likes FOR SELECT 
    USING (auth.uid() = from_user_id);

CREATE POLICY "Users can insert own likes" 
    ON likes FOR INSERT 
    WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can delete own likes" 
    ON likes FOR DELETE 
    USING (auth.uid() = from_user_id);

-- Moments policies
CREATE POLICY "Approved moments are viewable by everyone" 
    ON moments FOR SELECT 
    USING (status = 'approved' OR auth.uid() = user_id);

CREATE POLICY "Users can insert own moments" 
    ON moments FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own moments" 
    ON moments FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own moments" 
    ON moments FOR DELETE 
    USING (auth.uid() = user_id);

-- Payments policies
CREATE POLICY "Users can view own payments" 
    ON payments FOR SELECT 
    USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admin can read all profiles" 
    ON profiles FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM staff 
            WHERE staff.email = (SELECT email FROM auth.users WHERE id = auth.uid())
            AND staff.role = 'admin'
        )
    );

CREATE POLICY "Admin can update all profiles" 
    ON profiles FOR UPDATE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM staff 
            WHERE staff.email = (SELECT email FROM auth.users WHERE id = auth.uid())
            AND staff.role = 'admin'
        )
    );
