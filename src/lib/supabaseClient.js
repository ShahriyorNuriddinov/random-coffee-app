import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
    }
})

// ─── EMAIL AUTH (Supabase Auth OTP) ──────────────────────────────────────────
export const sendOtp = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true, emailRedirectTo: undefined },
    })
    if (error) return { success: false, error: error.message }
    return { success: true }
}

export const verifyOtp = async (email, token) => {
    try {
        const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 10000))
        const { data, error } = await Promise.race([
            supabase.auth.verifyOtp({ email, token, type: 'email' }),
            timeout
        ])
        if (error) return { success: false, error: error.message }
        return { success: true, user: { id: data.user?.id, email: data.user?.email } }
    } catch (e) {
        return { success: false, error: e.message }
    }
}

export const signOut = async () => { await supabase.auth.signOut() }

// ─── PROFILES ─────────────────────────────────────────────────────────────────

export const saveProfile = async (userId, profileData) => {
    if (!profileData.referral_code) {
        const code = userId.replace(/-/g, '').slice(0, 8).toUpperCase()
        profileData = { ...profileData, referral_code: code }
    }
    const { error } = await supabase
        .from('profiles')
        .upsert({ id: userId, ...profileData, updated_at: new Date().toISOString() })
    if (error) return { success: false, error: error.message }
    return { success: true }
}

export const getProfile = async (userId) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (error) return null
    return data // null if not found, object if found
}

// ─── AVATAR UPLOAD ────────────────────────────────────────────────────────────

export const uploadAvatar = async (userId, file) => {
    const ext = file.name.split('.').pop()
    const path = `avatars/${userId}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (error) {
        console.error('[uploadAvatar] Storage upload failed:', error.message)
        return null
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return data.publicUrl
}

// ─── MULTI-PHOTO UPLOAD ───────────────────────────────────────────────────────

export const uploadPhoto = async (userId, file, index) => {
    const ext = file.name.split('.').pop()
    const path = `photos/${userId}/photo_${index}.${ext}`
    const { error } = await supabase.storage.from('photos').upload(path, file, { upsert: true })
    if (error) {
        console.error('[uploadPhoto] Storage upload failed:', error.message)
        return null
    }
    const { data } = supabase.storage.from('photos').getPublicUrl(path)
    return data.publicUrl
}

export const savePhotos = async (userId, photoUrls) => {
    const cleanUrls = (photoUrls || []).map(u => u || null)
    const { error } = await supabase
        .from('profiles')
        .update({ photos: cleanUrls, updated_at: new Date().toISOString() })
        .eq('id', userId)
    if (error) {
        console.error('[savePhotos] error:', error.message)
        return { success: false, error: error.message }
    }
    return { success: true }
}

// ─── SUBSCRIPTION ─────────────────────────────────────────────────────────────

export const getSubscription = async (userId) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('subscription_status, coffee_credits, subscription_start, subscription_end')
        .eq('id', userId).single()
    if (error) return null
    return data
}

export const updateSubscription = async (userId, { status, credits, start, end }) => {
    const { error } = await supabase
        .from('profiles')
        .update({ subscription_status: status, coffee_credits: credits, subscription_start: start, subscription_end: end, updated_at: new Date().toISOString() })
        .eq('id', userId)
    if (error) return { success: false, error: error.message }
    return { success: true }
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export const updateNotifications = async (userId, { notifNewMatches, notifImportantNews }) => {
    const { error } = await supabase
        .from('profiles')
        .update({ notif_new_matches: notifNewMatches, notif_important_news: notifImportantNews, updated_at: new Date().toISOString() })
        .eq('id', userId)
    if (error) return { success: false, error: error.message }
    return { success: true }
}

// ─── REFERRAL ─────────────────────────────────────────────────────────────────

export const getReferralCode = async (userId) => {
    const { data, error } = await supabase.from('profiles').select('referral_code, referral_count').eq('id', userId).single()
    if (error) return null
    return data
}

export const applyReferralCode = async (referralCode, newUserId) => {
    const { data: referrer, error } = await supabase.from('profiles').select('id').eq('referral_code', referralCode.toUpperCase()).single()
    if (error || !referrer) return { success: false, error: 'Invalid referral code' }
    if (referrer.id === newUserId) return { success: false, error: 'Cannot refer yourself' }
    const { error: refError } = await supabase.from('referrals').insert({ referrer_id: referrer.id, referred_id: newUserId })
    if (refError) return { success: false, error: refError.message }
    await supabase.from('profiles').update({ referred_by: referrer.id }).eq('id', newUserId)

    // Give referral reward to referrer from app_settings — use atomic increment to avoid race condition
    const { data: cfg } = await supabase.from('app_settings').select('reward_referral').eq('id', 1).single()
    const reward = Number(cfg?.reward_referral ?? 1)
    if (reward > 0) {
        // Atomic increment prevents read-modify-write race condition
        await supabase.rpc('increment_credits', { p_user_id: referrer.id, p_credits: reward })
    }
    return { success: true }
}

// ─── PAYMENTS (Airwallex) ─────────────────────────────────────────────────────

export const createPaymentIntent = async (_params) => {
    // MOCK for MVP demo — replace with real Edge Function call when Airwallex is ready
    return {
        success: true,
        mock: true,
        paymentIntentId: `mock_pi_${Date.now()}`,
        clientSecret: 'mock_secret',
    }
}
export const confirmPayment = async ({ userId, paymentIntentId, credits, amount, method }) => {
    try {
        // Use atomic RPC function to prevent race conditions
        const { data, error } = await supabase.rpc('confirm_payment_atomic', {
            p_user_id: userId,
            p_payment_intent_id: paymentIntentId,
            p_credits: credits,
            p_amount: amount,
            p_method: method
        })

        // Handle duplicate payment (unique constraint violation)
        if (error?.code === '23505') {
            console.log('[confirmPayment] Payment already processed:', paymentIntentId)
            const { data: profile } = await supabase
                .from('profiles')
                .select('coffee_credits')
                .eq('id', userId)
                .single()
            return { success: true, newCredits: profile?.coffee_credits || 0, duplicate: true }
        }

        if (error) {
            console.error('[confirmPayment] RPC error:', error)
            return { success: false, error: error.message }
        }

        // Credit referral bonus if applicable (non-blocking)
        supabase.rpc('credit_referral_bonus', { p_referred_id: userId }).catch(err => {
            console.warn('[confirmPayment] Referral bonus failed:', err)
        })

        return { success: true, newCredits: data }
    } catch (err) {
        console.error('[confirmPayment] Unexpected error:', err)
        return { success: false, error: err.message }
    }
}

// ─── EMAIL VERIFICATION ───────────────────────────────────────────────────────

export const updateEmail = async (userId, email) => {
    const { error } = await supabase.from('profiles').update({ email, email_verified: false, updated_at: new Date().toISOString() }).eq('id', userId)
    if (error) return { success: false, error: error.message }
    return { success: true }
}

// ─── BOOST ────────────────────────────────────────────────────────────────────

export const toggleBoost = async (userId, active) => {
    if (active) {
        const { data: profile } = await supabase.from('profiles').select('coffee_credits').eq('id', userId).single()
        if (!profile || profile.coffee_credits < 1) return { success: false, error: 'Not enough credits for boost' }
    }
    const { error } = await supabase.from('profiles').update({ boost_active: active, updated_at: new Date().toISOString() }).eq('id', userId)
    if (error) return { success: false, error: error.message }
    return { success: true }
}

// ─── PEOPLE / LIKES / MATCHES ─────────────────────────────────────────────────

export const getPeople = async (currentUserId, limit = 100) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, name, dob, gender, region, city, avatar_url, photos, about, gives, wants, about_zh, gives_zh, wants_zh, about_ru, gives_ru, wants_ru, tags, languages, balance')
        .neq('id', currentUserId)
        .not('name', 'is', null)
        .neq('banned', true)
        .neq('name', '')
        .limit(limit)
    if (error) {
        console.error('[getPeople]', error.message)
        return []
    }
    return data || []
}

export const likeUser = async (fromUserId, toUserId) => {
    const { error } = await supabase.from('likes').insert({ from_user_id: fromUserId, to_user_id: toUserId })
    if (error && error.code !== '23505') return { success: false, error: error.message }
    supabase.functions.invoke('send-notification', { body: { type: 'interest', from_user_id: fromUserId, to_user_id: toUserId } }).catch(() => { })
    return { success: true }
}

export const unlikeUser = async (fromUserId, toUserId) => {
    const { error } = await supabase.from('likes').delete().eq('from_user_id', fromUserId).eq('to_user_id', toUserId)
    if (error) return { success: false, error: error.message }
    return { success: true }
}

export const checkMatchExists = async (userId1, userId2) => {
    // Check if the other person also liked us
    const { data: mutualLike } = await supabase
        .from('likes')
        .select('id')
        .eq('from_user_id', userId2)
        .eq('to_user_id', userId1)
        .maybeSingle()

    if (mutualLike) {
        // Create match if not exists
        const u1 = userId1 < userId2 ? userId1 : userId2
        const u2 = userId1 < userId2 ? userId2 : userId1
        const { data: existing } = await supabase.from('matches').select('id').eq('user1_id', u1).eq('user2_id', u2).maybeSingle()
        if (!existing) {
            await supabase.from('matches').insert({ user1_id: u1, user2_id: u2 })
            supabase.functions.invoke('send-notification', { body: { type: 'match', from_user_id: userId1, to_user_id: userId2 } }).catch(() => { })
        }
        return true
    }

    // Also check matches table (from boost)
    const u1 = userId1 < userId2 ? userId1 : userId2
    const u2 = userId1 < userId2 ? userId2 : userId1
    const { data } = await supabase.from('matches').select('id').eq('user1_id', u1).eq('user2_id', u2).maybeSingle()
    return !!data
}

export const getLikedUserIds = async (userId) => {
    const { data, error } = await supabase.from('likes').select('to_user_id').eq('from_user_id', userId)
    if (error) return []
    return (data || []).map(r => r.to_user_id)
}

export const getBlockedUserIds = async (_userId) => {
    // _userId kept for API compatibility but RLS enforces auth.uid() server-side
    try {
        const { data, error } = await supabase
            .from('blocked_users')
            .select('blocked_id')
        // RLS policy: blocker_id = auth.uid() — no extra auth call needed

        if (error) {
            console.error('[getBlockedUserIds] error:', error)
            return []
        }
        return (data || []).map(r => r.blocked_id)
    } catch (err) {
        console.error('[getBlockedUserIds] error:', err)
        return []
    }
}

export const getMatches = async (userId) => {
    const { data, error } = await supabase
        .from('matches')
        .select(`id, created_at, user1:user1_id(id, name, avatar_url, about, region, wechat, whatsapp), user2:user2_id(id, name, avatar_url, about, region, wechat, whatsapp)`)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('created_at', { ascending: false })
    if (error) return []
    return (data || []).map(m => {
        const partner = m.user1?.id === userId ? m.user2 : m.user1
        return { matchId: m.id, createdAt: m.created_at, partner }
    })
}

export const saveTags = async (userId, tags) => {
    const { error } = await supabase.from('profiles').update({ tags, updated_at: new Date().toISOString() }).eq('id', userId)
    return !error
}

// ─── MOMENTS ──────────────────────────────────────────────────────────────────

export const getMoments = async (limit = 20, userId = null, offset = 0) => {
    // Fetch approved posts + current user's own pending posts
    let query = supabase
        .from('moments')
        .select(`id, text, text_en, text_zh, text_ru, image_url, image_urls, likes_count, created_at, status, is_admin_post, author:user_id(id, name, avatar_url, region)`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (userId) {
        query = query.or(`status.eq.approved,user_id.eq.${userId}`)
    } else {
        query = query.eq('status', 'approved')
    }

    const { data, error } = await query
    if (error) {
        console.error('[getMoments] error:', error.message)
        return []
    }

    const moments = data || []
    if (moments.length === 0) return moments

    // reactions aggregation removed — use likes_count column for display counts.
    // Per-user reactions are fetched separately in MomentsScreen to avoid
    // fetching potentially thousands of rows for popular posts.
    for (const m of moments) {
        m.reactions = {}
    }
    return moments
}

export const postMoment = async (userId, text, imageUrl = null, text_en = null, text_zh = null, imageUrls = null, text_ru = null) => {
    // Sanitize text input to prevent XSS
    const sanitizeText = (str) => {
        if (!str) return str
        return str
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;')
            .trim()
    }

    const { data, error } = await supabase
        .from('moments')
        .insert({
            user_id: userId,
            text: sanitizeText(text),
            image_url: imageUrl,
            image_urls: imageUrls,
            text_en: sanitizeText(text_en),
            text_zh: sanitizeText(text_zh),
            text_ru: sanitizeText(text_ru),
            status: 'pending'
        })
        .select(`id, text, text_en, text_zh, text_ru, image_url, image_urls, likes_count, created_at, status, author:user_id(id, name, avatar_url, region)`)
        .single()
    if (error) return null
    return data
}

export const toggleMomentLike = async (userId, momentId, currentlyLiked) => {
    if (currentlyLiked) {
        const { error } = await supabase.from('moment_likes').delete().eq('user_id', userId).eq('moment_id', momentId).eq('emoji', '❤️')
        if (error) return { success: false, error: error.message }
    } else {
        const { error } = await supabase.from('moment_likes').insert({ user_id: userId, moment_id: momentId, emoji: '❤️' })
        if (error && error.code !== '23505') return { success: false, error: error.message }
    }
    return { success: true }
}

export const getUserMomentReaction = async (userId, momentId) => {
    const { data } = await supabase.from('moment_likes').select('emoji').eq('user_id', userId).eq('moment_id', momentId).maybeSingle()
    return data?.emoji || null
}

export const getUserMomentReactions = async (userId, momentIds) => {
    if (!momentIds.length) return {}
    const { data } = await supabase
        .from('moment_likes')
        .select('moment_id, emoji')
        .eq('user_id', userId)
        .in('moment_id', momentIds)
    const map = {}
    if (data) data.forEach(r => { map[r.moment_id] = r.emoji })
    return map
}

export const getLikedMomentIds = async (userId) => {
    const { data } = await supabase.from('moment_likes').select('moment_id').eq('user_id', userId)
    return (data || []).map(r => r.moment_id)
}

export const uploadMomentImage = async (userId, file) => {
    const ext = file.name.split('.').pop()
    const path = `moments/${userId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('moments').upload(path, file, { upsert: false })
    if (error) {
        console.error('[uploadMomentImage] Storage upload failed:', error.message)
        return null
    }
    const { data } = supabase.storage.from('moments').getPublicUrl(path)
    return data.publicUrl
}

export const getMeetingHistory = async (userId) => {
    const { data, error } = await supabase
        .from('matches')
        .select(`id, created_at, status, moment_posted, user1:user1_id(id, name, avatar_url, about, gives, wants, about_zh, gives_zh, wants_zh, about_ru, gives_ru, wants_ru, balance, languages, region, wechat, whatsapp), user2:user2_id(id, name, avatar_url, about, gives, wants, about_zh, gives_zh, wants_zh, about_ru, gives_ru, wants_ru, balance, languages, region, wechat, whatsapp)`)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('created_at', { ascending: false })
    if (error) return []
    return (data || []).map(m => {
        const partner = m.user1?.id === userId ? m.user2 : m.user1
        return { matchId: m.id, createdAt: m.created_at, status: m.status || 'active', momentPosted: m.moment_posted || false, partner }
    }).filter(m => m.partner && m.partner.id && m.partner.id !== userId)
}

export const completeMeeting = async (matchId) => {
    const { error } = await supabase
        .from('matches')
        .update({ status: 'completed' })
        .eq('id', matchId)
    if (error) {
        console.error('[completeMeeting] error:', error.message)
        return { success: false, error: error.message }
    }
    return { success: true }
}

export const markMomentPosted = async (matchId) => {
    const { error } = await supabase
        .from('matches')
        .update({ moment_posted: true })
        .eq('id', matchId)
    if (error) {
        console.error('[markMomentPosted] error:', error.message)
        return { success: false, error: error.message }
    }
    return { success: true }
}

export const cancelMeeting = async (matchId) => {
    const { error } = await supabase
        .from('matches')
        .update({ status: 'cancelled' })
        .eq('id', matchId)
    if (error) {
        console.error('[cancelMeeting] error:', error.message)
        return { success: false, error: error.message }
    }
    return { success: true }
}

// ─── BLOCK / REPORT USER ─────────────────────────────────────────────────────
// Note: _blockerId / _reporterId params kept for API compatibility but are unused —
// RLS enforces auth.uid() server-side, so the caller cannot spoof the actor.
export const blockUser = async (_blockerId, blockedId) => {
    try {
        const { error } = await supabase.from('blocked_users').insert({
            blocker_id: (await supabase.auth.getUser()).data.user?.id,
            blocked_id: blockedId,
        })

        if (error) {
            if (error.code === '23505') return { success: false, error: 'unique_block' }
            return { success: false, error: error.message }
        }
        return { success: true }
    } catch (err) {
        return { success: false, error: err.message }
    }
}

export const reportUser = async (_reporterId, reportedId, reason = '') => {
    try {
        const { error } = await supabase.from('reports').insert({
            reporter_id: (await supabase.auth.getUser()).data.user?.id,
            reported_id: reportedId,
            reason,
            created_at: new Date().toISOString(),
        })

        if (error) {
            if (error.code === '23505') return { success: false, error: 'unique_report' }
            return { success: false, error: error.message }
        }
        return { success: true }
    } catch (err) {
        return { success: false, error: err.message }
    }
}

// ─── DELETE ACCOUNT ───────────────────────────────────────────────────────────
export const deleteAccount = async (_userId) => {
    // _userId kept for API compatibility; auth.uid() is used server-side via RLS
    // Soft delete — mark as deleted, anonymize data
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }
    const { error } = await supabase.from('profiles').update({
        name: 'Deleted User',
        about: '',
        gives: '',
        wants: '',
        avatar_url: null,
        photos: [],
        email: null,
        wechat: null,
        whatsapp: null,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    }).eq('id', user.id)
    if (error) return { success: false, error: error.message }
    await supabase.auth.signOut()
    return { success: true }
}
