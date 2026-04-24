import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// ─── EMAIL AUTH (Supabase Auth OTP) ──────────────────────────────────────────
export const sendOtp = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            shouldCreateUser: true,
            emailRedirectTo: undefined,
        },
    })
    if (error) return { success: false, error: error.message }
    return { success: true }
}

export const verifyOtp = async (email, token) => {
    const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
    })
    if (error) return { success: false, error: error.message }
    return {
        success: true,
        user: { id: data.user?.id, email: data.user?.email },
    }
}

export const signOut = async () => {
    await supabase.auth.signOut()
}

// ─── PROFILES ─────────────────────────────────────────────────────────────────

export const saveProfile = async (userId, profileData) => {
    // Auto-generate referral code if not set
    if (!profileData.referral_code) {
        const code = userId.replace(/-/g, '').slice(0, 8).toUpperCase()
        profileData = { ...profileData, referral_code: code }
    }
    const { error } = await supabase
        .from('profiles')
        .upsert({ id: userId, ...profileData, updated_at: new Date().toISOString() })
    if (error) {
        console.error('[Supabase] saveProfile error:', error.message, error.details, error.hint)
        return { success: false, error: error.message }
    }
    return { success: true }
}

export const getProfile = async (userId) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
    if (error) return null
    return data
}

// ─── AVATAR UPLOAD ────────────────────────────────────────────────────────────

export const uploadAvatar = async (userId, file) => {
    const ext = file.name.split('.').pop()
    const path = `avatars/${userId}.${ext}`
    const { error } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })
    if (error) {
        console.error('[Supabase] uploadAvatar:', error.message)
        // Fallback: convert to base64 data URL so it persists across sessions
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target.result)
            reader.onerror = () => resolve(null)
            reader.readAsDataURL(file)
        })
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return data.publicUrl
}

// ─── MULTI-PHOTO UPLOAD ───────────────────────────────────────────────────────

export const uploadPhoto = async (userId, file, index) => {
    const ext = file.name.split('.').pop()
    const path = `photos/${userId}/photo_${index}.${ext}`
    const { error } = await supabase.storage
        .from('photos')
        .upload(path, file, { upsert: true })
    if (error) {
        console.error('[Supabase] uploadPhoto:', error.message)
        // Fallback: base64 data URL
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target.result)
            reader.onerror = () => resolve(null)
            reader.readAsDataURL(file)
        })
    }
    const { data } = supabase.storage.from('photos').getPublicUrl(path)
    return data.publicUrl
}

export const savePhotos = async (userId, photoUrls) => {
    const { error } = await supabase
        .from('profiles')
        .update({ photos: photoUrls, updated_at: new Date().toISOString() })
        .eq('id', userId)
    if (error) {
        console.error('[Supabase] savePhotos:', error.message)
        return { success: false, error: error.message }
    }
    return { success: true }
}

// ─── SUBSCRIPTION ─────────────────────────────────────────────────────────────

export const getSubscription = async (userId) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('subscription_status, coffee_credits, subscription_start, subscription_end')
        .eq('id', userId)
        .single()
    if (error) return null
    return data
}

export const updateSubscription = async (userId, { status, credits, start, end }) => {
    const { error } = await supabase
        .from('profiles')
        .update({
            subscription_status: status,
            coffee_credits: credits,
            subscription_start: start,
            subscription_end: end,
            updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
    if (error) {
        console.error('[Supabase] updateSubscription:', error.message)
        return { success: false, error: error.message }
    }
    return { success: true }
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export const updateNotifications = async (userId, { notifNewMatches, notifImportantNews }) => {
    const { error } = await supabase
        .from('profiles')
        .update({
            notif_new_matches: notifNewMatches,
            notif_important_news: notifImportantNews,
            updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
    if (error) {
        console.error('[Supabase] updateNotifications:', error.message)
        return { success: false, error: error.message }
    }
    return { success: true }
}

// ─── REFERRAL ─────────────────────────────────────────────────────────────────

export const getReferralCode = async (userId) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('referral_code, referral_count')
        .eq('id', userId)
        .single()
    if (error) return null
    return data
}

export const applyReferralCode = async (referralCode, newUserId) => {
    // Find referrer by code
    const { data: referrer, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', referralCode.toUpperCase())
        .single()
    if (error || !referrer) return { success: false, error: 'Invalid referral code' }
    if (referrer.id === newUserId) return { success: false, error: 'Cannot refer yourself' }

    // Insert referral record
    const { error: refError } = await supabase
        .from('referrals')
        .insert({ referrer_id: referrer.id, referred_id: newUserId })
    if (refError) return { success: false, error: refError.message }

    // Update referred_by on new user
    await supabase
        .from('profiles')
        .update({ referred_by: referrer.id })
        .eq('id', newUserId)

    return { success: true }
}

// ─── PAYMENTS (Airwallex) ─────────────────────────────────────────────────────
// Airwallex integration via Supabase Edge Function
// Deploy: supabase/functions/create-payment-intent/index.ts

export const createPaymentIntent = async ({ userId, amount, currency = 'HKD', credits, method }) => {
    // In production: call your Edge Function which calls Airwallex API
    // const { data, error } = await supabase.functions.invoke('create-payment-intent', {
    //   body: { userId, amount, currency, credits, method }
    // })

    // MOCK for MVP demo
    console.log(`[MOCK PAYMENT] Creating intent: ${amount} ${currency} for ${credits} credits via ${method}`)
    return {
        success: true,
        paymentIntentId: `mock_pi_${Date.now()}`,
        clientSecret: 'mock_secret',
    }
}

export const confirmPayment = async ({ userId, paymentIntentId, credits, amount, method }) => {
    // MOCK: record payment and update credits
    const { error: payError } = await supabase
        .from('payments')
        .insert({
            user_id: userId,
            amount,
            currency: 'HKD',
            credits,
            payment_method: method,
            provider: 'airwallex',
            provider_ref: paymentIntentId,
            status: 'success',
        })
    if (payError) console.error('[Supabase] confirmPayment insert:', payError.message)

    // Add credits to user
    const { data: profile } = await supabase
        .from('profiles')
        .select('coffee_credits')
        .eq('id', userId)
        .single()

    const newCredits = (profile?.coffee_credits || 0) + credits
    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            coffee_credits: newCredits,
            subscription_status: 'active',
            subscription_start: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

    if (updateError) {
        console.error('[Supabase] confirmPayment update:', updateError.message)
        return { success: false, error: updateError.message }
    }

    // Credit referral bonus if applicable
    await supabase.rpc('credit_referral_bonus', { p_referred_id: userId })

    return { success: true, newCredits }
}

// ─── EMAIL VERIFICATION ───────────────────────────────────────────────────────

export const updateEmail = async (userId, email) => {
    const { error } = await supabase
        .from('profiles')
        .update({ email, email_verified: false, updated_at: new Date().toISOString() })
        .eq('id', userId)
    if (error) return { success: false, error: error.message }
    // In production: trigger email verification via Supabase Auth or Edge Function
    return { success: true }
}

// ─── BOOST ────────────────────────────────────────────────────────────────────

export const toggleBoost = async (userId, active) => {
    // Boost costs 1 extra credit
    if (active) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('coffee_credits')
            .eq('id', userId)
            .single()
        if (!profile || profile.coffee_credits < 1) {
            return { success: false, error: 'Not enough credits for boost' }
        }
    }
    const { error } = await supabase
        .from('profiles')
        .update({ boost_active: active, updated_at: new Date().toISOString() })
        .eq('id', userId)
    if (error) return { success: false, error: error.message }
    return { success: true }
}

// ─── STAGE 2: PEOPLE / LIKES / MATCHES ───────────────────────────────────────

/** Fetch all profiles except current user (for People feed) */
export const getPeople = async (currentUserId) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, name, dob, gender, region, city, avatar_url, about, gives, wants, tags, languages, balance')
        .neq('id', currentUserId)
        .not('name', 'is', null)
        .not('about', 'is', null)
        // show active profiles OR profiles where status not yet set (legacy)
        .or('status.eq.active,status.is.null')
    if (error) { console.error('[getPeople]', error.message); return [] }
    return data || []
}

/** Like a user + send interest notification */
export const likeUser = async (fromUserId, toUserId) => {
    const { error } = await supabase
        .from('likes')
        .insert({ from_user_id: fromUserId, to_user_id: toUserId })
    if (error && error.code !== '23505') {
        console.error('[likeUser]', error.message)
        return { success: false, error: error.message }
    }

    // Send interest notification (fire and forget)
    supabase.functions.invoke('send-notification', {
        body: { type: 'interest', from_user_id: fromUserId, to_user_id: toUserId }
    }).catch(e => console.warn('[notify interest]', e))

    return { success: true }
}

/** Unlike / cancel interest */
export const unlikeUser = async (fromUserId, toUserId) => {
    const { error } = await supabase
        .from('likes')
        .delete()
        .eq('from_user_id', fromUserId)
        .eq('to_user_id', toUserId)
    if (error) {
        console.error('[unlikeUser]', error.message)
        return { success: false, error: error.message }
    }
    return { success: true }
}

/** Check match by querying both orderings + send match notification */
export const checkMatchExists = async (userId1, userId2) => {
    const u1 = userId1 < userId2 ? userId1 : userId2
    const u2 = userId1 < userId2 ? userId2 : userId1
    const { data } = await supabase
        .from('matches')
        .select('id')
        .eq('user1_id', u1)
        .eq('user2_id', u2)
        .maybeSingle()

    if (data) {
        // Send match notification to both (fire and forget)
        supabase.functions.invoke('send-notification', {
            body: { type: 'match', from_user_id: userId1, to_user_id: userId2 }
        }).catch(e => console.warn('[notify match]', e))
    }

    return !!data
}

/** Get IDs of users the current user already liked */
export const getLikedUserIds = async (userId) => {
    const { data, error } = await supabase
        .from('likes')
        .select('to_user_id')
        .eq('from_user_id', userId)
    if (error) return []
    return (data || []).map(r => r.to_user_id)
}

/** Get all matches for current user with profile data */
export const getMatches = async (userId) => {
    const { data, error } = await supabase
        .from('matches')
        .select(`
            id, created_at,
            user1:user1_id(id, name, avatar_url, about, region, wechat, whatsapp),
            user2:user2_id(id, name, avatar_url, about, region, wechat, whatsapp)
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('created_at', { ascending: false })
    if (error) { console.error('[getMatches]', error.message); return [] }
    return (data || []).map(m => {
        const partner = m.user1?.id === userId ? m.user2 : m.user1
        return { matchId: m.id, createdAt: m.created_at, partner }
    })
}

/** Save AI-extracted tags to profile */
export const saveTags = async (userId, tags) => {
    const { error } = await supabase
        .from('profiles')
        .update({ tags, updated_at: new Date().toISOString() })
        .eq('id', userId)
    if (error) console.error('[saveTags]', error.message)
    return !error
}

// ─── STAGE 2: MOMENTS ────────────────────────────────────────────────────────

/** Get moments feed with all emoji reaction counts */
export const getMoments = async (limit = 30) => {
    const { data, error } = await supabase
        .from('moments')
        .select(`
            id, text, image_url, likes_count, created_at,
            author:user_id(id, name, avatar_url, region)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)
    if (error) { console.error('[getMoments]', error.message); return [] }

    // For each moment, get emoji reaction counts
    const moments = data || []
    for (const m of moments) {
        const { data: reactions } = await supabase
            .from('moment_likes')
            .select('emoji')
            .eq('moment_id', m.id)
        const counts = {}
        if (reactions) {
            reactions.forEach(r => {
                counts[r.emoji] = (counts[r.emoji] || 0) + 1
            })
        }
        m.reactions = counts
    }
    return moments
}

/** Post a new moment */
export const postMoment = async (userId, text, imageUrl = null) => {
    const { data, error } = await supabase
        .from('moments')
        .insert({ user_id: userId, text, image_url: imageUrl })
        .select(`
            id, text, image_url, likes_count, created_at,
            author:user_id(id, name, avatar_url, region)
        `)
        .single()
    if (error) { console.error('[postMoment]', error.message); return null }
    return data
}

/** Toggle like on a moment — triggers handle likes_count automatically */
export const toggleMomentLike = async (userId, momentId, currentlyLiked) => {
    if (currentlyLiked) {
        await supabase.from('moment_likes')
            .delete()
            .eq('user_id', userId)
            .eq('moment_id', momentId)
            .eq('emoji', '❤️')
    } else {
        await supabase.from('moment_likes')
            .insert({ user_id: userId, moment_id: momentId, emoji: '❤️' })
    }
}

/** Get user's reaction emoji for a moment */
export const getUserMomentReaction = async (userId, momentId) => {
    const { data } = await supabase
        .from('moment_likes')
        .select('emoji')
        .eq('user_id', userId)
        .eq('moment_id', momentId)
        .maybeSingle()
    return data?.emoji || null
}

/** Get moment IDs liked by current user */
export const getLikedMomentIds = async (userId) => {
    const { data } = await supabase
        .from('moment_likes')
        .select('moment_id')
        .eq('user_id', userId)
    return (data || []).map(r => r.moment_id)
}

/** Upload moment image */
export const uploadMomentImage = async (userId, file) => {
    const ext = file.name.split('.').pop()
    const path = `moments/${userId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage
        .from('moments')
        .upload(path, file, { upsert: false })
    if (error) {
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target.result)
            reader.onerror = () => resolve(null)
            reader.readAsDataURL(file)
        })
    }
    const { data } = supabase.storage.from('moments').getPublicUrl(path)
    return data.publicUrl
}

export const getMeetingHistory = async (userId) => {
    const { data, error } = await supabase
        .from('matches')
        .select(`
            id, created_at,
            user1:user1_id(id, name, avatar_url, about, gives, wants, balance, languages, region, wechat, whatsapp),
            user2:user2_id(id, name, avatar_url, about, gives, wants, balance, languages, region, wechat, whatsapp)
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('created_at', { ascending: false })
    if (error) { console.error('[getMeetingHistory]', error.message); return [] }
    return (data || []).map(m => {
        const partner = m.user1?.id === userId ? m.user2 : m.user1
        return { matchId: m.id, createdAt: m.created_at, partner }
    })
}
